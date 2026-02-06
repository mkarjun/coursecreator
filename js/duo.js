// Study Duo Module — Learn together with a friend, auto-battle at the end
// Flow: Creator shares duo link → Partner loads same course instantly → Both do quiz → Auto-battle

const StudyDuo = {
    currentDuo: null,   // {id, role:'creator'|'partner', creatorName, ...}
    
    // ========== INITIALIZATION (when ?duo=ID is in URL) ==========

    async init(duoId) {
        // Show the duo landing page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('duoPage')?.classList.add('active');
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));

        this.showState('duoLoading');

        const duo = await this.load(duoId);
        if (!duo) {
            this.showState('duoError');
            return;
        }

        this.currentDuo = { ...duo, role: 'partner' };

        // If battle already completed, redirect to battle results
        if (duo.battleId) {
            window.location.href = `/?battle=${duo.battleId}`;
            return;
        }

        // Show partner landing
        this.renderPartnerLanding(duo);
    },

    showState(stateId) {
        document.querySelectorAll('#duoPage .duo-state').forEach(s => s.classList.add('hidden'));
        document.getElementById(stateId)?.classList.remove('hidden');
    },

    // ========== API CALLS ==========

    async load(duoId) {
        try {
            const res = await fetch('/api/duo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get', data: { duoId } }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.error ? null : data;
        } catch (e) {
            console.error('Failed to load duo:', e);
            return null;
        }
    },

    async reportQuizComplete(duoId, role, score, answers, partnerName, partnerId) {
        try {
            const res = await fetch('/api/duo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'quiz_complete',
                    data: { duoId, role, score, answers, partnerName, partnerId },
                }),
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to report quiz:', e);
            return null;
        }
    },

    // ========== CREATOR FLOW (from course page) ==========

    async createDuo() {
        const course = CourseGenerator.getCurrentCourse();
        if (!course) return;

        const btn = document.getElementById('inviteBuddyBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        }

        const user = DatabaseService.currentUser;
        const creatorName = user?.name || 'Study Buddy';
        const creatorId = user?.id || null;

        // Build a LIGHTWEIGHT shareable version — strip video thumbnails/metadata
        const lightLessons = (course.lessons || []).map(l => ({
            id: l.id,
            number: l.number,
            title: l.title,
            description: l.description,
            keyPoints: l.keyPoints,
            videos: (l.videos || []).map(v => ({
                id: v.id,
                title: v.title,
                channelTitle: v.channelTitle,
                thumbnail: v.thumbnail,
                viewCount: v.viewCount,
            })),
        }));

        const courseData = {
            topic: course.topic,
            title: course.title,
            introduction: course.introduction,
            lessons: lightLessons,
            quiz: (course.quiz || []).map(q => ({
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
            })),
            notes: course.notes,
        };

        try {
            const res = await fetch('/api/duo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    data: {
                        creatorName,
                        creatorId,
                        topic: course.topic,
                        courseTitle: course.title,
                        courseData,
                    },
                }),
            });

            const result = await res.json();
            console.log('Duo API response:', result);

            if (!res.ok) {
                alert(`Study duo error: ${result.error || 'Server error ' + res.status}`);
                return;
            }

            if (result.duoId) {
                // Store duo context so quiz completion can report back
                this.currentDuo = {
                    id: result.duoId,
                    role: 'creator',
                    creatorName,
                    creatorId,
                };
                // Also persist in sessionStorage for page reloads
                sessionStorage.setItem('activeDuo', JSON.stringify(this.currentDuo));
                this.showShareDialog(result.duoId, course.topic);
            } else {
                alert(`Study duo failed: ${result.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error('Duo create error:', e);
            alert('Network error creating study duo: ' + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-friends"></i> Invite Study Buddy';
            }
        }
    },

    // ========== PARTNER LANDING ==========

    renderPartnerLanding(duo) {
        document.getElementById('duoCreatorName').textContent = duo.creatorName;
        document.getElementById('duoTopicBadge').textContent = duo.courseTitle || duo.topic;
        this.showState('duoLanding');

        const nameInput = document.getElementById('duoPartnerName');
        setTimeout(() => nameInput?.focus(), 300);

        document.getElementById('duoJoinBtn').onclick = () => this.joinDuo();
        nameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinDuo();
        });
    },

    joinDuo() {
        const input = document.getElementById('duoPartnerName');
        const name = input.value.trim();
        if (!name) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            return;
        }

        this.currentDuo.partnerName = name;
        sessionStorage.setItem('activeDuo', JSON.stringify(this.currentDuo));

        // Load the course data directly into CourseGenerator — INSTANT, no API call
        this.loadSharedCourse(this.currentDuo);
    },

    loadSharedCourse(duo) {
        const courseData = duo.courseData;
        if (!courseData) return;

        // Build a full course object from the shared data
        const course = {
            id: `duo_${duo.id}_${Date.now()}`,
            topic: courseData.topic,
            title: courseData.title,
            introduction: courseData.introduction,
            lessons: courseData.lessons,
            quiz: courseData.quiz,
            notes: courseData.notes,
            progress: {
                percentage: 0,
                completedLessons: [],
                watchedVideos: [],
                introCompleted: false,
                quizCompleted: false,
                quizScore: null,
            },
            duoId: duo.id,
            duoRole: 'partner',
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
        };

        // Set as current course and save locally
        CourseGenerator.currentCourse = course;
        Storage.saveCourse(course);

        // Switch to the normal course view
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        UI.showCourse(course);

        // Show a buddy banner at the top
        this.showDuoBanner(duo.creatorName);
    },

    // ========== DUO BANNER (shows on course page when in duo mode) ==========

    showDuoBanner(buddyName) {
        // Remove any existing banner
        document.querySelector('.duo-banner')?.remove();

        const banner = document.createElement('div');
        banner.className = 'duo-banner';
        banner.innerHTML = `
            <i class="fas fa-user-friends"></i>
            <span>You're studying with <strong>${this._escapeHtml(buddyName)}</strong> — complete the quiz to battle!</span>
        `;

        const courseHeader = document.querySelector('.course-header');
        if (courseHeader) {
            courseHeader.parentNode.insertBefore(banner, courseHeader);
        }
    },

    // ========== QUIZ COMPLETION HOOK ==========

    // Called from CourseGenerator.submitQuiz after scores are calculated
    async onQuizComplete(score, answers) {
        // Check if we're in a duo session
        const duoData = this.currentDuo || JSON.parse(sessionStorage.getItem('activeDuo') || 'null');
        if (!duoData || !duoData.id) return;

        const user = DatabaseService.currentUser;
        const result = await this.reportQuizComplete(
            duoData.id,
            duoData.role,
            score,
            answers,
            duoData.partnerName || user?.name || 'Study Buddy',
            duoData.partnerId || user?.id || null
        );

        if (!result) return;

        if (result.battleReady && result.battleId) {
            // Both done! Show the battle results
            setTimeout(() => {
                this.showBattleReadyBanner(result);
            }, 2500);
        } else {
            // Show waiting message
            setTimeout(() => {
                this.showWaitingBanner(duoData.role === 'creator' ? 'your buddy' : duoData.creatorName);
            }, 2500);
        }
    },

    showBattleReadyBanner(result) {
        // Remove existing banners
        document.querySelector('.duo-battle-banner')?.remove();

        const banner = document.createElement('div');
        banner.className = 'duo-battle-banner';
        banner.innerHTML = `
            <div class="duo-battle-inner">
                <div class="duo-battle-icon">⚔️</div>
                <div class="duo-battle-text">
                    <strong>Battle Ready!</strong>
                    <span>${this._escapeHtml(result.creatorName)} (${result.creatorScore}%) vs ${this._escapeHtml(result.partnerName)} (${result.partnerScore}%)</span>
                </div>
                <button class="btn-primary" onclick="window.location.href='/?battle=${result.battleId}'">
                    <i class="fas fa-trophy"></i> View Results
                </button>
            </div>
        `;

        // Insert at top of main content
        const main = document.querySelector('.main-content');
        if (main) {
            main.insertBefore(banner, main.firstChild?.nextSibling);
        }
    },

    showWaitingBanner(waitingFor) {
        document.querySelector('.duo-battle-banner')?.remove();

        const banner = document.createElement('div');
        banner.className = 'duo-battle-banner waiting';
        banner.innerHTML = `
            <div class="duo-battle-inner">
                <div class="duo-battle-icon">⏳</div>
                <div class="duo-battle-text">
                    <strong>Quiz submitted!</strong>
                    <span>Waiting for ${this._escapeHtml(waitingFor)} to finish their quiz — then you'll battle!</span>
                </div>
            </div>
        `;

        const main = document.querySelector('.main-content');
        if (main) {
            main.insertBefore(banner, main.firstChild?.nextSibling);
        }
    },

    // ========== SHARE DIALOG ==========

    showShareDialog(duoId, topic) {
        const link = `${window.location.origin}/?duo=${duoId}`;
        const text = `Let's learn ${topic} together! Join my study session 📚🤝`;

        document.querySelector('.duo-share-modal')?.remove();

        const modal = document.createElement('div');
        modal.className = 'duo-share-modal';
        modal.innerHTML = `
            <div class="duo-share-content">
                <button class="duo-share-close" onclick="this.closest('.duo-share-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="duo-share-header">
                    <div class="duo-share-icon">🤝</div>
                    <h2>Study Buddy Invited!</h2>
                    <p>Share this link so your friend gets the <strong>exact same course</strong> instantly</p>
                </div>
                <div class="duo-share-link">
                    <input type="text" value="${link}" readonly id="duoLinkInput" onclick="this.select()">
                    <button onclick="StudyDuo.copyLink()" class="btn-primary" id="duoCopyBtn">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div class="duo-share-buttons">
                    <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}', '_blank')" class="duo-share-btn whatsapp">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}', '_blank')" class="duo-share-btn twitter">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}', '_blank')" class="duo-share-btn linkedin">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </button>
                </div>
                <div class="duo-share-note">
                    <i class="fas fa-info-circle"></i>
                    When your buddy finishes the quiz, a <strong>1v1 battle</strong> is auto-created!
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    copyLink() {
        const input = document.getElementById('duoLinkInput');
        if (!input) return;
        navigator.clipboard.writeText(input.value).then(() => {
            const btn = document.getElementById('duoCopyBtn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
            }
        });
    },

    // ========== HELPERS ==========

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    },
};
