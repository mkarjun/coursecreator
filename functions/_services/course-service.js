// Service: Course Management
// Business logic for course CRUD, progress tracking, streaks, and badges
// Orchestrates repositories — no HTTP concepts, no D1 SQL

import { CourseRepo, ProgressRepo, VideoTimestampRepo } from '../_repositories/course-repo.js';
import { StreakRepo, BadgeRepo } from '../_repositories/user-repo.js';
import { NotFoundError } from '../_shared/validators.js';
import { safeJsonParse } from '../_shared/utils.js';

const MAX_COURSES_PER_USER = 20;

export const CourseService = {
    /**
     * Create a new course — enforces per-user limit, initializes progress, updates streak
     */
    async create(db, data) {
        const { id, userId, topic, title, content, difficulty } = data;

        // Enforce course limit — delete oldest if at cap
        const count = await CourseRepo.countByUser(db, userId);
        if (count >= MAX_COURSES_PER_USER) {
            await CourseRepo.deleteOldest(db, userId);
        }

        await CourseRepo.create(db, { id, userId, topic, title, content, difficulty });
        await ProgressRepo.create(db, userId, id);
        await this._updateStreak(db, userId);

        return { success: true, courseId: id };
    },

    /**
     * Get a single course with its progress data
     */
    async get(db, courseId, userId) {
        const course = await CourseRepo.findById(db, courseId, userId);
        if (!course) throw new NotFoundError('Course not found');

        await CourseRepo.updateLastAccessed(db, courseId);
        const progress = await ProgressRepo.findByCourse(db, userId, courseId);

        return {
            ...course,
            content: safeJsonParse(course.content),
            progress: progress ? {
                percentage: progress.percentage,
                completedLessons: safeJsonParse(progress.completed_lessons, []),
                watchedVideos: safeJsonParse(progress.watched_videos, []),
                introCompleted: !!progress.intro_completed,
                quizCompleted: !!progress.quiz_completed,
                quizScore: progress.quiz_score,
            } : null,
        };
    },

    /**
     * List all courses for a user (summary view, no full content)
     */
    async list(db, userId, limit) {
        const courses = await CourseRepo.listByUser(db, userId, limit);
        return { courses };
    },

    /**
     * Delete a course
     */
    async delete(db, courseId, userId) {
        await CourseRepo.deleteById(db, courseId, userId);
        return { success: true };
    },

    /**
     * Update course progress — also updates streak and checks for new badges
     */
    async updateProgress(db, data) {
        const { userId, courseId, progress } = data;

        await ProgressRepo.update(db, userId, courseId, progress);
        await this._updateStreak(db, userId);
        const newBadges = await this._checkBadges(db, userId);

        return { success: true, newBadges };
    },

    /**
     * Get progress for a specific course including video timestamps
     */
    async getProgress(db, userId, courseId) {
        const progress = await ProgressRepo.findByCourse(db, userId, courseId);
        if (!progress) throw new NotFoundError('Progress not found');

        const videoTimestamps = await VideoTimestampRepo.getByCourse(db, userId, courseId);

        return {
            percentage: progress.percentage,
            completedLessons: safeJsonParse(progress.completed_lessons, []),
            watchedVideos: safeJsonParse(progress.watched_videos, []),
            introCompleted: !!progress.intro_completed,
            quizCompleted: !!progress.quiz_completed,
            quizScore: progress.quiz_score,
            videoTimestamps,
        };
    },

    /**
     * Save where user left off in a video
     */
    async saveVideoTimestamp(db, data) {
        await VideoTimestampRepo.save(db, data);
        return { success: true };
    },

    /**
     * Get all video timestamps for a course
     */
    async getVideoTimestamps(db, userId, courseId) {
        const timestamps = await VideoTimestampRepo.getByCourse(db, userId, courseId);
        return { timestamps };
    },

    /**
     * Get all user data for session restore on login
     * Returns courses, progress, video timestamps, badges, and streak
     */
    async getAllUserData(db, userId) {
        const courses = await CourseRepo.getAllWithProgress(db, userId);
        const timestampsByCourse = await VideoTimestampRepo.getAllByUser(db, userId);
        const badges = await BadgeRepo.findByUser(db, userId);
        const streak = await StreakRepo.findByUser(db, userId);

        const formattedCourses = courses.map(c => ({
            id: c.id,
            topic: c.topic,
            title: c.title,
            content: safeJsonParse(c.content),
            difficulty: c.difficulty,
            createdAt: c.created_at,
            lastAccessed: c.last_accessed,
            progress: {
                percentage: c.percentage || 0,
                completedLessons: safeJsonParse(c.completed_lessons, []),
                watchedVideos: safeJsonParse(c.watched_videos, []),
                introCompleted: !!c.intro_completed,
                quizCompleted: !!c.quiz_completed,
                quizScore: c.quiz_score,
            },
            videoTimestamps: timestampsByCourse[c.id] || {},
        }));

        return {
            courses: formattedCourses,
            badges: badges.map(b => ({ id: b.badge_id, earnedAt: b.earned_at })),
            streak: {
                current: streak?.current_streak || 0,
                longest: streak?.longest_streak || 0,
                lastActivity: streak?.last_activity_date,
            },
        };
    },

    // ─── Internal Helpers ────────────────────────────────────

    /**
     * Update the user's learning streak
     */
    async _updateStreak(db, userId) {
        const streak = await StreakRepo.findByUser(db, userId);
        const today = new Date().toISOString().split('T')[0];

        if (!streak) {
            await StreakRepo.create(db, userId, {
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: today,
            });
            return;
        }

        // Already logged today — no change
        if (streak.last_activity_date === today) return;

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = streak.last_activity_date === yesterday
            ? streak.current_streak + 1
            : 1; // streak broken

        await StreakRepo.update(db, userId, {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longest_streak),
            lastActivityDate: today,
        });
    },

    /**
     * Check and award any newly-earned badges
     * @returns {string[]} Array of newly awarded badge IDs
     */
    async _checkBadges(db, userId) {
        const newBadges = [];

        const completedCount = await ProgressRepo.getCompletedCount(db, userId);
        const perfectCount = await ProgressRepo.getPerfectQuizCount(db, userId);
        const streak = await StreakRepo.findByUser(db, userId);
        const totalVideos = await ProgressRepo.getTotalWatchedVideos(db, userId);

        const badgeRules = [
            { id: 'first_course', check: completedCount >= 1 },
            { id: 'five_courses', check: completedCount >= 5 },
            { id: 'ten_courses', check: completedCount >= 10 },
            { id: 'perfect_quiz', check: perfectCount >= 1 },
            { id: 'five_perfect', check: perfectCount >= 5 },
            { id: 'streak_3', check: (streak?.current_streak || 0) >= 3 },
            { id: 'streak_7', check: (streak?.current_streak || 0) >= 7 },
            { id: 'all_videos', check: totalVideos >= 50 },
        ];

        for (const badge of badgeRules) {
            if (badge.check && !(await BadgeRepo.exists(db, userId, badge.id))) {
                await BadgeRepo.award(db, userId, badge.id);
                newBadges.push(badge.id);
            }
        }

        return newBadges;
    },
};
