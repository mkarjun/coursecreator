// Service: User Management
// Business logic for user lifecycle, stats, and authentication support
// Orchestrates repositories — no HTTP concepts, no D1 SQL

import { UserRepo, StreakRepo, BadgeRepo } from '../_repositories/user-repo.js';
import { NotFoundError } from '../_shared/validators.js';

export const UserService = {
    /**
     * Create or update user on OAuth login
     * Returns { user, isNew } so the frontend knows whether to show onboarding
     */
    async upsert(db, userData) {
        const { id, email, name, avatar, provider } = userData;
        const existing = await UserRepo.findByIdOrEmail(db, id, email);

        if (existing) {
            await UserRepo.updateProfile(db, { id, email, name, avatar });
            const user = await UserRepo.findByEmail(db, email);
            return { user, isNew: false };
        } else {
            await UserRepo.create(db, { id, email, name, avatar, provider });
            await StreakRepo.create(db, id, {
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: new Date().toISOString().split('T')[0],
            });
            const user = await UserRepo.findById(db, id);
            return { user, isNew: true };
        }
    },

    /**
     * Get user by ID
     */
    async get(db, userId) {
        const user = await UserRepo.findById(db, userId);
        if (!user) throw new NotFoundError('User not found');
        return { user };
    },

    /**
     * Get user by email
     */
    async getByEmail(db, email) {
        const user = await UserRepo.findByEmail(db, email);
        if (!user) throw new NotFoundError('User not found');
        return { user };
    },

    /**
     * Update last login timestamp
     */
    async updateLastLogin(db, userId) {
        await UserRepo.updateLastLogin(db, userId);
        return { success: true };
    },

    /**
     * Get aggregated user statistics for profile display
     */
    async getStats(db, userId) {
        const totalCourses = await UserRepo.getCourseCount(db, userId);
        const completedCourses = await UserRepo.getCompletedCount(db, userId);
        const badges = await BadgeRepo.findByUser(db, userId);
        const streak = await StreakRepo.findByUser(db, userId);

        return {
            totalCourses,
            completedCourses,
            badges: badges.map(b => b.badge_id),
            currentStreak: streak?.current_streak || 0,
            longestStreak: streak?.longest_streak || 0,
        };
    },
};
