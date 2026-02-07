// Repository: Course, Progress, and Video Timestamp data access
// Pure D1 query layer — no business logic, no HTTP concepts

import { safeJsonParse } from '../_shared/utils.js';

// ─── Course Queries ──────────────────────────────────────────

export const CourseRepo = {
    async countByUser(db, userId) {
        const result = await db.prepare(
            'SELECT COUNT(*) as count FROM courses WHERE user_id = ?'
        ).bind(userId).first();
        return result.count;
    },

    async deleteOldest(db, userId) {
        await db.prepare(`
            DELETE FROM courses WHERE id = (
                SELECT id FROM courses WHERE user_id = ? 
                ORDER BY last_accessed ASC LIMIT 1
            )
        `).bind(userId).run();
    },

    async create(db, { id, userId, topic, title, content, difficulty }) {
        await db.prepare(`
            INSERT INTO courses (id, user_id, topic, title, content, difficulty)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(id, userId, topic, title, JSON.stringify(content), difficulty || 'intermediate').run();
    },

    async findById(db, courseId, userId) {
        return await db.prepare(
            'SELECT * FROM courses WHERE id = ? AND user_id = ?'
        ).bind(courseId, userId).first();
    },

    async updateLastAccessed(db, courseId) {
        await db.prepare(
            'UPDATE courses SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(courseId).run();
    },

    async listByUser(db, userId, limit = 50) {
        const result = await db.prepare(`
            SELECT c.id, c.topic, c.title, c.difficulty, c.created_at, c.last_accessed,
                   p.percentage, p.quiz_completed, p.quiz_score
            FROM courses c
            LEFT JOIN progress p ON c.id = p.course_id AND p.user_id = c.user_id
            WHERE c.user_id = ?
            ORDER BY c.last_accessed DESC
            LIMIT ?
        `).bind(userId, limit).all();
        return result.results || [];
    },

    async deleteById(db, courseId, userId) {
        await db.prepare(
            'DELETE FROM courses WHERE id = ? AND user_id = ?'
        ).bind(courseId, userId).run();
    },

    async getAllWithProgress(db, userId) {
        const result = await db.prepare(`
            SELECT c.*, p.percentage, p.completed_lessons, p.watched_videos, 
                   p.intro_completed, p.quiz_completed, p.quiz_score
            FROM courses c
            LEFT JOIN progress p ON c.id = p.course_id AND p.user_id = c.user_id
            WHERE c.user_id = ?
            ORDER BY c.last_accessed DESC
        `).bind(userId).all();
        return result.results || [];
    },
};

// ─── Progress Queries ────────────────────────────────────────

export const ProgressRepo = {
    async create(db, userId, courseId) {
        await db.prepare(
            'INSERT INTO progress (user_id, course_id) VALUES (?, ?)'
        ).bind(userId, courseId).run();
    },

    async findByCourse(db, userId, courseId) {
        return await db.prepare(
            'SELECT * FROM progress WHERE user_id = ? AND course_id = ?'
        ).bind(userId, courseId).first();
    },

    async update(db, userId, courseId, progress) {
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
    },

    async getCompletedCount(db, userId) {
        const result = await db.prepare(
            'SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND percentage = 100'
        ).bind(userId).first();
        return result.count;
    },

    async getPerfectQuizCount(db, userId) {
        const result = await db.prepare(
            'SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND quiz_score = 100'
        ).bind(userId).first();
        return result.count;
    },

    async getTotalWatchedVideos(db, userId) {
        const result = await db.prepare(
            'SELECT watched_videos FROM progress WHERE user_id = ?'
        ).bind(userId).all();
        let total = 0;
        for (const row of result.results || []) {
            total += safeJsonParse(row.watched_videos, []).length;
        }
        return total;
    },
};

// ─── Video Timestamp Queries ─────────────────────────────────

export const VideoTimestampRepo = {
    async save(db, { userId, courseId, videoId, timestamp, duration, completed }) {
        await db.prepare(`
            INSERT INTO video_timestamps (user_id, course_id, video_id, timestamp_seconds, duration_seconds, completed, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, course_id, video_id) DO UPDATE SET
                timestamp_seconds = excluded.timestamp_seconds,
                duration_seconds = excluded.duration_seconds,
                completed = excluded.completed,
                updated_at = CURRENT_TIMESTAMP
        `).bind(userId, courseId, videoId, timestamp || 0, duration || 0, completed ? 1 : 0).run();
    },

    async getByCourse(db, userId, courseId) {
        const result = await db.prepare(
            'SELECT video_id, timestamp_seconds, duration_seconds, completed FROM video_timestamps WHERE user_id = ? AND course_id = ?'
        ).bind(userId, courseId).all();
        return (result.results || []).reduce((acc, t) => {
            acc[t.video_id] = {
                timestamp: t.timestamp_seconds,
                duration: t.duration_seconds,
                completed: !!t.completed,
            };
            return acc;
        }, {});
    },

    async getAllByUser(db, userId) {
        const result = await db.prepare(
            'SELECT course_id, video_id, timestamp_seconds, duration_seconds, completed FROM video_timestamps WHERE user_id = ?'
        ).bind(userId).all();
        return (result.results || []).reduce((acc, t) => {
            if (!acc[t.course_id]) acc[t.course_id] = {};
            acc[t.course_id][t.video_id] = {
                timestamp: t.timestamp_seconds,
                duration: t.duration_seconds,
                completed: !!t.completed,
            };
            return acc;
        }, {});
    },
};
