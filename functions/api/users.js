// Cloudflare Function: User Management API
// Handles user CRUD and authentication

export async function onRequestPost(context) {
    const { request, env } = context;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        const { action, data } = await request.json();

        switch (action) {
            case 'upsert':
                return await upsertUser(env.DB, data, corsHeaders);
            case 'get':
                return await getUser(env.DB, data.id, corsHeaders);
            case 'getByEmail':
                return await getUserByEmail(env.DB, data.email, corsHeaders);
            case 'updateLastLogin':
                return await updateLastLogin(env.DB, data.id, corsHeaders);
            case 'getStats':
                return await getUserStats(env.DB, data.id, corsHeaders);
            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Create or update user (for OAuth login)
async function upsertUser(db, userData, corsHeaders) {
    const { id, email, name, avatar, provider } = userData;
    
    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE id = ? OR email = ?')
        .bind(id, email).first();
    
    if (existing) {
        // Update existing user
        await db.prepare(`
            UPDATE users SET name = ?, avatar = ?, last_login = CURRENT_TIMESTAMP
            WHERE id = ? OR email = ?
        `).bind(name, avatar, id, email).run();
        
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        return jsonResponse({ user, isNew: false }, corsHeaders);
    } else {
        // Create new user
        await db.prepare(`
            INSERT INTO users (id, email, name, avatar, provider)
            VALUES (?, ?, ?, ?, ?)
        `).bind(id, email, name, avatar, provider).run();
        
        // Initialize streak
        await db.prepare(`
            INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
            VALUES (?, 0, 0, DATE('now'))
        `).bind(id).run();
        
        const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
        return jsonResponse({ user, isNew: true }, corsHeaders);
    }
}

// Get user by ID
async function getUser(db, userId, corsHeaders) {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
        return jsonResponse({ error: 'User not found' }, corsHeaders, 404);
    }
    return jsonResponse({ user }, corsHeaders);
}

// Get user by email
async function getUserByEmail(db, email, corsHeaders) {
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
        return jsonResponse({ error: 'User not found' }, corsHeaders, 404);
    }
    return jsonResponse({ user }, corsHeaders);
}

// Update last login timestamp
async function updateLastLogin(db, userId, corsHeaders) {
    await db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(userId).run();
    return jsonResponse({ success: true }, corsHeaders);
}

// Get user statistics
async function getUserStats(db, userId, corsHeaders) {
    const coursesCount = await db.prepare('SELECT COUNT(*) as count FROM courses WHERE user_id = ?')
        .bind(userId).first();
    
    const completedCount = await db.prepare(`
        SELECT COUNT(*) as count FROM progress 
        WHERE user_id = ? AND percentage = 100
    `).bind(userId).first();
    
    const badges = await db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?')
        .bind(userId).all();
    
    const streak = await db.prepare('SELECT * FROM streaks WHERE user_id = ?')
        .bind(userId).first();
    
    return jsonResponse({
        totalCourses: coursesCount?.count || 0,
        completedCourses: completedCount?.count || 0,
        badges: badges?.results?.map(b => b.badge_id) || [],
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0
    }, corsHeaders);
}

function jsonResponse(data, corsHeaders, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
