// Service: Data Cleanup
// Removes stale guest data, orphaned records, and enforces limits
// Called by HTTP endpoint (manual) or Cron Trigger (scheduled)

export const CleanupService = {
    /**
     * Run all cleanup tasks
     * @param {D1Database} db - D1 database binding
     * @returns {object} Summary of what was deleted
     */
    async run(db) {
        const results = {
            deletedCourses: 0,
            deletedGuestUsers: 0,
            timestamp: new Date().toISOString(),
        };

        // 1. Delete stale guest courses (not accessed in 30 days)
        const staleCourses = await db.prepare(`
            DELETE FROM courses 
            WHERE last_accessed < datetime('now', '-30 days')
            AND user_id IN (SELECT id FROM users WHERE provider = 'guest')
        `).run();
        results.deletedCourses = staleCourses.changes || 0;

        // 2. Delete inactive guest users (no login in 7 days)
        const guestUsers = await db.prepare(`
            DELETE FROM users 
            WHERE provider = 'guest' 
            AND last_login < datetime('now', '-7 days')
        `).run();
        results.deletedGuestUsers = guestUsers.changes || 0;

        // 3. Clean orphaned progress records
        await db.prepare(
            'DELETE FROM progress WHERE course_id NOT IN (SELECT id FROM courses)'
        ).run();

        // 4. Clean orphaned badges
        await db.prepare(
            'DELETE FROM user_badges WHERE user_id NOT IN (SELECT id FROM users)'
        ).run();

        // 5. Clean orphaned streaks
        await db.prepare(
            'DELETE FROM streaks WHERE user_id NOT IN (SELECT id FROM users)'
        ).run();

        // 6. Enforce per-user course limit (keep 20 most recent)
        await db.prepare(`
            DELETE FROM courses WHERE id IN (
                SELECT c1.id FROM courses c1
                WHERE (
                    SELECT COUNT(*) FROM courses c2 
                    WHERE c2.user_id = c1.user_id 
                    AND c2.last_accessed > c1.last_accessed
                ) >= 20
            )
        `).run();

        console.log('Cleanup completed:', results);
        return results;
    },
};
