// Cloudflare Function: Data Cleanup (Scheduled)
// Removes stale data to prevent database bloat
// Set up as a Cron Trigger: 0 0 * * * (daily at midnight)

export async function onRequest(context) {
    const { env } = context;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    try {
        const results = await cleanupStaleData(env.DB);
        return new Response(JSON.stringify(results), { headers: corsHeaders });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function cleanupStaleData(db) {
    const results = {
        deletedCourses: 0,
        deletedGuestUsers: 0,
        timestamp: new Date().toISOString()
    };

    // 1. Delete courses not accessed in 30 days (for non-premium users)
    const staleCourses = await db.prepare(`
        DELETE FROM courses 
        WHERE last_accessed < datetime('now', '-30 days')
        AND user_id IN (SELECT id FROM users WHERE provider = 'guest')
    `).run();
    results.deletedCourses = staleCourses.changes || 0;

    // 2. Delete guest users who haven't logged in for 7 days
    const guestUsers = await db.prepare(`
        DELETE FROM users 
        WHERE provider = 'guest' 
        AND last_login < datetime('now', '-7 days')
    `).run();
    results.deletedGuestUsers = guestUsers.changes || 0;

    // 3. Delete orphaned progress records
    await db.prepare(`
        DELETE FROM progress 
        WHERE course_id NOT IN (SELECT id FROM courses)
    `).run();

    // 4. Delete orphaned badges
    await db.prepare(`
        DELETE FROM user_badges 
        WHERE user_id NOT IN (SELECT id FROM users)
    `).run();

    // 5. Delete orphaned streaks
    await db.prepare(`
        DELETE FROM streaks 
        WHERE user_id NOT IN (SELECT id FROM users)
    `).run();

    // 6. Limit courses per user to 20 (keep most recent)
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
}

// Also callable via scheduled trigger
export async function scheduled(event, env, ctx) {
    ctx.waitUntil(cleanupStaleData(env.DB));
}
