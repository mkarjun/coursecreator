// Cloudflare Function: Course Management API
// Handles course CRUD operations

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { action, data } = await request.json();

        switch (action) {
            case 'create':
                return await createCourse(env.DB, data);
            case 'get':
                return await getCourse(env.DB, data.id, data.userId);
            case 'list':
                return await listCourses(env.DB, data.userId, data.limit);
            case 'delete':
                return await deleteCourse(env.DB, data.id, data.userId);
            case 'updateProgress':
                return await updateProgress(env.DB, data);
            case 'getProgress':
                return await getProgress(env.DB, data.userId, data.courseId);
            default:
                return jsonResponse({ error: 'Invalid action' }, 400);
        }
    } catch (error) {
        console.error('Course API error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

// Create a new course
async function createCourse(db, data) {
    const { id, userId, topic, title, content, difficulty } = data;
    
    // Check user's course count (limit to 20 active courses)
    const count = await db.prepare('SELECT COUNT(*) as count FROM courses WHERE user_id = ?')
        .bind(userId).first();
    
    if (count.count >= 20) {
        // Delete oldest course
        await db.prepare(`
            DELETE FROM courses WHERE id = (
                SELECT id FROM courses WHERE user_id = ? 
                ORDER BY last_accessed ASC LIMIT 1
            )
        `).bind(userId).run();
    }
    
    await db.prepare(`
        INSERT INTO courses (id, user_id, topic, title, content, difficulty)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, topic, title, JSON.stringify(content), difficulty || 'intermediate').run();
    
    // Initialize progress
    await db.prepare(`
        INSERT INTO progress (user_id, course_id) VALUES (?, ?)
    `).bind(userId, id).run();
    
    // Update streak
    await updateStreak(db, userId);
    
    return jsonResponse({ success: true, courseId: id });
}

// Get a single course with progress
async function getCourse(db, courseId, userId) {
    const course = await db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?')
        .bind(courseId, userId).first();
    
    if (!course) {
        return jsonResponse({ error: 'Course not found' }, 404);
    }
    
    // Update last accessed
    await db.prepare('UPDATE courses SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(courseId).run();
    
    const progress = await db.prepare('SELECT * FROM progress WHERE course_id = ? AND user_id = ?')
        .bind(courseId, userId).first();
    
    return jsonResponse({
        ...course,
        content: JSON.parse(course.content),
        progress: progress ? {
            percentage: progress.percentage,
            completedLessons: JSON.parse(progress.completed_lessons || '[]'),
            watchedVideos: JSON.parse(progress.watched_videos || '[]'),
            introCompleted: !!progress.intro_completed,
            quizCompleted: !!progress.quiz_completed,
            quizScore: progress.quiz_score
        } : null
    });
}

// List all courses for a user
async function listCourses(db, userId, limit = 50) {
    const courses = await db.prepare(`
        SELECT c.id, c.topic, c.title, c.difficulty, c.created_at, c.last_accessed,
               p.percentage, p.quiz_completed, p.quiz_score
        FROM courses c
        LEFT JOIN progress p ON c.id = p.course_id AND p.user_id = c.user_id
        WHERE c.user_id = ?
        ORDER BY c.last_accessed DESC
        LIMIT ?
    `).bind(userId, limit).all();
    
    return jsonResponse({ courses: courses.results || [] });
}

// Delete a course
async function deleteCourse(db, courseId, userId) {
    await db.prepare('DELETE FROM courses WHERE id = ? AND user_id = ?')
        .bind(courseId, userId).run();
    return jsonResponse({ success: true });
}

// Update course progress
async function updateProgress(db, data) {
    const { userId, courseId, progress } = data;
    
    await db.prepare(`
        UPDATE progress SET
            percentage = ?,
            completed_lessons = ?,
            watched_videos = ?,
            intro_completed = ?,
            quiz_completed = ?,
            quiz_score = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND course_id = ?
    `).bind(
        progress.percentage,
        JSON.stringify(progress.completedLessons || []),
        JSON.stringify(progress.watchedVideos || []),
        progress.introCompleted ? 1 : 0,
        progress.quizCompleted ? 1 : 0,
        progress.quizScore,
        userId,
        courseId
    ).run();
    
    // Update streak on activity
    await updateStreak(db, userId);
    
    // Check for new badges
    const newBadges = await checkBadges(db, userId);
    
    return jsonResponse({ success: true, newBadges });
}

// Get progress for a specific course
async function getProgress(db, userId, courseId) {
    const progress = await db.prepare('SELECT * FROM progress WHERE user_id = ? AND course_id = ?')
        .bind(userId, courseId).first();
    
    if (!progress) {
        return jsonResponse({ error: 'Progress not found' }, 404);
    }
    
    return jsonResponse({
        percentage: progress.percentage,
        completedLessons: JSON.parse(progress.completed_lessons || '[]'),
        watchedVideos: JSON.parse(progress.watched_videos || '[]'),
        introCompleted: !!progress.intro_completed,
        quizCompleted: !!progress.quiz_completed,
        quizScore: progress.quiz_score
    });
}

// Update user streak
async function updateStreak(db, userId) {
    const streak = await db.prepare('SELECT * FROM streaks WHERE user_id = ?').bind(userId).first();
    const today = new Date().toISOString().split('T')[0];
    
    if (!streak) {
        await db.prepare(`
            INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
            VALUES (?, 1, 1, ?)
        `).bind(userId, today).run();
        return;
    }
    
    const lastDate = streak.last_activity_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = streak.current_streak;
    
    if (lastDate === today) {
        // Already logged today
        return;
    } else if (lastDate === yesterday) {
        // Consecutive day
        newStreak = streak.current_streak + 1;
    } else {
        // Streak broken
        newStreak = 1;
    }
    
    const longestStreak = Math.max(newStreak, streak.longest_streak);
    
    await db.prepare(`
        UPDATE streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ?
        WHERE user_id = ?
    `).bind(newStreak, longestStreak, today, userId).run();
}

// Check and award badges
async function checkBadges(db, userId) {
    const newBadges = [];
    
    // Get user stats
    const completedCourses = await db.prepare(`
        SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND percentage = 100
    `).bind(userId).first();
    
    const perfectQuizzes = await db.prepare(`
        SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND quiz_score = 100
    `).bind(userId).first();
    
    const streak = await db.prepare('SELECT current_streak FROM streaks WHERE user_id = ?')
        .bind(userId).first();
    
    const watchedVideos = await db.prepare(`
        SELECT watched_videos FROM progress WHERE user_id = ?
    `).bind(userId).all();
    
    let totalVideos = 0;
    for (const row of watchedVideos.results || []) {
        totalVideos += JSON.parse(row.watched_videos || '[]').length;
    }
    
    // Badge definitions
    const badges = [
        { id: 'first_course', check: completedCourses.count >= 1 },
        { id: 'five_courses', check: completedCourses.count >= 5 },
        { id: 'ten_courses', check: completedCourses.count >= 10 },
        { id: 'perfect_quiz', check: perfectQuizzes.count >= 1 },
        { id: 'five_perfect', check: perfectQuizzes.count >= 5 },
        { id: 'streak_3', check: (streak?.current_streak || 0) >= 3 },
        { id: 'streak_7', check: (streak?.current_streak || 0) >= 7 },
        { id: 'all_videos', check: totalVideos >= 50 }
    ];
    
    // Award new badges
    for (const badge of badges) {
        if (badge.check) {
            const existing = await db.prepare(
                'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?'
            ).bind(userId, badge.id).first();
            
            if (!existing) {
                await db.prepare(
                    'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)'
                ).bind(userId, badge.id).run();
                newBadges.push(badge.id);
            }
        }
    }
    
    return newBadges;
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}
