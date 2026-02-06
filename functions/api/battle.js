// Cloudflare Function: Learning Battles API
// Handles 1v1 quiz challenges with shareable links

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

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}

// All battle operations via POST with action parameter
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { action, data } = await request.json();

        if (!env.DB) {
            return jsonResponse({ error: 'Database not configured' }, 500);
        }

        // Ensure battles table exists
        await ensureBattleTable(env.DB);

        switch (action) {
            case 'create':
                return await createBattle(env.DB, data);
            case 'get':
                return await getBattle(env.DB, data.battleId);
            case 'submit':
                return await submitBattle(env.DB, data);
            default:
                return jsonResponse({ error: 'Invalid action' }, 400);
        }
    } catch (error) {
        console.error('Battle API error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

// Auto-create battles table if not exists
async function ensureBattleTable(db) {
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
}

// Create a new battle challenge
async function createBattle(db, data) {
    if (!data.topic || !data.quizData || data.challengerScore === undefined) {
        return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const id = generateBattleId();

    await db.prepare(`
        INSERT INTO battles (id, challenger_name, challenger_id, topic, course_title, quiz_data, challenger_score, challenger_answers, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
        id,
        data.challengerName || 'Anonymous',
        data.challengerId || null,
        data.topic,
        data.courseTitle || data.topic,
        JSON.stringify(data.quizData),
        data.challengerScore,
        JSON.stringify(data.challengerAnswers || [])
    ).run();

    return jsonResponse({ battleId: id, success: true });
}

// Get battle data
async function getBattle(db, battleId) {
    if (!battleId) {
        return jsonResponse({ error: 'Battle ID required' }, 400);
    }

    const battle = await db.prepare(
        'SELECT * FROM battles WHERE id = ?'
    ).bind(battleId).first();

    if (!battle) {
        return jsonResponse({ error: 'Battle not found' }, 404);
    }

    // Base response
    const result = {
        id: battle.id,
        challengerName: battle.challenger_name,
        topic: battle.topic,
        courseTitle: battle.course_title,
        status: battle.status,
        createdAt: battle.created_at,
        quizData: JSON.parse(battle.quiz_data),
    };

    // Strip correct answers from quiz data if battle is pending (opponent taking quiz)
    if (battle.status === 'pending') {
        result.quizData = result.quizData.map(q => ({
            question: q.question,
            options: q.options,
            // Don't send correctIndex or explanation yet
        }));
    }

    // Include full results only when battle is completed
    if (battle.status === 'completed') {
        result.challengerScore = battle.challenger_score;
        result.opponentName = battle.opponent_name;
        result.opponentScore = battle.opponent_score;
        result.completedAt = battle.completed_at;
        // Include correct answers for review
        result.quizData = JSON.parse(battle.quiz_data);
    }

    return jsonResponse(result);
}

// Submit opponent's answers and complete the battle
async function submitBattle(db, data) {
    if (!data.battleId || !data.opponentName || data.opponentScore === undefined) {
        return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const battle = await db.prepare(
        'SELECT * FROM battles WHERE id = ?'
    ).bind(data.battleId).first();

    if (!battle) {
        return jsonResponse({ error: 'Battle not found' }, 404);
    }

    if (battle.status === 'completed') {
        return jsonResponse({
            alreadyCompleted: true,
            challengerName: battle.challenger_name,
            challengerScore: battle.challenger_score,
            opponentName: battle.opponent_name,
            opponentScore: battle.opponent_score,
            topic: battle.topic,
        });
    }

    // Score the answers server-side for integrity
    const quizData = JSON.parse(battle.quiz_data);
    const answers = data.opponentAnswers || [];
    let correct = 0;
    quizData.forEach((q, i) => {
        if (answers[i] === q.correctIndex) correct++;
    });
    const verifiedScore = Math.round((correct / quizData.length) * 100);

    await db.prepare(`
        UPDATE battles 
        SET opponent_name = ?, opponent_score = ?, opponent_answers = ?,
            status = 'completed', completed_at = datetime('now')
        WHERE id = ?
    `).bind(
        data.opponentName,
        verifiedScore,
        JSON.stringify(answers),
        data.battleId
    ).run();

    return jsonResponse({
        success: true,
        challengerName: battle.challenger_name,
        challengerScore: battle.challenger_score,
        opponentName: data.opponentName,
        opponentScore: verifiedScore,
        topic: battle.topic,
        courseTitle: battle.course_title,
        quizData: quizData, // Full quiz with answers for results review
    });
}

// Generate a short, readable battle ID
function generateBattleId() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}
