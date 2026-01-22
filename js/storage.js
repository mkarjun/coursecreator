// Storage Module - Industry Standard Approach
// ============================================
// NOT SIGNED IN: In-memory only (clears on page refresh)
// SIGNED IN (Google): D1 database is source of truth, localStorage as cache
// 
// This approach:
// - No storage for unauthenticated users (clean, no data residue)
// - Database-first for authenticated users (syncs across devices)
// - LocalStorage as read cache for faster initial loads

const Storage = {
    // In-memory storage for unauthenticated sessions
    _memoryStore: {
        courses: [],
        badges: [],
        currentCourse: null
    },
    
    // Check if user is authenticated (logged in with OAuth)
    isAuthenticated() {
        if (typeof Auth === 'undefined') return false;
        if (!Auth.currentUser) return false;
        return Auth.currentUser.mode === 'authenticated';
    },
    
    // ============ COURSE OPERATIONS ============
    
    // Get all saved courses
    getCourses() {
        if (!this.isAuthenticated()) {
            return this._memoryStore.courses;
        }
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.COURSES);
        return data ? JSON.parse(data) : [];
    },
    
    // Save a course
    saveCourse(course) {
        if (!this.isAuthenticated()) {
            // Guest: Store in memory only (clears on refresh)
            const existingIndex = this._memoryStore.courses.findIndex(c => c.id === course.id);
            if (existingIndex >= 0) {
                this._memoryStore.courses[existingIndex] = course;
            } else {
                this._memoryStore.courses.unshift(course);
                // Limit to 3 courses for guests
                if (this._memoryStore.courses.length > 3) {
                    this._memoryStore.courses.pop();
                }
            }
            return course;
        }
        
        // Authenticated: Save to localStorage cache + D1 database
        const courses = this.getCourses();
        const existingIndex = courses.findIndex(c => c.id === course.id);
        
        if (existingIndex >= 0) {
            courses[existingIndex] = course;
        } else {
            courses.unshift(course);
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(courses));
        
        // Sync to D1 database in background
        this.syncCourseToDatabase(course);
        
        return course;
    },
    
    // Get a specific course by ID
    getCourse(courseId) {
        const courses = this.getCourses();
        return courses.find(c => c.id === courseId);
    },
    
    // Delete a course
    deleteCourse(courseId) {
        if (!this.isAuthenticated()) {
            this._memoryStore.courses = this._memoryStore.courses.filter(c => c.id !== courseId);
            return;
        }
        
        const courses = this.getCourses().filter(c => c.id !== courseId);
        localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(courses));
        
        // Sync to D1 in background
        if (window.DatabaseService) {
            DatabaseService.deleteCourse(courseId).catch(console.warn);
        }
    },
    
    // Update course progress
    updateCourseProgress(courseId, progress) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        
        if (!course) return null;
        
        course.progress = { ...course.progress, ...progress };
        course.lastAccessed = new Date().toISOString();
        
        if (!this.isAuthenticated()) {
            return course;
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(courses));
        
        // Sync to D1 in background
        if (window.DatabaseService) {
            DatabaseService.updateProgress(courseId, course.progress).catch(console.warn);
        }
        
        return course;
    },
    
    // ============ DATABASE SYNC ============
    
    // Sync course to D1 database (async, non-blocking)
    async syncCourseToDatabase(course) {
        if (!this.isAuthenticated() || !window.DatabaseService) return;
        
        try {
            await DatabaseService.saveCourse(course);
            if (course.progress) {
                await DatabaseService.updateProgress(course.id, course.progress);
            }
        } catch (error) {
            console.warn('Background sync failed:', error);
        }
    },
    
    // Load courses from D1 database (called on login)
    async loadFromDatabase() {
        if (!this.isAuthenticated() || !window.DatabaseService) return;
        
        try {
            const courses = await DatabaseService.getAllCourses();
            if (courses && courses.length > 0) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(courses));
                console.log('✅ Loaded', courses.length, 'courses from database');
                return courses;
            }
        } catch (error) {
            console.warn('Failed to load from database:', error);
        }
        return [];
    },
    
    // Background refresh (non-blocking, won't interrupt UI)
    async backgroundRefresh() {
        if (!this.isAuthenticated()) return;
        
        try {
            const courses = await DatabaseService.getAllCourses();
            if (courses) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(courses));
                // Emit custom event for UI to update if needed
                window.dispatchEvent(new CustomEvent('coursesRefreshed', { detail: { courses } }));
            }
        } catch (error) {
            // Silent fail - background operation
        }
    },
    
    // ============ BADGES ============
    
    getBadges() {
        if (!this.isAuthenticated()) {
            return this._memoryStore.badges;
        }
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.BADGES);
        return data ? JSON.parse(data) : [];
    },
    
    awardBadge(badgeId) {
        if (!this.isAuthenticated()) {
            if (!this._memoryStore.badges.includes(badgeId)) {
                this._memoryStore.badges.push(badgeId);
                return true;
            }
            return false;
        }
        
        const badges = this.getBadges();
        if (!badges.includes(badgeId)) {
            badges.push(badgeId);
            localStorage.setItem(CONFIG.STORAGE_KEYS.BADGES, JSON.stringify(badges));
            return true;
        }
        return false;
    },
    
    checkAndAwardBadges() {
        if (!this.isAuthenticated()) return [];
        
        const courses = this.getCourses();
        const earnedBadges = this.getBadges();
        const newBadges = [];
        
        const completedCourses = courses.filter(c => c.progress?.percentage === 100).length;
        const perfectQuizzes = courses.filter(c => c.progress?.quizScore === 100).length;
        const totalVideosWatched = courses.reduce((sum, c) => {
            return sum + (c.progress?.watchedVideos?.length || 0);
        }, 0);
        
        for (const badge of CONFIG.BADGES) {
            if (earnedBadges.includes(badge.id)) continue;
            
            let earned = false;
            switch (badge.requirement.type) {
                case 'courses_completed':
                    earned = completedCourses >= badge.requirement.count;
                    break;
                case 'perfect_quiz':
                    earned = perfectQuizzes >= badge.requirement.count;
                    break;
                case 'videos_watched':
                    earned = totalVideosWatched >= badge.requirement.count;
                    break;
                case 'streak':
                    earned = this.checkStreak() >= badge.requirement.count;
                    break;
            }
            
            if (earned) {
                this.awardBadge(badge.id);
                newBadges.push(badge);
            }
        }
        
        return newBadges;
    },
    
    // ============ STREAK ============
    
    checkStreak() {
        if (!this.isAuthenticated()) return 0;
        
        const settings = this.getSettings();
        const today = new Date().toDateString();
        
        if (settings.lastLearningDate === today) {
            return settings.currentStreak || 0;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (settings.lastLearningDate === yesterday.toDateString()) {
            return settings.currentStreak || 0;
        }
        
        return 0;
    },
    
    updateStreak() {
        if (!this.isAuthenticated()) return 0;
        
        const settings = this.getSettings();
        const today = new Date().toDateString();
        
        if (settings.lastLearningDate === today) {
            return settings.currentStreak;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (settings.lastLearningDate === yesterday.toDateString()) {
            settings.currentStreak = (settings.currentStreak || 0) + 1;
        } else {
            settings.currentStreak = 1;
        }
        
        settings.lastLearningDate = today;
        this.saveSettings(settings);
        
        return settings.currentStreak;
    },
    
    // ============ SETTINGS ============
    
    getSettings() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            darkMode: true,
            autoplay: false,
            currentStreak: 0,
            lastLearningDate: null
        };
    },
    
    saveSettings(settings) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },
    
    // ============ STATISTICS ============
    
    getStatistics() {
        const courses = this.getCourses();
        const badges = this.getBadges();
        
        const completedCourses = courses.filter(c => c.progress?.percentage === 100).length;
        const totalVideosWatched = courses.reduce((sum, c) => {
            return sum + (c.progress?.watchedVideos?.length || 0);
        }, 0);
        const totalHours = Math.floor(totalVideosWatched * 10 / 60);
        
        return {
            totalCourses: courses.length,
            completedCourses,
            totalBadges: badges.length,
            totalVideosWatched,
            totalHours,
            currentStreak: this.checkStreak()
        };
    },
    
    // ============ DATA MANAGEMENT ============
    
    clearAllData() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.COURSES);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.BADGES);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
        this._memoryStore.courses = [];
        this._memoryStore.badges = [];
    },
    
    clearMemoryStore() {
        this._memoryStore.courses = [];
        this._memoryStore.badges = [];
        this._memoryStore.currentCourse = null;
    },
    
    exportData() {
        return {
            courses: this.getCourses(),
            badges: this.getBadges(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    },
    
    importData(data) {
        if (!this.isAuthenticated()) return;
        
        if (data.courses) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(data.courses));
        }
        if (data.badges) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.BADGES, JSON.stringify(data.badges));
        }
        if (data.settings) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
    }
};
