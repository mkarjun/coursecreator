// Course Generator Module - Orchestrates course creation
// Now integrates TopicIntelligence for algorithmic + AI synergy

const CourseGenerator = {
    currentCourse: null,
    
    // Generate a complete course for a topic
    // Accepts optional difficulty and domain from the refinement step
    async generateCourse(topic, difficulty = 'intermediate', domain = null) {
        const courseId = `course_${Date.now()}`;
        
        // Show loading overlay
        UI.showLoading('Generating course structure...');
        
        try {
            // Step 1: Generate course content FIRST (AI provides lesson search queries)
            UI.updateLoadingStep(1);
            let content;
            try {
                content = await ApiService.generateCourseContent(topic, difficulty, domain);
            } catch (contentErr) {
                console.warn('Step 1 failed, using demo content:', contentErr.message);
                content = ApiService.getDemoCourseContent(topic);
            }
            
            // Step 2: Search YouTube using AI-provided queries + algorithmic scoring
            UI.updateLoadingStep(2);
            let lessonVideos;
            try {
                lessonVideos = await this.fetchSmartVideos(topic, content.lessons, difficulty);
            } catch (videoErr) {
                console.warn('Step 2 failed, using empty videos:', videoErr.message);
                lessonVideos = content.lessons.map(() => []);
            }
            
            // Step 3: Generate quiz separately (better model)
            UI.updateLoadingStep(3);
            let quiz;
            try {
                quiz = await ApiService.generateQuiz(topic);
            } catch (quizErr) {
                console.warn('Step 3 failed, using demo quiz:', quizErr.message);
                quiz = ApiService.getDemoQuiz(topic);
            }
            
            // Step 4: Build final course
            UI.updateLoadingStep(4);
            const course = this.buildCourse(courseId, topic, content, lessonVideos, quiz);
            
            // Save course
            Storage.saveCourse(course);
            Storage.updateStreak();
            
            // Check for new badges
            const newBadges = Storage.checkAndAwardBadges();
            
            this.currentCourse = course;
            
            // Hide loading and show course
            UI.hideLoading();
            UI.showCourse(course);
            
            // Show badge notification if earned
            if (newBadges.length > 0) {
                setTimeout(() => {
                    UI.showBadgeNotification(newBadges[0]);
                }, 1000);
            }
            
            return course;
        } catch (error) {
            console.error('Course generation error:', error);
            UI.hideLoading();
            UI.showError('Failed to generate course. Please try again.');
            throw error;
        }
    },
    
    // NEW: Fetch videos using AI-provided search queries + algorithmic ranking
    async fetchSmartVideos(topic, lessons, difficulty) {
        const allLessonVideos = [];
        const poolSize = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_POOL_SIZE) || 8;
        const maxPerLesson = (typeof CONFIG !== 'undefined' && CONFIG.MAX_VIDEOS_PER_LESSON) || 4;
        
        for (const lesson of lessons) {
            try {
                // Use AI-provided searchQuery, with algorithmic fallback
                const query = lesson.searchQuery || 
                    TopicIntelligence.buildLessonQuery(topic, lesson.title, lesson.keyPoints, difficulty);
                
                console.log(`🔍 Searching videos for "${lesson.title}": "${query}"`);
                
                // Fetch a larger pool for scoring (fetch more, keep best)
                const rawVideos = await ApiService.searchYouTubeVideos(query, poolSize);
                
                // Score and rank algorithmically
                const rankedVideos = TopicIntelligence.rankVideos(rawVideos, topic, lesson.title);
                
                // Keep the top N
                allLessonVideos.push(rankedVideos.slice(0, maxPerLesson));
            } catch (err) {
                console.warn(`⚠️ Video fetch failed for "${lesson.title}":`, err);
                allLessonVideos.push([]);  // empty lesson videos — don't kill the course
            }
        }
        
        // Deduplicate: same video shouldn't appear in multiple lessons
        return TopicIntelligence.deduplicateAcrossLessons(allLessonVideos);
    },
    
    // KEPT for backward compatibility — falls back to static structure
    async fetchVideosForLessons(topic) {
        const lessonVideos = [];
        
        for (const lesson of CONFIG.COURSE_STRUCTURE.lessons) {
            const searchQuery = `${topic} ${lesson.searchSuffix}`;
            const videos = await ApiService.searchYouTubeVideos(
                searchQuery, 
                CONFIG.MAX_VIDEOS_PER_LESSON
            );
            lessonVideos.push(videos);
        }
        
        return lessonVideos;
    },
    
    // Build the course object
    buildCourse(courseId, topic, content, lessonVideos, quiz) {
        const lessons = content.lessons.map((lesson, index) => ({
            id: `lesson_${index + 1}`,
            number: index + 1,
            title: lesson.title,
            description: lesson.description,
            keyPoints: lesson.keyPoints,
            videos: lessonVideos[index] || []
        }));
        
        return {
            id: courseId,
            topic: topic,
            title: topic,
            introduction: content.introduction,
            lessons: lessons,
            quiz: quiz, // Now passed separately from better model
            notes: content.notes,
            progress: {
                percentage: 0,
                completedLessons: [],
                watchedVideos: [],
                introCompleted: false,
                quizCompleted: false,
                quizScore: null
            },
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString()
        };
    },
    
    // Load an existing course
    loadCourse(courseId) {
        const course = Storage.getCourse(courseId);
        if (course) {
            this.currentCourse = course;
            course.lastAccessed = new Date().toISOString();
            Storage.saveCourse(course);
            UI.showCourse(course);
        }
        return course;
    },
    
    // Mark lesson as complete
    completeLesson(lessonId) {
        if (!this.currentCourse) return;
        
        const progress = this.currentCourse.progress;
        if (!progress.completedLessons.includes(lessonId)) {
            progress.completedLessons.push(lessonId);
        }
        
        this.updateProgressPercentage();
        Storage.saveCourse(this.currentCourse);
        Storage.updateStreak();
        
        const newBadges = Storage.checkAndAwardBadges();
        if (newBadges.length > 0) {
            UI.showBadgeNotification(newBadges[0]);
        }
        
        UI.updateProgressDisplay(this.currentCourse);
    },
    
    // Mark video as watched
    markVideoWatched(videoId) {
        if (!this.currentCourse) return;
        
        const progress = this.currentCourse.progress;
        if (!progress.watchedVideos.includes(videoId)) {
            progress.watchedVideos.push(videoId);
        }
        
        Storage.saveCourse(this.currentCourse);
        Storage.updateStreak();
        
        const newBadges = Storage.checkAndAwardBadges();
        if (newBadges.length > 0) {
            UI.showBadgeNotification(newBadges[0]);
        }
    },
    
    // Complete introduction
    completeIntro() {
        if (!this.currentCourse) return;
        
        this.currentCourse.progress.introCompleted = true;
        this.updateProgressPercentage();
        Storage.saveCourse(this.currentCourse);
        UI.updateProgressDisplay(this.currentCourse);
    },
    
    // Submit quiz answers
    submitQuiz(answers) {
        if (!this.currentCourse) return null;
        
        const quiz = this.currentCourse.quiz;
        let correct = 0;
        const results = [];
        
        quiz.forEach((question, index) => {
            const isCorrect = answers[index] === question.correctIndex;
            if (isCorrect) correct++;
            results.push({
                questionIndex: index,
                selectedAnswer: answers[index],
                correctAnswer: question.correctIndex,
                isCorrect: isCorrect,
                explanation: question.explanation
            });
        });
        
        const score = Math.round((correct / quiz.length) * 100);
        
        this.currentCourse.progress.quizCompleted = true;
        this.currentCourse.progress.quizScore = score;
        this.currentCourse.progress.quizAnswers = answers;
        this.updateProgressPercentage();
        Storage.saveCourse(this.currentCourse);
        Storage.updateStreak();
        
        const newBadges = Storage.checkAndAwardBadges();
        if (newBadges.length > 0) {
            setTimeout(() => {
                UI.showBadgeNotification(newBadges[0]);
            }, 2000);
        }
        
        UI.updateProgressDisplay(this.currentCourse);

        // Notify StudyDuo if we're in a duo session
        if (typeof StudyDuo !== 'undefined') {
            StudyDuo.onQuizComplete(score, answers);
        }
        
        return { score, correct, total: quiz.length, results };
    },
    
    // Calculate and update progress percentage
    updateProgressPercentage() {
        if (!this.currentCourse) return;
        
        const progress = this.currentCourse.progress;
        const totalItems = this.currentCourse.lessons.length + 2; // lessons + intro + quiz
        let completed = 0;
        
        if (progress.introCompleted) completed++;
        completed += progress.completedLessons.length;
        if (progress.quizCompleted) completed++;
        
        progress.percentage = Math.round((completed / totalItems) * 100);
    },
    
    // Generate PDF notes
    async generateNotesPDF() {
        if (!this.currentCourse) return;
        
        const notes = this.currentCourse.notes;
        const title = this.currentCourse.title;
        
        // Create a simple text file for download (PDF would require a library)
        const blob = new Blob([`${title}\n${'='.repeat(title.length)}\n\n${notes}`], { 
            type: 'text/plain' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_Notes.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Get current course
    getCurrentCourse() {
        return this.currentCourse;
    }
};
