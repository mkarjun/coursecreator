// Battle Module — 1v1 Learning Battles
// Handles creating challenges, opponent quiz flow, and results comparison

const Battle = {
    currentBattle: null,
    opponentName: '',

    // ========== INITIALIZATION ==========

    // Called when ?battle=ID is detected in URL
    async init(battleId) {
        // Show battle page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('battlePage')?.classList.add('active');

        // Hide sidebar active states
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));

        const battle = await this.load(battleId);
        if (!battle) {
            this.showState('battleError');
            return;
        }

        this.currentBattle = battle;

        if (battle.status === 'completed') {
            // Battle already completed, show final results
            this.renderResults({
                challengerName: battle.challengerName,
                challengerScore: battle.challengerScore,
                opponentName: battle.opponentName,
                opponentScore: battle.opponentScore,
                topic: battle.topic,
                courseTitle: battle.courseTitle,
                quizData: battle.quizData,
            });
            return;
        }

        // Show challenge landing
        this.renderLanding(battle);
    },

    // Toggle visibility of battle sub-states
    showState(stateId) {
        document.querySelectorAll('#battlePage .battle-state').forEach(s => s.classList.add('hidden'));
        document.getElementById(stateId)?.classList.remove('hidden');
    },

    // ========== API CALLS ==========

    async load(battleId) {
        try {
            const res = await fetch('/api/battle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get', data: { battleId } }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.error ? null : data;
        } catch (e) {
            console.error('Failed to load battle:', e);
            return null;
        }
    },

    async submitAnswers(battleId, opponentName, answers, score) {
        try {
            const res = await fetch('/api/battle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit',
                    data: { battleId, opponentName, opponentScore: score, opponentAnswers: answers },
                }),
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to submit battle:', e);
            return null;
        }
    },

    // ========== LANDING PAGE ==========

    renderLanding(battle) {
        document.getElementById('battleChallengerName').textContent = battle.challengerName;
        document.getElementById('battleTopicBadge').textContent = battle.courseTitle || battle.topic;
        this.showState('battleLanding');

        const nameInput = document.getElementById('battleOpponentName');
        setTimeout(() => nameInput?.focus(), 300);

        // Accept button
        document.getElementById('battleAcceptBtn').onclick = () => this.acceptChallenge();

        // Enter key on name input
        nameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.acceptChallenge();
        });
    },

    acceptChallenge() {
        const input = document.getElementById('battleOpponentName');
        const name = input.value.trim();
        if (!name) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            return;
        }
        this.opponentName = name;
        this.renderBattleQuiz();
    },

    // ========== QUIZ ==========

    renderBattleQuiz() {
        const battle = this.currentBattle;
        document.getElementById('battleQuizTopic').textContent = battle.courseTitle || battle.topic;

        const container = document.getElementById('battleQuizContainer');
        container.innerHTML = battle.quizData.map((q, i) => `
            <div class="battle-quiz-question" data-question="${i}">
                <h4>Q${i + 1}: ${q.question}</h4>
                <div class="battle-quiz-options">
                    ${q.options.map((opt, j) => `
                        <label class="battle-quiz-option" data-option="${j}">
                            <input type="radio" name="battle_q${i}" value="${j}">
                            <span class="option-marker">${String.fromCharCode(65 + j)}</span>
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Option click handlers
        container.querySelectorAll('.battle-quiz-option').forEach(opt => {
            opt.addEventListener('click', function () {
                const qEl = this.closest('.battle-quiz-question');
                qEl.querySelectorAll('.battle-quiz-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                this.querySelector('input').checked = true;
            });
        });

        document.getElementById('battleSubmitBtn').onclick = () => this.handleSubmit();
        this.showState('battleQuiz');
    },

    async handleSubmit() {
        const battle = this.currentBattle;
        const answers = [];
        let allAnswered = true;

        battle.quizData.forEach((_, i) => {
            const selected = document.querySelector(`input[name="battle_q${i}"]:checked`);
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

        // Disable submit
        const btn = document.getElementById('battleSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        // Submit to API (server calculates verified score)
        const result = await this.submitAnswers(battle.id, this.opponentName, answers, 0);

        if (!result || result.error) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Answers';
            alert('Failed to submit. Please try again.');
            return;
        }

        // Show correct/incorrect on each question using server response
        if (result.quizData) {
            result.quizData.forEach((q, i) => {
                const questionEl = document.querySelector(`.battle-quiz-question[data-question="${i}"]`);
                if (!questionEl) return;
                const options = questionEl.querySelectorAll('.battle-quiz-option');
                options.forEach((opt, j) => {
                    if (j === q.correctIndex) {
                        opt.classList.add('correct');
                    } else if (j === answers[i] && answers[i] !== q.correctIndex) {
                        opt.classList.add('incorrect');
                    }
                });
            });
        }

        // Brief pause to see answers, then show results
        setTimeout(() => this.renderResults(result), 1500);
    },

    // ========== RESULTS ==========

    renderResults(results) {
        const topic = results.courseTitle || results.topic || this.currentBattle?.topic || '';
        document.getElementById('battleResultsTopic').textContent = topic;

        const cScore = results.challengerScore;
        const oScore = results.opponentScore;
        const cWins = cScore > oScore;
        const tie = cScore === oScore;

        document.getElementById('battleScoreboard').innerHTML = `
            <div class="battle-player ${cWins && !tie ? 'winner' : ''}">
                <div class="battle-player-avatar">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="battle-player-name">${this._escapeHtml(results.challengerName)}</div>
                <div class="battle-player-score">${cScore}%</div>
                <div class="battle-player-label">${cWins && !tie ? '👑 Winner' : tie ? '🤝 Tie' : ''}</div>
            </div>
            <div class="battle-vs">VS</div>
            <div class="battle-player ${!cWins && !tie ? 'winner' : ''}">
                <div class="battle-player-avatar">
                    <i class="fas fa-user-ninja"></i>
                </div>
                <div class="battle-player-name">${this._escapeHtml(results.opponentName)}</div>
                <div class="battle-player-score">${oScore}%</div>
                <div class="battle-player-label">${!cWins && !tie ? '👑 Winner' : tie ? '🤝 Tie' : ''}</div>
            </div>
        `;

        // Set the topic on the CTA button
        document.getElementById('battleCtaTopic').textContent = topic;
        this.showState('battleResults');
    },

    // ========== CHALLENGER FLOW (create battle from quiz results) ==========

    async initChallenge() {
        const course = CourseGenerator.getCurrentCourse();
        if (!course || !course.quiz) return;

        const btn = document.getElementById('challengeFriendBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        }

        const user = DatabaseService.currentUser;
        const challengerName = user?.name || 'Anonymous Learner';
        const challengerId = user?.id || null;

        try {
            const res = await fetch('/api/battle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    data: {
                        challengerName,
                        challengerId,
                        topic: course.topic,
                        courseTitle: course.title,
                        quizData: course.quiz.map(q => ({
                            question: q.question,
                            options: q.options,
                            correctIndex: q.correctIndex,
                            explanation: q.explanation,
                        })),
                        challengerScore: course.progress?.quizScore || 0,
                        challengerAnswers: course.progress?.quizAnswers || [],
                    },
                }),
            });

            const result = await res.json();
            if (result.battleId) {
                this.showShareDialog(result.battleId, course.topic);
            } else {
                alert('Failed to create challenge. Please try again.');
            }
        } catch (e) {
            console.error('Battle create error:', e);
            alert('Failed to create challenge. Please try again.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-bolt"></i> Challenge a Friend';
            }
        }
    },

    // ========== SHARE DIALOG ==========

    showShareDialog(battleId, topic) {
        const link = `${window.location.origin}/?battle=${battleId}`;
        const text = `I just aced a ${topic} quiz! Think you can beat me? 🎯⚔️`;

        // Remove any existing modal
        document.querySelector('.battle-share-modal')?.remove();

        const modal = document.createElement('div');
        modal.className = 'battle-share-modal';
        modal.innerHTML = `
            <div class="battle-share-content">
                <button class="battle-share-close" onclick="this.closest('.battle-share-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="battle-share-header">
                    <div class="battle-share-icon">⚔️</div>
                    <h2>Challenge Created!</h2>
                    <p>Share this link to challenge a friend on <strong>${this._escapeHtml(topic)}</strong></p>
                </div>
                <div class="battle-share-link">
                    <input type="text" value="${link}" readonly id="battleLinkInput" onclick="this.select()">
                    <button onclick="Battle.copyLink()" class="btn-primary" id="battleCopyBtn">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div class="battle-share-buttons">
                    <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}', '_blank')" class="battle-share-btn whatsapp">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}', '_blank')" class="battle-share-btn twitter">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}', '_blank')" class="battle-share-btn linkedin">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    copyLink() {
        const input = document.getElementById('battleLinkInput');
        if (!input) return;
        navigator.clipboard.writeText(input.value).then(() => {
            const btn = document.getElementById('battleCopyBtn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
            }
        });
    },

    // Navigate to create a course from the battle topic
    startCourse() {
        const topic = this.currentBattle?.topic || '';
        window.location.href = `/?topic=${encodeURIComponent(topic)}`;
    },

    // ========== HELPERS ==========

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    },
};
