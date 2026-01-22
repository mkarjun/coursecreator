// Database Service - Handles all API calls to Cloudflare D1
// For logged-in users: data stored in D1 database
// For guests: data stored in sessionStorage (clears on tab close)

const DatabaseService = {
    currentUser: null,
    isGuest: false,

    // Initialize service with user
    init(user, isGuest = false) {
        this.currentUser = user;
        this.isGuest = isGuest;
        
        if (isGuest) {
            console.log('🔓 Guest mode: using sessionStorage');
        } else {
            console.log('🔐 Logged in: using cloud database');
        }
    },

    // Check if using guest mode
    isGuestMode() {
        return this.isGuest || !this.currentUser;
    },

    // ============ USER OPERATIONS ============

    // Create or update user on login
    async upsertUser(userData) {
        if (this.isGuestMode()) {
            const guestUser = {
                id: `guest_${Date.now()}`,
                email: 'guest@local',
                name: 'Guest User',
                provider: 'guest',
                ...userData
            };
            sessionStorage.setItem('guestUser', JSON.stringify(guestUser));
            return { user: guestUser, isNew: true };
        }

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'upsert', data: userData })
        });
        return response.json();
    },

    // Get user stats (courses, badges, streak)
    async getUserStats() {
        if (this.isGuestMode()) {
            const courses = this.getGuestCourses();
            const completedCourses = courses.filter(c => c.progress?.percentage === 100);
            return {
                totalCourses: courses.length,
                completedCourses: completedCourses.length,
                badges: JSON.parse(sessionStorage.getItem('guestBadges') || '[]'),
                currentStreak: parseInt(sessionStorage.getItem('guestStreak') || '0'),
                longestStreak: parseInt(sessionStorage.getItem('guestLongestStreak') || '0')
            };
        }

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getStats', data: { id: this.currentUser.id } })
        });
        return response.json();
    },

    // ============ COURSE OPERATIONS ============

    // Save a new course
    async saveCourse(course) {
        if (this.isGuestMode()) {
            const courses = this.getGuestCourses();
            // Limit to 5 courses for guests
            if (courses.length >= 5) {
                courses.shift(); // Remove oldest
            }
            courses.push(course);
            sessionStorage.setItem('guestCourses', JSON.stringify(courses));
            return { success: true, courseId: course.id };
        }

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                data: {
                    id: course.id,
                    userId: this.currentUser.id,
                    topic: course.topic,
                    title: course.title,
                    content: {
                        introduction: course.introduction,
                        lessons: course.lessons,
                        quiz: course.quiz,
                        notes: course.notes
                    },
                    difficulty: course.difficulty
                }
            })
        });
        return response.json();
    },

    // Get a single course
    async getCourse(courseId) {
        if (this.isGuestMode()) {
            const courses = this.getGuestCourses();
            return courses.find(c => c.id === courseId);
        }

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get',
                data: { id: courseId, userId: this.currentUser.id }
            })
        });
        const data = await response.json();
        
        if (data.error) return null;
        
        // Transform from DB format to app format
        return {
            id: data.id,
            topic: data.topic,
            title: data.title,
            introduction: data.content.introduction,
            lessons: data.content.lessons,
            quiz: data.content.quiz,
            notes: data.content.notes,
            difficulty: data.difficulty,
            progress: data.progress,
            createdAt: data.created_at,
            lastAccessed: data.last_accessed
        };
    },

    // List all courses
    async getAllCourses() {
        if (this.isGuestMode()) {
            return this.getGuestCourses();
        }

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'list',
                data: { userId: this.currentUser.id }
            })
        });
        const data = await response.json();
        return data.courses || [];
    },

    // Delete a course
    async deleteCourse(courseId) {
        if (this.isGuestMode()) {
            const courses = this.getGuestCourses();
            const filtered = courses.filter(c => c.id !== courseId);
            sessionStorage.setItem('guestCourses', JSON.stringify(filtered));
            return { success: true };
        }

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                data: { id: courseId, userId: this.currentUser.id }
            })
        });
        return response.json();
    },

    // ============ PROGRESS OPERATIONS ============

    // Update course progress
    async updateProgress(courseId, progress) {
        if (this.isGuestMode()) {
            const courses = this.getGuestCourses();
            const course = courses.find(c => c.id === courseId);
            if (course) {
                course.progress = progress;
                sessionStorage.setItem('guestCourses', JSON.stringify(courses));
            }
            return { success: true, newBadges: [] };
        }

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateProgress',
                data: {
                    userId: this.currentUser.id,
                    courseId,
                    progress
                }
            })
        });
        return response.json();
    },

    // ============ GUEST HELPERS ============

    getGuestCourses() {
        return JSON.parse(sessionStorage.getItem('guestCourses') || '[]');
    },

    // Clear all guest data (on logout or tab close)
    clearGuestData() {
        sessionStorage.removeItem('guestCourses');
        sessionStorage.removeItem('guestUser');
        sessionStorage.removeItem('guestBadges');
        sessionStorage.removeItem('guestStreak');
        sessionStorage.removeItem('guestLongestStreak');
    },

    // ============ MIGRATION ============

    // Migrate guest data to user account on login
    async migrateGuestDataToUser() {
        const guestCourses = this.getGuestCourses();
        
        if (guestCourses.length === 0) return;
        
        console.log(`📦 Migrating ${guestCourses.length} guest courses to user account...`);
        
        for (const course of guestCourses) {
            try {
                await this.saveCourse(course);
                if (course.progress) {
                    await this.updateProgress(course.id, course.progress);
                }
            } catch (error) {
                console.error('Migration error for course:', course.id, error);
            }
        }
        
        // Clear guest data after migration
        this.clearGuestData();
        console.log('✅ Migration complete');
    }
};

// Export for use in other modules
window.DatabaseService = DatabaseService;
