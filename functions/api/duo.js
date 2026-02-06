// Cloudflare Function: Study Duo API
// Handles creating & joining study duos — shared courses with auto-battle

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const action = body.action;
        const data = body.data || {};

        if (!env.DB) {
            return jsonResponse({ error: 'Database not configured' }, 500);
        }

        // Create table if needed (wrapped in try-catch to not block)
        try {
            await ensureDuoTable(env.DB);
        } catch (tableErr) {
            console.error('Table creation warning:', tableErr);
            // Table might already exist, continue
        }

        switch (action) {
            case 'create':
                return await createDuo(env.DB, data);
            case 'get':
                return await getDuo(env.DB, data.duoId);
            case 'quiz_complete':
                return await handleQuizComplete(env.DB, env, data);
            default:
                return jsonResponse({ error: 'Invalid action: ' + action }, 400);
        }
    } catch (error) {
        console.error('Duo API error:', error.message, error.stack);
        return jsonResponse({ error: 'Server error: ' + error.message }, 500);
    }
}

async function ensureDuoTable(db) {
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
}

// Create a new study duo — stores the full course for the partner
async function createDuo(db, data) {
    if (!data.topic || !data.courseData) {
        return jsonResponse({ error: 'Missing required fields: topic and courseData are required' }, 400);
    }

    const id = generateDuoId();
    const courseJson = typeof data.courseData === 'string' ? data.courseData : JSON.stringify(data.courseData);

    try {
        await db.prepare(`
            INSERT INTO study_duos (id, creator_name, creator_id, topic, course_title, course_data, status)
            VALUES (?, ?, ?, ?, ?, ?, 'waiting')
        `).bind(
            id,
            data.creatorName || 'Study Buddy',
            data.creatorId || null,
            data.topic,
            data.courseTitle || data.topic,
            courseJson
        ).run();

        return jsonResponse({ duoId: id, success: true });
    } catch (insertErr) {
        console.error('Duo insert error:', insertErr.message);
        return jsonResponse({ error: 'Failed to save duo: ' + insertErr.message }, 500);
    }
}

// Get duo data — partner loads the shared course from here
async function getDuo(db, duoId) {
    if (!duoId) return jsonResponse({ error: 'Duo ID required' }, 400);

    const duo = await db.prepare('SELECT * FROM study_duos WHERE id = ?').bind(duoId).first();
    if (!duo) return jsonResponse({ error: 'Study duo not found' }, 404);

    const result = {
        id: duo.id,
        creatorName: duo.creator_name,
        topic: duo.topic,
        courseTitle: duo.course_title,
        courseData: JSON.parse(duo.course_data),
        status: duo.status,
        createdAt: duo.created_at,
    };

    // Include scores if quiz(es) have been completed
    if (duo.creator_quiz_score !== null) {
        result.creatorQuizScore = duo.creator_quiz_score;
    }
    if (duo.partner_quiz_score !== null) {
        result.partnerName = duo.partner_name;
        result.partnerQuizScore = duo.partner_quiz_score;
    }
    if (duo.battle_id) {
        result.battleId = duo.battle_id;
    }

    return jsonResponse(result);
}

// Handle quiz completion — store score and auto-create battle when both are done
async function handleQuizComplete(db, env, data) {
    if (!data.duoId || data.score === undefined || !data.role) {
        return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const duo = await db.prepare('SELECT * FROM study_duos WHERE id = ?').bind(data.duoId).first();
    if (!duo) return jsonResponse({ error: 'Study duo not found' }, 404);

    if (data.role === 'creator') {
        await db.prepare(`
            UPDATE study_duos 
            SET creator_quiz_score = ?, creator_quiz_answers = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(data.score, JSON.stringify(data.answers || []), data.duoId).run();
    } else {
        await db.prepare(`
            UPDATE study_duos 
            SET partner_name = ?, partner_id = ?, partner_quiz_score = ?, partner_quiz_answers = ?,
                status = 'active', updated_at = datetime('now')
            WHERE id = ?
        `).bind(
            data.partnerName || 'Study Buddy',
            data.partnerId || null,
            data.score,
            JSON.stringify(data.answers || []),
            data.duoId
        ).run();
    }

    // Re-fetch to check if both have completed
    const updated = await db.prepare('SELECT * FROM study_duos WHERE id = ?').bind(data.duoId).first();

    if (updated.creator_quiz_score !== null && updated.partner_quiz_score !== null && !updated.battle_id) {
        // Both done! Auto-create a battle
        const courseData = JSON.parse(updated.course_data);
        const quizData = courseData.quiz || [];
        const battleId = generateDuoId();

        // Ensure battles table exists
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

        await db.prepare(`
            INSERT INTO battles (id, challenger_name, challenger_id, topic, course_title, quiz_data, challenger_score, challenger_answers, opponent_name, opponent_score, opponent_answers, status, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
        `).bind(
            battleId,
            updated.creator_name,
            updated.creator_id,
            updated.topic,
            updated.course_title,
            JSON.stringify(quizData),
            updated.creator_quiz_score,
            updated.creator_quiz_answers || '[]',
            updated.partner_name || 'Study Buddy',
            updated.partner_quiz_score,
            updated.partner_quiz_answers || '[]'
        ).run();

        // Link battle to duo
        await db.prepare(`
            UPDATE study_duos SET battle_id = ?, status = 'completed', updated_at = datetime('now') WHERE id = ?
        `).bind(battleId, data.duoId).run();

        return jsonResponse({
            success: true,
            battleReady: true,
            battleId: battleId,
            creatorName: updated.creator_name,
            creatorScore: updated.creator_quiz_score,
            partnerName: updated.partner_name,
            partnerScore: updated.partner_quiz_score,
        });
    }

    return jsonResponse({
        success: true,
        battleReady: false,
        waitingFor: updated.creator_quiz_score === null ? 'creator' : 'partner',
    });
}

function generateDuoId() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}
