// Storage Module - Handles all local storage operations

const Storage = {
    // Check if storage is allowed (not guest mode)
    canSave() {
        // If Auth is not initialized yet, allow saving
        if (typeof Auth === 'undefined') return true;
        // Allow saving only if user is authenticated (not guest)
        return !Auth.isGuest();
    },
    
    // Get all saved courses
    getCourses() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.COURSES);
        return data ? JSON.parse(data) : [];
    },
    
    // Save a new course
    saveCourse(course) {
        // Don't save for guest users
        if (!this.canSave()) {
            console.log('📝 Guest mode: Course progress not saved');
            return course;
        }
        
        const courses = this.getCourses();
        const existingIndex = courses.findIndex(c => c.id === course.id);
        
        if (existingIndex >= 0) {
            courses[existingIndex] = course;
        } else {
            courses.unshift(course);
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(courses));
        return course;
    },
    
    // Get a specific course by ID
    getCourse(courseId) {
        const courses = this.getCourses();
        return courses.find(c => c.id === courseId);
    },
    
    // Delete a course
    deleteCourse(courseId) {
        const courses = this.getCourses();
        const filtered = courses.filter(c => c.id !== courseId);
        localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(filtered));
    },
    
    // Update course progress
    updateCourseProgress(courseId, progress) {
        // Don't save progress for guest users
        if (!this.canSave()) {
            console.log('📝 Guest mode: Progress not saved');
            return null;
        }
        
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        
        if (course) {
            course.progress = { ...course.progress, ...progress };
            course.lastAccessed = new Date().toISOString();
            localStorage.setItem(CONFIG.STORAGE_KEYS.COURSES, JSON.stringify(courses));
        }
        
        return course;
    },
    
    // Get earned badges
    getBadges() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.BADGES);
        return data ? JSON.parse(data) : [];
    },
    
    // Award a badge
    awardBadge(badgeId) {
        const badges = this.getBadges();
        
        if (!badges.includes(badgeId)) {
            badges.push(badgeId);
            localStorage.setItem(CONFIG.STORAGE_KEYS.BADGES, JSON.stringify(badges));
            return true; // New badge awarded
        }
        
        return false; // Already had badge
    },
    
    // Check and award badges based on achievements
    checkAndAwardBadges() {
        const courses = this.getCourses();
        const earnedBadges = this.getBadges();
        const newBadges = [];
        
        // Calculate statistics
        const completedCourses = courses.filter(c => c.progress?.percentage === 100).length;
        const perfectQuizzes = courses.filter(c => c.progress?.quizScore === 100).length;
        const totalVideosWatched = courses.reduce((sum, c) => {
            return sum + (c.progress?.watchedVideos?.length || 0);
        }, 0);
        
        // Check each badge requirement
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
    
    // Check learning streak
    checkStreak() {
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
    
    // Update learning streak
    updateStreak() {
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
    
    // Get settings
    getSettings() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            darkMode: true,
            autoplay: false,
            currentStreak: 0,
            lastLearningDate: null
        };
    },
    
    // Save settings
    saveSettings(settings) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },
    
    // Get statistics
    getStatistics() {
        const courses = this.getCourses();
        const badges = this.getBadges();
        
        const completedCourses = courses.filter(c => c.progress?.percentage === 100).length;
        const totalVideosWatched = courses.reduce((sum, c) => {
            return sum + (c.progress?.watchedVideos?.length || 0);
        }, 0);
        
        // Estimate hours (assuming average video length of 10 minutes)
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
    
    // Clear all data
    clearAllData() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.COURSES);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.BADGES);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEYS);
    },
    
    // Export data
    exportData() {
        return {
            courses: this.getCourses(),
            badges: this.getBadges(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    },
    
    // Import data
    importData(data) {
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
