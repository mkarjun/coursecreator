// UI Module - Handles all DOM manipulation and UI updates

const UI = {
    // DOM Elements cache
    elements: {},
    
    // Initialize UI
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.renderMyCourses();
        this.renderBadges();
    },
    
    // Cache DOM elements
    cacheElements() {
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            menuToggle: document.getElementById('menuToggle'),
            themeToggle: document.getElementById('themeToggle'),
            topicInput: document.getElementById('topicInput'),
            createCourseBtn: document.getElementById('createCourseBtn'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText'),
            
            // Pages
            homePage: document.getElementById('homePage'),
            coursePage: document.getElementById('coursePage'),
            myCoursesPage: document.getElementById('myCoursesPage'),
            badgesPage: document.getElementById('badgesPage'),
            settingsPage: document.getElementById('settingsPage'),
            
            // Course elements
            courseTitle: document.getElementById('courseTitle'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            introContent: document.getElementById('introContent'),
            lessonsContainer: document.getElementById('lessonsContainer'),
            progressChecklist: document.getElementById('progressChecklist'),
            quizContainer: document.getElementById('quizContainer'),
            quizResults: document.getElementById('quizResults'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            resourcesGrid: document.getElementById('resourcesGrid'),
            
            // My courses
            coursesGrid: document.getElementById('coursesGrid'),
            emptyCoursesState: document.getElementById('emptyCoursesState'),
            
            // Badges
            badgesGrid: document.getElementById('badgesGrid'),
            totalBadges: document.getElementById('totalBadges'),
            coursesCompleted: document.getElementById('coursesCompleted'),
            totalHours: document.getElementById('totalHours'),
            
            // Settings
            darkModeToggle: document.getElementById('darkModeToggle'),
            autoplayToggle: document.getElementById('autoplayToggle'),
            clearAllData: document.getElementById('clearAllData'),
            
            // Modals
            notesModal: document.getElementById('notesModal'),
            notesContent: document.getElementById('notesContent'),
            closeNotesModal: document.getElementById('closeNotesModal'),
            downloadNotesBtn: document.getElementById('downloadNotesBtn'),
            viewNotesBtn: document.getElementById('viewNotesBtn'),
            retakeQuizBtn: document.getElementById('retakeQuizBtn')
        };
    },
    
    // Bind event listeners
    bindEvents() {
        // Menu toggle
        this.elements.menuToggle?.addEventListener('click', () => {
            this.elements.sidebar.classList.toggle('active');
        });
        
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Create course
        this.elements.createCourseBtn?.addEventListener('click', () => this.handleCreateCourse());
        this.elements.topicInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCreateCourse();
        });
        
        // Topic chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.elements.topicInput.value = chip.dataset.topic;
                this.handleCreateCourse();
            });
        });
        
        // Sidebar navigation
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateToPage(item.dataset.page);
            });
        });
        
        // Settings
        this.elements.darkModeToggle?.addEventListener('change', () => this.handleSettingsChange());
        this.elements.autoplayToggle?.addEventListener('change', () => this.handleSettingsChange());
        this.elements.clearAllData?.addEventListener('click', () => this.handleClearData());
        
        // Notes modal
        this.elements.viewNotesBtn?.addEventListener('click', () => this.showNotesModal());
        this.elements.closeNotesModal?.addEventListener('click', () => this.hideNotesModal());
        this.elements.downloadNotesBtn?.addEventListener('click', () => CourseGenerator.generateNotesPDF());
        this.elements.retakeQuizBtn?.addEventListener('click', () => this.resetQuiz());
        
        // Close modal on outside click
        this.elements.notesModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.notesModal) this.hideNotesModal();
        });
    },
    
    // Navigate to a page
    navigateToPage(pageName) {
        // Update sidebar
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const pageMap = {
            'home': this.elements.homePage,
            'my-courses': this.elements.myCoursesPage,
            'badges': this.elements.badgesPage,
            'settings': this.elements.settingsPage
        };
        
        if (pageMap[pageName]) {
            pageMap[pageName].classList.add('active');
        }
        
        // Close mobile sidebar
        this.elements.sidebar.classList.remove('active');
        
        // Refresh content
        if (pageName === 'my-courses') this.renderMyCourses();
        if (pageName === 'badges') this.renderBadges();
    },
    
    // Handle create course button
    async handleCreateCourse() {
        const topic = this.elements.topicInput.value.trim();
        if (!topic) {
            this.elements.topicInput.focus();
            return;
        }
        
        try {
            await CourseGenerator.generateCourse(topic);
        } catch (error) {
            console.error('Failed to create course:', error);
        }
    },
    
    // Show loading overlay
    showLoading(message = 'Loading...') {
        this.elements.loadingOverlay.classList.add('active');
        this.elements.loadingText.textContent = message;
        
        // Reset loading steps
        document.querySelectorAll('.loading-step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
    },
    
    // Update loading step
    updateLoadingStep(stepNumber) {
        const steps = document.querySelectorAll('.loading-step');
        steps.forEach((step, index) => {
            if (index + 1 < stepNumber) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            }
        });
        
        const messages = [
            'Searching for videos...',
            'Generating course structure...',
            'Creating notes...',
            'Preparing quizzes...'
        ];
        
        this.elements.loadingText.textContent = messages[stepNumber - 1] || 'Almost done...';
    },
    
    // Hide loading overlay
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    },
    
    // Show course
    showCourse(course) {
        // Navigate to course page
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        this.elements.coursePage.classList.add('active');
        
        // Update sidebar
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        
        // Set course title
        this.elements.courseTitle.textContent = course.title;
        
        // Set introduction
        this.elements.introContent.innerHTML = `
            <p>${course.introduction}</p>
            <button class="btn-secondary" onclick="UI.handleIntroComplete()" style="margin-top: 15px; width: auto;">
                <i class="fas fa-check"></i> Mark as Read
            </button>
        `;
        
        // Render lessons
        this.renderLessons(course);
        
        // Render quiz
        this.renderQuiz(course);
        
        // Render progress checklist
        this.renderProgressChecklist(course);
        
        // Update progress display
        this.updateProgressDisplay(course);
        
        // Render resources
        this.renderResources(course);
    },
    
    // Render lessons
    renderLessons(course) {
        this.elements.lessonsContainer.innerHTML = course.lessons.map((lesson, index) => `
            <div class="lesson-card" data-lesson-id="${lesson.id}">
                <div class="lesson-header" onclick="UI.toggleLesson('${lesson.id}')">
                    <h3>Lesson ${lesson.number}: ${lesson.title}</h3>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="lesson-content">
                    <div class="lesson-text">
                        <p>${lesson.description}</p>
                        ${lesson.keyPoints ? `
                            <ul style="margin-top: 15px; padding-left: 20px;">
                                ${lesson.keyPoints.map(point => `<li>${point}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                    <div class="video-grid">
                        ${lesson.videos.map(video => this.renderVideoCard(video)).join('')}
                    </div>
                    <button class="btn-primary" onclick="UI.handleLessonComplete('${lesson.id}')" style="margin-top: 20px;">
                        <i class="fas fa-check"></i> Mark Lesson Complete
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Render video card
    renderVideoCard(video) {
        const isWatched = CourseGenerator.currentCourse?.progress?.watchedVideos?.includes(video.id);
        const viewCount = typeof video.viewCount === 'string' && video.viewCount.includes('K') 
            ? video.viewCount 
            : ApiService.formatViewCount(video.viewCount);
        
        return `
            <div class="video-card" onclick="UI.openVideo('${video.id}', '${video.title.replace(/'/g, "\\'")}')">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="video-overlay">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    ${isWatched ? '<span class="video-completed">Watched</span>' : ''}
                </div>
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <div class="video-meta">
                        <span>${video.channelTitle}</span>
                        <span>•</span>
                        <span>${viewCount}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Toggle lesson expansion
    toggleLesson(lessonId) {
        const card = document.querySelector(`.lesson-card[data-lesson-id="${lessonId}"]`);
        if (card) {
            card.classList.toggle('expanded');
        }
    },
    
    // Open video - now opens in a modal with embedded player for timestamp tracking
    openVideo(videoId, title) {
        // Check if it's a demo video
        if (videoId.startsWith('demo_')) {
            alert('Demo mode: Video playback requires YouTube API key.\n\nGo to Settings to add your API key.');
            return;
        }
        
        // Get existing timestamp if any
        const course = CourseGenerator.getCurrentCourse();
        let startTime = 0;
        
        if (course && course.videoTimestamps && course.videoTimestamps[videoId]) {
            startTime = course.videoTimestamps[videoId].timestamp || 0;
        }
        
        // Show video modal with embedded player
        this.showVideoModal(videoId, title, startTime);
    },
    
    // Show video in embedded modal for timestamp tracking
    showVideoModal(videoId, title, startTime = 0) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('videoModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'videoModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content video-modal-content">
                    <div class="modal-header">
                        <h3 id="videoModalTitle"></h3>
                        <button class="close-btn" onclick="UI.closeVideoModal()">&times;</button>
                    </div>
                    <div class="video-embed-container">
                        <iframe id="videoModalIframe" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="video-modal-actions">
                        <button class="btn-secondary" onclick="UI.openVideoExternal()">
                            <i class="fab fa-youtube"></i> Open in YouTube
                        </button>
                        <button class="btn-primary" onclick="UI.markVideoComplete()">
                            <i class="fas fa-check"></i> Mark as Complete
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Store current video info
        this.currentVideoId = videoId;
        this.currentVideoTitle = title;
        
        // Set title and iframe src with start time
        document.getElementById('videoModalTitle').textContent = title;
        const iframe = document.getElementById('videoModalIframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(startTime)}&autoplay=1&enablejsapi=1`;
        
        modal.classList.add('active');
        
        // Mark as watched
        CourseGenerator.markVideoWatched(videoId);
        
        // Refresh video card to show watched status
        const course = CourseGenerator.getCurrentCourse();
        if (course) {
            this.renderLessons(course);
        }
    },
    
    // Close video modal
    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('videoModalIframe');
        
        if (modal) {
            modal.classList.remove('active');
            iframe.src = ''; // Stop video
        }
        
        this.currentVideoId = null;
        this.currentVideoTitle = null;
    },
    
    // Open current video in YouTube
    openVideoExternal() {
        if (this.currentVideoId) {
            window.open(`https://www.youtube.com/watch?v=${this.currentVideoId}`, '_blank');
        }
    },
    
    // Mark current video as complete
    markVideoComplete() {
        if (this.currentVideoId) {
            const course = CourseGenerator.getCurrentCourse();
            if (course) {
                // Save as completed
                if (!course.videoTimestamps) course.videoTimestamps = {};
                course.videoTimestamps[this.currentVideoId] = {
                    timestamp: 0,
                    duration: 0,
                    completed: true
                };
                Storage.saveCourse(course);
                
                // Also sync to database
                if (window.DatabaseService && !DatabaseService.isGuestMode()) {
                    DatabaseService.saveVideoTimestamp(
                        course.id, 
                        this.currentVideoId, 
                        0, 0, true
                    ).catch(console.warn);
                }
            }
            this.closeVideoModal();
            this.showBadgeNotification({ name: 'Video Completed!', icon: '🎬' });
        }
    },
    
    // Render quiz
    renderQuiz(course) {
        if (course.progress.quizCompleted) {
            this.showQuizResults(course.progress.quizScore, course.quiz.length);
            return;
        }
        
        this.elements.quizResults.classList.add('hidden');
        this.elements.quizContainer.innerHTML = course.quiz.map((q, qIndex) => `
            <div class="quiz-question" data-question="${qIndex}">
                <h4>Q${qIndex + 1}: ${q.question}</h4>
                <div class="quiz-options">
                    ${q.options.map((option, oIndex) => `
                        <label class="quiz-option" data-option="${oIndex}">
                            <input type="radio" name="question_${qIndex}" value="${oIndex}">
                            <span class="option-marker">${String.fromCharCode(65 + oIndex)}</span>
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('') + `
            <button class="btn-primary quiz-submit" onclick="UI.handleQuizSubmit()">
                <i class="fas fa-paper-plane"></i> Submit Quiz
            </button>
        `;
        
        // Bind option click handlers
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', function() {
                const question = this.closest('.quiz-question');
                question.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                this.querySelector('input').checked = true;
            });
        });
    },
    
    // Handle quiz submission
    handleQuizSubmit() {
        const course = CourseGenerator.getCurrentCourse();
        if (!course) return;
        
        const answers = [];
        let allAnswered = true;
        
        course.quiz.forEach((_, index) => {
            const selected = document.querySelector(`input[name="question_${index}"]:checked`);
            if (selected) {
                answers.push(parseInt(selected.value));
            } else {
                allAnswered = false;
            }
        });
        
        if (!allAnswered) {
            alert('Please answer all questions before submitting.');
            return;
        }
        
        const result = CourseGenerator.submitQuiz(answers);
        
        // Show results on each question
        result.results.forEach((r, index) => {
            const question = document.querySelector(`.quiz-question[data-question="${index}"]`);
            const options = question.querySelectorAll('.quiz-option');
            
            options.forEach((opt, optIndex) => {
                if (optIndex === r.correctAnswer) {
                    opt.classList.add('correct');
                } else if (optIndex === r.selectedAnswer && !r.isCorrect) {
                    opt.classList.add('incorrect');
                }
            });
        });
        
        // Hide submit button
        document.querySelector('.quiz-submit').style.display = 'none';
        
        // Show results
        this.showQuizResults(result.score, result.total);
    },
    
    // Show quiz results
    showQuizResults(score, total) {
        this.elements.quizResults.classList.remove('hidden');
        this.elements.scoreDisplay.innerHTML = `
            ${score}%
            <div style="font-size: 16px; color: var(--text-secondary); margin-top: 10px;">
                ${score === 100 ? '🎉 Perfect Score!' : score >= 70 ? '👍 Great job!' : 'Keep practicing!'}
            </div>
        `;
    },
    
    // Reset quiz
    resetQuiz() {
        const course = CourseGenerator.getCurrentCourse();
        if (course) {
            course.progress.quizCompleted = false;
            course.progress.quizScore = null;
            Storage.saveCourse(course);
            this.renderQuiz(course);
        }
    },
    
    // Render progress checklist
    renderProgressChecklist(course) {
        const items = [
            { id: 'intro', label: 'Introduction', completed: course.progress.introCompleted },
            ...course.lessons.map(lesson => ({
                id: lesson.id,
                label: `Lesson ${lesson.number}: ${lesson.title}`,
                completed: course.progress.completedLessons.includes(lesson.id)
            })),
            { id: 'quiz', label: 'Interactive Quiz', completed: course.progress.quizCompleted }
        ];
        
        this.elements.progressChecklist.innerHTML = items.map(item => `
            <li class="${item.completed ? 'completed' : ''}">
                <span class="check-box ${item.completed ? 'checked' : ''}"></span>
                <span>${item.label}</span>
            </li>
        `).join('');
    },
    
    // Update progress display
    updateProgressDisplay(course) {
        const percentage = course.progress.percentage;
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `${percentage}%`;
        this.renderProgressChecklist(course);
    },
    
    // Handle intro complete
    handleIntroComplete() {
        CourseGenerator.completeIntro();
        const btn = this.elements.introContent.querySelector('button');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Completed';
            btn.disabled = true;
            btn.style.opacity = '0.6';
        }
    },
    
    // Handle lesson complete
    handleLessonComplete(lessonId) {
        CourseGenerator.completeLesson(lessonId);
        const btn = document.querySelector(`.lesson-card[data-lesson-id="${lessonId}"] .btn-primary`);
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Completed';
            btn.disabled = true;
            btn.style.opacity = '0.6';
        }
    },
    
    // Render resources
    renderResources(course) {
        this.elements.resourcesGrid.innerHTML = `
            <div class="resource-card" onclick="CourseGenerator.generateNotesPDF()">
                <i class="fas fa-file-alt"></i>
                <div class="resource-info">
                    <h4>Course Notes</h4>
                    <span>Text Document</span>
                </div>
            </div>
            <div class="resource-card" onclick="UI.showNotesModal()">
                <i class="fas fa-book-open"></i>
                <div class="resource-info">
                    <h4>Study Guide</h4>
                    <span>View Online</span>
                </div>
            </div>
        `;
    },
    
    // Show notes modal
    showNotesModal() {
        const course = CourseGenerator.getCurrentCourse();
        if (!course) return;
        
        // Convert markdown-style notes to HTML
        let notes = course.notes || '';
        notes = notes
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        this.elements.notesContent.innerHTML = `<p>${notes}</p>`;
        this.elements.notesModal.classList.add('active');
    },
    
    // Hide notes modal
    hideNotesModal() {
        this.elements.notesModal.classList.remove('active');
    },
    
    // Render my courses page
    renderMyCourses() {
        const isAuthenticated = Storage.isAuthenticated();
        const courses = Storage.getCourses();
        
        // Show sign-in prompt for unauthenticated users
        if (!isAuthenticated) {
            this.elements.emptyCoursesState.classList.add('hidden');
            this.elements.coursesGrid.innerHTML = `
                <div class="auth-prompt-container">
                    <div class="auth-prompt">
                        <i class="fas fa-user-lock"></i>
                        <h3>Sign in to save your courses</h3>
                        <p>Your courses will be saved in the cloud and sync across all your devices.</p>
                        <p class="auth-prompt-note">
                            <i class="fas fa-info-circle"></i>
                            Without signing in, courses are only available during this session and will be lost on page refresh.
                        </p>
                        <button class="btn-primary" onclick="Auth.showAuthModal()">
                            <i class="fab fa-google"></i> Sign in with Google
                        </button>
                    </div>
                    ${courses.length > 0 ? `
                        <div class="session-courses">
                            <h4>Current Session Courses (${courses.length})</h4>
                            <p class="session-warning"><i class="fas fa-exclamation-triangle"></i> These will be lost on refresh</p>
                            ${courses.map(course => `
                                <div class="session-course-item" onclick="CourseGenerator.loadCourse('${course.id}')">
                                    <span>${course.title}</span>
                                    <span>${course.progress.percentage}%</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        if (courses.length === 0) {
            this.elements.emptyCoursesState.classList.remove('hidden');
            this.elements.coursesGrid.innerHTML = '';
            this.elements.coursesGrid.appendChild(this.elements.emptyCoursesState);
            return;
        }
        
        this.elements.emptyCoursesState.classList.add('hidden');
        this.elements.coursesGrid.innerHTML = courses.map(course => `
            <div class="course-card" onclick="CourseGenerator.loadCourse('${course.id}')">
                <div class="course-card-header">
                    <h3>${course.title}</h3>
                    <span>${new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="course-card-body">
                    <div class="course-card-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${course.progress.percentage}%"></div>
                        </div>
                        <span>${course.progress.percentage}% complete</span>
                    </div>
                    <div class="course-card-actions">
                        <button class="btn-secondary" onclick="event.stopPropagation(); CourseGenerator.loadCourse('${course.id}')">
                            Continue
                        </button>
                        <button class="btn-secondary" onclick="event.stopPropagation(); UI.deleteCourse('${course.id}')" style="background: var(--danger); border-color: var(--danger); color: white;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    // Delete course
    deleteCourse(courseId) {
        if (confirm('Are you sure you want to delete this course?')) {
            Storage.deleteCourse(courseId);
            this.renderMyCourses();
        }
    },
    
    // Render badges page
    renderBadges() {
        const earnedBadges = Storage.getBadges();
        const stats = Storage.getStatistics();
        
        // Update stats
        this.elements.totalBadges.textContent = stats.totalBadges;
        this.elements.coursesCompleted.textContent = stats.completedCourses;
        this.elements.totalHours.textContent = stats.totalHours;
        
        // Render badges
        this.elements.badgesGrid.innerHTML = CONFIG.BADGES.map(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            return `
                <div class="badge-card ${isEarned ? '' : 'locked'}">
                    <div class="badge-icon">
                        <i class="fas ${badge.icon}"></i>
                    </div>
                    <h4>${badge.name}</h4>
                    <p>${badge.description}</p>
                </div>
            `;
        }).join('');
    },
    
    // Show badge notification
    showBadgeNotification(badge) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="badge-notification-content">
                <div class="badge-icon">
                    <i class="fas ${badge.icon}"></i>
                </div>
                <div>
                    <h4>🎉 Badge Earned!</h4>
                    <p>${badge.name}</p>
                </div>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 2px solid var(--accent-primary);
            border-radius: var(--border-radius);
            padding: 20px;
            z-index: 4000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 10px 40px var(--shadow-color);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },
    
    // Show error message
    showError(message) {
        alert(message);
    },
    
    // Toggle theme
    toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') !== 'light';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        
        const icon = this.elements.themeToggle.querySelector('i');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        
        const settings = Storage.getSettings();
        settings.darkMode = !isDark;
        Storage.saveSettings(settings);
        
        this.elements.darkModeToggle.checked = !isDark;
    },
    
    // Load settings
    loadSettings() {
        const settings = Storage.getSettings();
        
        if (!settings.darkMode) {
            document.body.setAttribute('data-theme', 'light');
            this.elements.themeToggle.querySelector('i').className = 'fas fa-sun';
        }
        
        this.elements.darkModeToggle.checked = settings.darkMode;
        this.elements.autoplayToggle.checked = settings.autoplay;
    },
    
    // Handle settings change
    handleSettingsChange() {
        const settings = {
            ...Storage.getSettings(),
            darkMode: this.elements.darkModeToggle.checked,
            autoplay: this.elements.autoplayToggle.checked
        };
        
        Storage.saveSettings(settings);
        
        // Apply dark mode
        document.body.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
        const icon = this.elements.themeToggle.querySelector('i');
        icon.className = settings.darkMode ? 'fas fa-moon' : 'fas fa-sun';
    },
    
    // Handle clear data
    handleClearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            Storage.clearAllData();
            location.reload();
        }
    }
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    .badge-notification-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    .badge-notification .badge-icon {
        width: 50px;
        height: 50px;
        background: var(--accent-gradient);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .badge-notification .badge-icon i {
        font-size: 24px;
        color: white;
    }
    .badge-notification h4 {
        margin: 0;
        font-size: 14px;
        color: var(--accent-primary);
    }
    .badge-notification p {
        margin: 5px 0 0;
        font-size: 16px;
        font-weight: 600;
    }
`;
document.head.appendChild(style);
