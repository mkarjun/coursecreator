// Repository: Battle data access
// Pure D1 query layer — no business logic, no HTTP concepts

export const BattleRepo = {
    async ensureTable(db) {
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS battles (
                id TEXT PRIMARY KEY,
                challenger_name TEXT NOT NULL,
                challenger_id TEXT,
                topic TEXT NOT NULL,
                course_title TEXT,
                quiz_data TEXT NOT NULL,
                challenger_score INTEGER NOT NULL,
                challenger_answers TEXT NOT NULL,
                opponent_name TEXT,
                opponent_score INTEGER,
                opponent_answers TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT (datetime('now')),
                completed_at TEXT
            )
        `).run();
    },

    async create(db, { id, challengerName, challengerId, topic, courseTitle, quizData, challengerScore, challengerAnswers }) {
        await db.prepare(`
            INSERT INTO battles (id, challenger_name, challenger_id, topic, course_title, quiz_data, challenger_score, challenger_answers, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
            id,
            challengerName || 'Anonymous',
            challengerId || null,
            topic,
            courseTitle || topic,
            JSON.stringify(quizData),
            challengerScore,
            JSON.stringify(challengerAnswers || [])
        ).run();
    },

    async createCompleted(db, { id, challengerName, challengerId, topic, courseTitle, quizData, challengerScore, challengerAnswers, opponentName, opponentScore, opponentAnswers }) {
        await db.prepare(`
            INSERT INTO battles (id, challenger_name, challenger_id, topic, course_title, quiz_data, challenger_score, challenger_answers, opponent_name, opponent_score, opponent_answers, status, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
        `).bind(
            id,
            challengerName,
            challengerId,
            topic,
            courseTitle,
            JSON.stringify(quizData),
            challengerScore,
            challengerAnswers || '[]',
            opponentName || 'Study Buddy',
            opponentScore,
            opponentAnswers || '[]'
        ).run();
    },

    async findById(db, battleId) {
        return await db.prepare(
            'SELECT * FROM battles WHERE id = ?'
        ).bind(battleId).first();
    },

    async complete(db, battleId, { opponentName, opponentScore, opponentAnswers }) {
        await db.prepare(`
            UPDATE battles 
            SET opponent_name = ?, opponent_score = ?, opponent_answers = ?,
                status = 'completed', completed_at = datetime('now')
            WHERE id = ?
        `).bind(
            opponentName,
            opponentScore,
            JSON.stringify(opponentAnswers),
            battleId
        ).run();
    },
};
