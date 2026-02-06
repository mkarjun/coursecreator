// Main Application Entry Point

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎓 Course Creator initialized');
    
    // Initialize Auth
    Auth.init();
    
    // Initialize UI first (cache DOM elements, bind events, load settings)
    // Must happen before any data sync that might call renderMyCourses()
    UI.init();
    
    // Initialize DatabaseService and load data for authenticated users
    if (Auth.isLoggedIn() && !Auth.isGuest()) {
        DatabaseService.init(Auth.currentUser, false);
        
        // Sync user and load courses from D1 database
        await Auth.syncUserToDatabase(Auth.currentUser);
        await Storage.loadFromDatabase();
        
        // Re-render with fresh data from database
        UI.renderMyCourses();
        UI.renderBadges();
        
        console.log('✅ Authenticated user data loaded');
    }
    
    // Listen for background course refreshes (won't interrupt video playback)
    window.addEventListener('coursesRefreshed', (event) => {
        // Only update My Courses page if user is viewing it
        const myCoursesPage = document.getElementById('myCoursesPage');
        if (myCoursesPage && myCoursesPage.classList.contains('active')) {
            UI.renderMyCourses();
        }
    });
    
    // Check for URL parameters (for sharing courses, battles, and duos)
    const urlParams = new URLSearchParams(window.location.search);
    const battleId = urlParams.get('battle');
    const duoId = urlParams.get('duo');
    const topic = urlParams.get('topic');

    if (battleId) {
        // Battle mode: load the 1v1 challenge directly
        Battle.init(battleId);
    } else if (duoId) {
        // Study Duo mode: partner loads shared course
        StudyDuo.init(duoId);
    } else if (topic) {
        document.getElementById('topicInput').value = decodeURIComponent(topic);
        UI.handleCreateCourse();
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('topicInput').focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            UI.hideNotesModal();
        }
    });
    
    // Service Worker registration for PWA (optional)
    if ('serviceWorker' in navigator) {
        // navigator.serviceWorker.register('/sw.js');
    }
});

// Expose necessary functions to global scope for inline handlers
window.UI = UI;
window.CourseGenerator = CourseGenerator;
window.ApiService = ApiService;
window.Storage = Storage;
window.DatabaseService = DatabaseService;
window.TopicIntelligence = TopicIntelligence;
window.Battle = Battle;
window.StudyDuo = StudyDuo;

// Handle share buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.share-btn')) {
        const btn = e.target.closest('.share-btn');
        const platform = btn.dataset.platform;
        const course = CourseGenerator.getCurrentCourse();
        
        if (!course) return;
        
        const url = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(course.topic)}`;
        const title = `Learn ${course.title} with Course Creator`;
        
        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(url).then(() => {
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-link"></i>';
                    }, 2000);
                });
                break;
        }
    }
});

// Handle beforeunload for unsaved changes
window.addEventListener('beforeunload', () => {
    // Save any pending changes
    const course = CourseGenerator.getCurrentCourse();
    if (course) {
        Storage.saveCourse(course);
    }
});

// Console welcome message
console.log('%c🎓 Course Creator', 'font-size: 24px; font-weight: bold; color: #00d4aa;');
console.log('%cTransform any topic into a structured learning experience!', 'color: #a0aec0;');
console.log('%cTip: Press Ctrl+K to quickly search for a topic', 'color: #718096;');
