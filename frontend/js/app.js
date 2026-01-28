// CyberHub - Application principale

// État de l'application
const state = {
    themes: [],
    currentTheme: null,
    currentExercise: null,
    currentQuestions: [],
    answers: {},
    currentLabSession: null,
    studentInfo: null,
    scoreboard: [],
};

// Éléments DOM
const elements = {
    redTeamNav: document.getElementById('red-team-nav'),
    blueTeamNav: document.getElementById('blue-team-nav'),
    themesGrid: document.getElementById('themes-grid'),
    exercisesList: document.getElementById('exercises-list'),
    courseContent: document.getElementById('course-content'),
    questionsContainer: document.getElementById('questions-container'),
    questionsList: document.getElementById('questions-list'),
    studentCodeInput: document.getElementById('studentCode'),
    studentStats: document.getElementById('student-stats'),
    loading: document.getElementById('loading'),
};

// =============================================
// INITIALISATION
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Charger le code élève depuis localStorage
    const savedCode = localStorage.getItem('studentCode');
    if (savedCode) {
        elements.studentCodeInput.value = savedCode;
        await loadStudentInfo(savedCode);
    }

    // Initialiser les onglets
    initTabs();

    // Charger les thématiques
    await loadThemes();
});

// =============================================
// CHARGEMENT DES DONNÉES
// =============================================

async function loadThemes() {
    showLoading(true);
    try {
        const response = await api.getThemes();
        state.themes = response.data;
        renderThemesNav();
        renderThemesGrid();
        updateTeamCounts();
    } catch (error) {
        console.error('Erreur chargement thématiques:', error);
    } finally {
        showLoading(false);
    }
}

async function loadTheme(themeId) {
    showLoading(true);
    try {
        const response = await api.getTheme(themeId);
        state.currentTheme = response.data;
        renderThemeView();
        showView('theme');

        // Mise à jour nav
        updateNavActiveState(themeId);
    } catch (error) {
        console.error('Erreur chargement thème:', error);
    } finally {
        showLoading(false);
    }
}

async function loadExercise(exerciseId) {
    showLoading(true);
    try {
        const [exerciseRes, questionsRes] = await Promise.all([
            api.getExercise(exerciseId),
            api.getQuestions(exerciseId),
        ]);

        state.currentExercise = exerciseRes.data;
        state.currentQuestions = questionsRes.data || [];
        state.answers = {};

        renderExerciseView();
        renderQuestions();
        showView('exercise');
    } catch (error) {
        console.error('Erreur chargement exercice:', error);
    } finally {
        showLoading(false);
    }
}

async function loadScoreboard(filter = 'all') {
    showLoading(true);
    try {
        const response = await api.getScoreboard(filter);
        state.scoreboard = response.data || [];
        renderScoreboard();
    } catch (error) {
        console.error('Erreur chargement scoreboard:', error);
        // Afficher des données de démo si l'API échoue
        state.scoreboard = getDemoScoreboard();
        renderScoreboard();
    } finally {
        showLoading(false);
    }
}

async function loadStudentInfo(studentCode) {
    try {
        const response = await api.getStudentStats(studentCode);
        state.studentInfo = response.data;
        updateStudentDisplay();
    } catch (error) {
        // Nouvel étudiant, pas encore de stats
        state.studentInfo = null;
    }
}

// =============================================
// RENDU
// =============================================

function renderThemesNav() {
    const redThemes = state.themes.filter(t => t.team_type === 'red' && t.parent_id);
    const blueThemes = state.themes.filter(t => t.team_type === 'blue' && t.parent_id);

    elements.redTeamNav.innerHTML = redThemes.map(theme => `
        <div class="theme-nav-item red" data-theme-id="${theme.id}" onclick="loadTheme('${theme.id}')">
            <span class="theme-dot" style="background: ${theme.color}"></span>
            <span>${theme.name}</span>
        </div>
    `).join('');

    elements.blueTeamNav.innerHTML = blueThemes.map(theme => `
        <div class="theme-nav-item blue" data-theme-id="${theme.id}" onclick="loadTheme('${theme.id}')">
            <span class="theme-dot" style="background: ${theme.color}"></span>
            <span>${theme.name}</span>
        </div>
    `).join('');
}

function renderThemesGrid() {
    const subThemes = state.themes.filter(t => t.parent_id);

    const icons = {
        'pentesting': '🎯',
        'cryptographie': '🔐',
        'exploitation': '💥',
        'social-engineering': '🎭',
        'osint': '🔍',
        'siem': '📊',
        'firewall': '🛡️',
        'forensics': '🔬',
        'soc': '🚨',
    };

    elements.themesGrid.innerHTML = subThemes.map(theme => `
        <div class="theme-card ${theme.team_type}" onclick="loadTheme('${theme.id}')" style="--theme-color: ${theme.color}">
            <div class="theme-card-header">
                <span class="theme-card-icon">${icons[theme.id] || '📁'}</span>
                <h3>${theme.name}</h3>
            </div>
            <p>${theme.description}</p>
            <div class="theme-card-meta">
                <span>📚 ${theme.exercise_count || 0} exercices</span>
                <span>${theme.team_type === 'red' ? '🔴 Red Team' : '🔵 Blue Team'}</span>
            </div>
        </div>
    `).join('');
}

function updateTeamCounts() {
    const redThemes = state.themes.filter(t => t.team_type === 'red' && t.parent_id);
    const blueThemes = state.themes.filter(t => t.team_type === 'blue' && t.parent_id);

    const redCount = redThemes.reduce((sum, t) => sum + (t.exercise_count || 0), 0);
    const blueCount = blueThemes.reduce((sum, t) => sum + (t.exercise_count || 0), 0);

    document.getElementById('red-exercises-count').textContent = `${redCount} exercices`;
    document.getElementById('blue-exercises-count').textContent = `${blueCount} exercices`;
}

function renderThemeView() {
    const theme = state.currentTheme;
    const icons = {
        'pentesting': '🎯',
        'cryptographie': '🔐',
        'exploitation': '💥',
        'social-engineering': '🎭',
        'osint': '🔍',
        'siem': '📊',
        'firewall': '🛡️',
        'forensics': '🔬',
        'soc': '🚨',
    };

    document.getElementById('theme-title').innerHTML = `${icons[theme.id] || '📁'} ${theme.name}`;
    document.getElementById('theme-description').textContent = theme.description;

    elements.exercisesList.innerHTML = (theme.exercises || []).map(ex => `
        <div class="exercise-card" onclick="loadExercise('${ex.id}')">
            <div class="exercise-info">
                <h3>${ex.title}</h3>
                <p>${ex.description || ''}</p>
            </div>
            <div class="exercise-meta">
                <span class="badge ${ex.difficulty}">${ex.difficulty}</span>
                <span class="badge-info">⏱️ ${ex.duration_minutes} min</span>
                <span class="badge-info">⭐ ${ex.points_max} pts</span>
            </div>
        </div>
    `).join('');
}

function renderExerciseView() {
    const exercise = state.currentExercise;

    document.getElementById('exercise-title').textContent = exercise.title;
    document.getElementById('exercise-difficulty').textContent = exercise.difficulty;
    document.getElementById('exercise-difficulty').className = `badge ${exercise.difficulty}`;
    document.getElementById('exercise-duration').textContent = `⏱️ ${exercise.duration_minutes} min`;
    document.getElementById('exercise-points').textContent = `⭐ ${exercise.points_max} pts`;

    // Rendu Markdown
    if (exercise.course_content) {
        elements.courseContent.innerHTML = marked.parse(exercise.course_content);
    } else {
        elements.courseContent.innerHTML = '<p>Aucun contenu de cours disponible.</p>';
    }

    // Bouton retour
    document.getElementById('btn-back-to-theme').onclick = () => {
        if (state.currentTheme) {
            showView('theme');
        } else {
            showView('home');
        }
    };

    // Reset tabs
    resetTabs();

    // Configuration lab
    setupLabControls(exercise);
}

function renderQuestions() {
    const questions = state.currentQuestions;
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    document.getElementById('max-score').textContent = maxScore;
    document.getElementById('current-score').textContent = '0';

    if (questions.length === 0) {
        elements.questionsList.innerHTML = '<p class="no-questions">Aucune question pour cet exercice.</p>';
        document.getElementById('btn-submit-all').style.display = 'none';
        return;
    }

    document.getElementById('btn-submit-all').style.display = 'block';

    elements.questionsList.innerHTML = questions.map((q, index) => {
        let answerHtml = '';

        if (q.question_type === 'qcm') {
            const options = JSON.parse(q.options || '[]');
            answerHtml = `
                <div class="question-options">
                    ${options.map((opt, i) => `
                        <label class="question-option" onclick="selectOption('${q.id}', '${opt}', this)">
                            <input type="radio" name="q-${q.id}" value="${opt}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (q.question_type === 'text' || q.question_type === 'flag') {
            const placeholder = q.question_type === 'flag' ? 'FLAG{...}' : 'Votre réponse...';
            answerHtml = `
                <input type="text" class="question-input"
                       id="input-${q.id}"
                       placeholder="${placeholder}"
                       onchange="setAnswer('${q.id}', this.value)">
            `;
        }

        return `
            <div class="question-item" id="question-${q.id}">
                <div class="question-header">
                    <span class="question-number">Question ${index + 1}</span>
                    <span class="question-points">${q.points} points</span>
                </div>
                <div class="question-text">${q.question_text}</div>
                ${answerHtml}
                ${q.hint ? `
                    <button class="btn-show-hint" onclick="showHint('${q.id}')">💡 Indice</button>
                    <div class="question-hint" id="hint-${q.id}">${q.hint}</div>
                ` : ''}
                <div class="question-result" id="result-${q.id}"></div>
            </div>
        `;
    }).join('');
}

function renderScoreboard() {
    const data = state.scoreboard;

    // Podium (top 3)
    const podiumHtml = data.slice(0, 3).map((student, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const classes = ['first', 'second', 'third'];
        return `
            <div class="podium-item ${classes[index]}">
                <div class="podium-rank">${medals[index]}</div>
                <div class="podium-name">${student.display_name}</div>
                <div class="podium-points">${student.total_points} pts</div>
            </div>
        `;
    }).join('');

    document.getElementById('scoreboard-podium').innerHTML = podiumHtml;

    // Table complète
    document.getElementById('scoreboard-body').innerHTML = data.map((student, index) => `
        <tr>
            <td class="rank-cell rank-${index + 1}">#${index + 1}</td>
            <td>${student.display_name}</td>
            <td class="points-red">${student.red_team_points || 0}</td>
            <td class="points-blue">${student.blue_team_points || 0}</td>
            <td class="points-total">${student.total_points}</td>
            <td>${student.exercises_completed || 0}</td>
        </tr>
    `).join('');
}

// =============================================
// GESTION DES QUESTIONS
// =============================================

function selectOption(questionId, value, element) {
    // Désélectionner les autres options
    const parent = element.closest('.question-options');
    parent.querySelectorAll('.question-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    state.answers[questionId] = value;
}

function setAnswer(questionId, value) {
    state.answers[questionId] = value;
}

function showHint(questionId) {
    const hintEl = document.getElementById(`hint-${questionId}`);
    hintEl.style.display = hintEl.style.display === 'block' ? 'none' : 'block';
}

async function submitAllAnswers() {
    const studentCode = localStorage.getItem('studentCode');
    if (!studentCode) {
        alert('Veuillez entrer votre code étudiant');
        elements.studentCodeInput.focus();
        return;
    }

    if (Object.keys(state.answers).length === 0) {
        alert('Veuillez répondre à au moins une question');
        return;
    }

    showLoading(true);
    try {
        const response = await api.submitAllAnswers(state.currentExercise.id, state.answers);
        const results = response.data;

        let totalEarned = 0;

        // Afficher les résultats pour chaque question
        results.forEach(result => {
            const questionEl = document.getElementById(`question-${result.question_id}`);
            const resultEl = document.getElementById(`result-${result.question_id}`);

            if (result.is_correct) {
                questionEl.classList.add('correct');
                questionEl.classList.remove('incorrect');
                resultEl.className = 'question-result correct';
                resultEl.textContent = `✅ Correct ! +${result.points_earned} points`;
                totalEarned += result.points_earned;
            } else {
                questionEl.classList.add('incorrect');
                questionEl.classList.remove('correct');
                resultEl.className = 'question-result incorrect';
                resultEl.textContent = `❌ Incorrect. La bonne réponse était : ${result.correct_answer}`;
            }
        });

        document.getElementById('current-score').textContent = totalEarned;

        // Mettre à jour les stats de l'étudiant
        await loadStudentInfo(studentCode);

    } catch (error) {
        console.error('Erreur soumission:', error);
        alert('Erreur lors de la soumission des réponses');
    } finally {
        showLoading(false);
    }
}

// =============================================
// GESTION ÉTUDIANT
// =============================================

async function registerStudent() {
    const studentCode = elements.studentCodeInput.value.trim();
    if (!studentCode) {
        alert('Veuillez entrer un code étudiant');
        return;
    }

    localStorage.setItem('studentCode', studentCode);

    try {
        await api.registerStudent(studentCode);
        await loadStudentInfo(studentCode);
        alert('Code étudiant enregistré !');
    } catch (error) {
        // L'étudiant existe peut-être déjà
        await loadStudentInfo(studentCode);
    }
}

function updateStudentDisplay() {
    if (state.studentInfo) {
        elements.studentStats.style.display = 'flex';
        document.getElementById('my-points').textContent = state.studentInfo.total_points || 0;
        document.getElementById('my-rank').textContent = state.studentInfo.rank || '-';
    } else {
        elements.studentStats.style.display = 'none';
    }
}

// =============================================
// GESTION DES LABS
// =============================================

function setupLabControls(exercise) {
    const startBtn = document.getElementById('btn-start-lab');
    const stopBtn = document.getElementById('btn-stop-lab');

    if (exercise.container_template_id) {
        startBtn.style.display = 'inline-flex';
        startBtn.onclick = () => startLab(exercise.id);
        stopBtn.onclick = () => stopLab();
    } else {
        startBtn.style.display = 'none';
        document.getElementById('lab-status').textContent = 'Pas de lab disponible pour cet exercice';
    }
}

async function startLab(exerciseId) {
    const studentCode = localStorage.getItem('studentCode');
    if (!studentCode) {
        alert('Veuillez entrer votre code étudiant');
        return;
    }

    const statusEl = document.getElementById('lab-status');
    const startBtn = document.getElementById('btn-start-lab');
    const stopBtn = document.getElementById('btn-stop-lab');
    const vncContainer = document.getElementById('vnc-container');

    try {
        statusEl.textContent = 'Démarrage du lab...';
        statusEl.className = 'lab-status starting';
        startBtn.disabled = true;

        const response = await api.startLab(exerciseId);
        state.currentLabSession = response.data;

        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        vncContainer.style.display = 'flex';

        pollLabStatus(state.currentLabSession.session_id);
    } catch (error) {
        console.error('Erreur démarrage lab:', error);
        statusEl.textContent = `Erreur: ${error.message}`;
        statusEl.className = 'lab-status';
        startBtn.disabled = false;
    }
}

async function pollLabStatus(sessionId) {
    const statusEl = document.getElementById('lab-status');

    try {
        const response = await api.getLabStatus(sessionId);
        const session = response.data;
        state.currentLabSession = session;

        if (session.status === 'running') {
            statusEl.textContent = 'Lab prêt !';
            statusEl.className = 'lab-status running';
            document.querySelector('.vnc-placeholder').textContent =
                'Lab prêt ! L\'intégration VNC sera disponible prochainement.';
        } else if (session.status === 'starting') {
            statusEl.textContent = 'Démarrage en cours...';
            setTimeout(() => pollLabStatus(sessionId), 3000);
        }
    } catch (error) {
        console.error('Erreur polling:', error);
    }
}

async function stopLab() {
    if (!state.currentLabSession) return;

    try {
        await api.stopLab(state.currentLabSession.session_id);
        state.currentLabSession = null;

        document.getElementById('lab-status').textContent = 'Lab arrêté';
        document.getElementById('lab-status').className = 'lab-status';
        document.getElementById('btn-start-lab').style.display = 'inline-flex';
        document.getElementById('btn-start-lab').disabled = false;
        document.getElementById('btn-stop-lab').style.display = 'none';
        document.getElementById('vnc-container').style.display = 'none';
    } catch (error) {
        console.error('Erreur arrêt lab:', error);
    }
}

// =============================================
// NAVIGATION
// =============================================

function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
}

function updateNavActiveState(themeId) {
    document.querySelectorAll('.theme-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.themeId === themeId);
    });
}

function filterByTeam(teamType) {
    // Scroll vers la grille et filtrer visuellement
    const cards = document.querySelectorAll('.theme-card');
    cards.forEach(card => {
        if (teamType === 'all' || card.classList.contains(teamType)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterScoreboard(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    loadScoreboard(filter);
}

function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabName}`));
        });
    });
}

function resetTabs() {
    document.querySelectorAll('.tab').forEach((tab, i) => tab.classList.toggle('active', i === 0));
    document.querySelectorAll('.tab-content').forEach((c, i) => c.classList.toggle('active', i === 0));
}

// =============================================
// UTILITAIRES
// =============================================

function showLoading(show) {
    elements.loading.classList.toggle('active', show);
}

function getDemoScoreboard() {
    return [
        { display_name: 'Eve Lambert', total_points: 610, red_team_points: 350, blue_team_points: 260, exercises_completed: 8 },
        { display_name: 'Charlie Durand', total_points: 520, red_team_points: 280, blue_team_points: 240, exercises_completed: 7 },
        { display_name: 'Alice Martin', total_points: 450, red_team_points: 200, blue_team_points: 250, exercises_completed: 6 },
        { display_name: 'Bob Dupont', total_points: 380, red_team_points: 220, blue_team_points: 160, exercises_completed: 5 },
        { display_name: 'Diana Moreau', total_points: 290, red_team_points: 150, blue_team_points: 140, exercises_completed: 4 },
    ];
}

// Navigation home
document.querySelector('[data-view="home"]')?.addEventListener('click', () => {
    showView('home');
    document.querySelectorAll('.theme-nav-item').forEach(el => el.classList.remove('active'));
});
