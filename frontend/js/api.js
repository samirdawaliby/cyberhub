// CyberHub - API Client

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8787'
    : 'https://cyberhub-api.cyberhub-e83.workers.dev';

const api = {
    // Helper pour les requêtes
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        // Ajouter le code étudiant si disponible
        const studentCode = localStorage.getItem('studentCode');
        if (studentCode) {
            config.headers['X-Student-Code'] = studentCode;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // =============================================
    // THEMES
    // =============================================

    async getThemes() {
        return this.request('/api/themes');
    },

    async getTheme(themeId) {
        return this.request(`/api/themes/${themeId}`);
    },

    async getThemesByTeam(teamType) {
        return this.request(`/api/themes?team=${teamType}`);
    },

    // =============================================
    // EXERCISES
    // =============================================

    async getExercise(exerciseId) {
        return this.request(`/api/exercises/${exerciseId}`);
    },

    async getExercisesByTheme(themeId) {
        return this.request(`/api/themes/${themeId}/exercises`);
    },

    // =============================================
    // QUESTIONS
    // =============================================

    async getQuestions(exerciseId) {
        return this.request(`/api/exercises/${exerciseId}/questions`);
    },

    async submitAnswer(questionId, answer) {
        return this.request(`/api/questions/${questionId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answer }),
        });
    },

    async submitAllAnswers(exerciseId, answers) {
        return this.request(`/api/exercises/${exerciseId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers }),
        });
    },

    // =============================================
    // STUDENTS
    // =============================================

    async registerStudent(studentCode, displayName = null) {
        return this.request('/api/students/register', {
            method: 'POST',
            body: JSON.stringify({ student_code: studentCode, display_name: displayName }),
        });
    },

    async getStudentStats(studentCode) {
        return this.request(`/api/students/${studentCode}/stats`);
    },

    async getStudentProgress(studentCode) {
        return this.request(`/api/students/${studentCode}/progress`);
    },

    // =============================================
    // SCOREBOARD
    // =============================================

    async getScoreboard(filter = 'all', limit = 50) {
        return this.request(`/api/scoreboard?filter=${filter}&limit=${limit}`);
    },

    async getTopStudents(limit = 10) {
        return this.request(`/api/scoreboard/top?limit=${limit}`);
    },

    // =============================================
    // LABS
    // =============================================

    async startLab(exerciseId) {
        return this.request('/api/labs/start', {
            method: 'POST',
            body: JSON.stringify({ exercise_id: exerciseId }),
        });
    },

    async getLabStatus(sessionId) {
        return this.request(`/api/labs/${sessionId}`);
    },

    async stopLab(sessionId) {
        return this.request(`/api/labs/${sessionId}`, {
            method: 'DELETE',
        });
    },

    // =============================================
    // RESULTS
    // =============================================

    async getExerciseResult(exerciseId) {
        return this.request(`/api/exercises/${exerciseId}/result`);
    },
};

// Export pour utilisation globale
window.api = api;
