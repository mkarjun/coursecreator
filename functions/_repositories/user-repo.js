// Repository: User, Streak, and Badge data access
// Pure D1 query layer — no business logic, no HTTP concepts

// ─── User Queries ────────────────────────────────────────────

export const UserRepo = {
    async findById(db, userId) {
        return await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    },

    async findByEmail(db, email) {
        return await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    },

    async findByIdOrEmail(db, id, email) {
        return await db.prepare(
            'SELECT id FROM users WHERE id = ? OR email = ?'
        ).bind(id, email).first();
    },

    async create(db, { id, email, name, avatar, provider }) {
        await db.prepare(`
            INSERT INTO users (id, email, name, avatar, provider)
            VALUES (?, ?, ?, ?, ?)
        `).bind(id, email, name, avatar, provider).run();
    },

    async updateProfile(db, { id, email, name, avatar }) {
        await db.prepare(`
            UPDATE users SET name = ?, avatar = ?, last_login = CURRENT_TIMESTAMP
            WHERE id = ? OR email = ?
        `).bind(name, avatar, id, email).run();
    },

    async updateLastLogin(db, userId) {
        await db.prepare(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(userId).run();
    },

    async getCourseCount(db, userId) {
        const result = await db.prepare(
            'SELECT COUNT(*) as count FROM courses WHERE user_id = ?'
        ).bind(userId).first();
        return result?.count || 0;
    },

    async getCompletedCount(db, userId) {
        const result = await db.prepare(
            'SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND percentage = 100'
        ).bind(userId).first();
        return result?.count || 0;
    },
};

// ─── Streak Queries ──────────────────────────────────────────

export const StreakRepo = {
    async findByUser(db, userId) {
        return await db.prepare(
            'SELECT * FROM streaks WHERE user_id = ?'
        ).bind(userId).first();
    },

    async create(db, userId, { currentStreak = 0, longestStreak = 0, lastActivityDate }) {
        await db.prepare(`
            INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
            VALUES (?, ?, ?, ?)
        `).bind(userId, currentStreak, longestStreak, lastActivityDate).run();
    },

    async update(db, userId, { currentStreak, longestStreak, lastActivityDate }) {
        await db.prepare(`
            UPDATE streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ?
            WHERE user_id = ?
        `).bind(currentStreak, longestStreak, lastActivityDate, userId).run();
    },
};

// ─── Badge Queries ───────────────────────────────────────────

export const BadgeRepo = {
    async findByUser(db, userId) {
        const result = await db.prepare(
            'SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?'
        ).bind(userId).all();
        return result.results || [];
    },

    async exists(db, userId, badgeId) {
        const result = await db.prepare(
            'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?'
        ).bind(userId, badgeId).first();
        return !!result;
    },

    async award(db, userId, badgeId) {
        await db.prepare(
            'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)'
        ).bind(userId, badgeId).run();
    },
};
