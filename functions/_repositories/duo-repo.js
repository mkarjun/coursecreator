// Repository: Study Duo data access
// Pure D1 query layer — no business logic, no HTTP concepts

export const DuoRepo = {
    async ensureTable(db) {
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS study_duos (
                id TEXT PRIMARY KEY,
                creator_name TEXT NOT NULL,
                creator_id TEXT,
                partner_name TEXT,
                partner_id TEXT,
                topic TEXT NOT NULL,
                course_title TEXT NOT NULL,
                course_data TEXT NOT NULL,
                creator_quiz_score INTEGER,
                creator_quiz_answers TEXT,
                partner_quiz_score INTEGER,
                partner_quiz_answers TEXT,
                battle_id TEXT,
                status TEXT DEFAULT 'waiting',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `).run();
    },

    async create(db, { id, creatorName, creatorId, topic, courseTitle, courseData }) {
        const courseJson = typeof courseData === 'string' ? courseData : JSON.stringify(courseData);
        await db.prepare(`
            INSERT INTO study_duos (id, creator_name, creator_id, topic, course_title, course_data, status)
            VALUES (?, ?, ?, ?, ?, ?, 'waiting')
        `).bind(
            id,
            creatorName || 'Study Buddy',
            creatorId || null,
            topic,
            courseTitle || topic,
            courseJson
        ).run();
    },

    async findById(db, duoId) {
        return await db.prepare(
            'SELECT * FROM study_duos WHERE id = ?'
        ).bind(duoId).first();
    },

    async updateCreatorQuiz(db, duoId, { score, answers }) {
        await db.prepare(`
            UPDATE study_duos 
            SET creator_quiz_score = ?, creator_quiz_answers = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(score, JSON.stringify(answers || []), duoId).run();
    },

    async updatePartnerQuiz(db, duoId, { partnerName, partnerId, score, answers }) {
        await db.prepare(`
            UPDATE study_duos 
            SET partner_name = ?, partner_id = ?, partner_quiz_score = ?, partner_quiz_answers = ?,
                status = 'active', updated_at = datetime('now')
            WHERE id = ?
        `).bind(
            partnerName || 'Study Buddy',
            partnerId || null,
            score,
            JSON.stringify(answers || []),
            duoId
        ).run();
    },

    async linkBattle(db, duoId, battleId) {
        await db.prepare(`
            UPDATE study_duos SET battle_id = ?, status = 'completed', updated_at = datetime('now')
            WHERE id = ?
        `).bind(battleId, duoId).run();
    },
};
