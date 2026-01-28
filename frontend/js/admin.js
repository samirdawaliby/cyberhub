// =============================================
// CYBERHUB ADMIN - MAIN JAVASCRIPT
// =============================================

// API Base URL
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8787'
    : 'https://cyberhub-api.cyberhub-e83.workers.dev';

// State
let currentUser = null;
let exercises = [];
let themes = [];
let editors = [];

// =============================================
// AUTHENTICATION
// =============================================

async function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        showLoginModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('admin_token');
            showLoginModal();
            return;
        }

        const data = await response.json();
        currentUser = data.data;
        hideLoginModal();
        initAdmin();
    } catch (error) {
        console.error('Auth check failed:', error);
        showLoginModal();
    }
}

function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('admin-sidebar').style.display = 'none';
    document.getElementById('admin-content').style.display = 'none';
}

function hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('admin-sidebar').style.display = 'flex';
    document.getElementById('admin-content').style.display = 'block';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!data.success) {
            errorEl.textContent = data.error?.message || 'Identifiants incorrects';
            return;
        }

        localStorage.setItem('admin_token', data.data.token);
        currentUser = data.data.user;
        hideLoginModal();
        initAdmin();
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'Erreur de connexion au serveur';
    }
});

function logout() {
    localStorage.removeItem('admin_token');
    currentUser = null;
    showLoginModal();
}

// =============================================
// INITIALIZATION
// =============================================

function initAdmin() {
    // Update user info in sidebar
    document.getElementById('user-name').textContent = currentUser.display_name;
    document.getElementById('user-role').textContent = currentUser.role === 'superadmin' ? 'Super Admin' : 'Éditeur';
    document.getElementById('user-role-badge').textContent = currentUser.role === 'superadmin' ? 'SUPERADMIN' : 'ÉDITEUR';

    // Show superadmin elements
    if (currentUser.role === 'superadmin') {
        document.body.classList.add('is-superadmin');
    } else {
        document.body.classList.remove('is-superadmin');
    }

    // Load initial data
    loadThemes();

    // Handle URL hash navigation
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
}

function handleHashNavigation() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const validViews = ['dashboard', 'exercises', 'themes', 'editors', 'activity', 'students'];

    if (validViews.includes(hash)) {
        showAdminView(hash);
    } else {
        showAdminView('dashboard');
    }
}

// =============================================
// NAVIGATION
// =============================================

function showAdminView(viewName) {
    // Update URL hash without triggering hashchange
    if (window.location.hash !== `#${viewName}`) {
        history.pushState(null, '', `#${viewName}`);
    }

    // Update nav items
    document.querySelectorAll('.admin-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update views
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Load data for view
    switch (viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'exercises':
            loadExercises();
            break;
        case 'themes':
            loadThemesAdmin();
            break;
        case 'editors':
            loadEditors();
            break;
        case 'activity':
            loadActivityLog();
            break;
        case 'students':
            loadStudents();
            break;
    }
}

// =============================================
// DASHBOARD
// =============================================

async function loadDashboard() {
    const token = localStorage.getItem('admin_token');

    try {
        const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!data.success) return;

        const stats = data.data;

        document.getElementById('stat-exercises').textContent = stats.exercises_count || 0;
        document.getElementById('stat-themes').textContent = stats.themes_count || 0;
        document.getElementById('stat-questions').textContent = stats.questions_count || 0;

        if (document.getElementById('stat-students')) {
            document.getElementById('stat-students').textContent = stats.students_count || 0;
        }

        // Load recent exercises
        loadMyRecentExercises();

        // Load recent activity for superadmin
        if (currentUser.role === 'superadmin') {
            loadRecentActivity();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadMyRecentExercises() {
    const token = localStorage.getItem('admin_token');
    const container = document.getElementById('my-recent-exercises');

    try {
        const response = await fetch(`${API_BASE}/api/admin/exercises?limit=5&created_by=${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!data.success || !data.data.length) {
            container.innerHTML = '<div class="recent-item">Aucun exercice récent</div>';
            return;
        }

        container.innerHTML = data.data.map(ex => `
            <div class="recent-item" onclick="openExerciseEditor('${ex.id}')">
                <strong>${ex.title}</strong>
                <span class="status-badge ${ex.is_published ? 'published' : 'draft'}">
                    ${ex.is_published ? 'Publié' : 'Brouillon'}
                </span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent exercises:', error);
    }
}

async function loadRecentActivity() {
    const token = localStorage.getItem('admin_token');
    const container = document.getElementById('recent-activity');

    try {
        const response = await fetch(`${API_BASE}/api/admin/activity?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!data.success || !data.data.length) {
            container.innerHTML = '<div class="activity-item">Aucune activité récente</div>';
            return;
        }

        container.innerHTML = data.data.map(act => `
            <div class="activity-item">
                <span class="time">${formatTimeAgo(act.created_at)}</span>
                <span class="action"><strong>${act.user_name}</strong> ${formatAction(act.action, act.entity_type)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// =============================================
// EXERCISES
// =============================================

async function loadExercises() {
    const token = localStorage.getItem('admin_token');
    const tbody = document.getElementById('exercises-table-body');

    try {
        // Build query with filters
        const themeFilter = document.getElementById('filter-theme').value;
        const teamFilter = document.getElementById('filter-team').value;
        const statusFilter = document.getElementById('filter-status').value;

        let url = `${API_BASE}/api/admin/exercises?`;
        if (themeFilter) url += `theme_id=${themeFilter}&`;
        if (teamFilter) url += `team=${teamFilter}&`;
        if (statusFilter === 'published') url += 'is_published=1&';
        if (statusFilter === 'draft') url += 'is_published=0&';

        // For editors, only show their exercises
        if (currentUser.role !== 'superadmin') {
            url += `created_by=${currentUser.id}&`;
        }

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        exercises = data.data || [];

        if (!exercises.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">Aucun exercice trouvé</td></tr>';
            return;
        }

        tbody.innerHTML = exercises.map(ex => `
            <tr>
                <td><strong>${ex.title}</strong></td>
                <td>
                    <span class="theme-badge ${ex.team_type}">${ex.theme_name}</span>
                </td>
                <td>
                    <span class="badge ${ex.difficulty}">${ex.difficulty}</span>
                </td>
                <td>${ex.question_count || 0}</td>
                <td>
                    <span class="status-badge ${ex.is_published ? 'published' : 'draft'}">
                        ${ex.is_published ? '✅ Publié' : '📝 Brouillon'}
                    </span>
                </td>
                <td>${ex.creator_name || '-'}</td>
                <td class="actions">
                    <button class="btn-icon" onclick="openExerciseEditor('${ex.id}')" title="Modifier">✏️</button>
                    <button class="btn-icon" onclick="previewExercise('${ex.id}')" title="Aperçu">👁️</button>
                    <button class="btn-icon danger" onclick="deleteExercise('${ex.id}')" title="Supprimer">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading exercises:', error);
    }
}

function filterExercises() {
    loadExercises();
}

async function deleteExercise(exerciseId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) return;

    const token = localStorage.getItem('admin_token');

    try {
        const response = await fetch(`${API_BASE}/api/admin/exercises/${exerciseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadExercises();
        }
    } catch (error) {
        console.error('Error deleting exercise:', error);
    }
}

// =============================================
// THEMES
// =============================================

async function loadThemes() {
    try {
        const response = await fetch(`${API_BASE}/api/themes`);
        const data = await response.json();
        themes = data.data || [];

        // Populate theme selects
        const selects = [
            document.getElementById('filter-theme'),
            document.getElementById('exercise-theme-select')
        ];

        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            select.innerHTML = '<option value="">Sélectionner...</option>';
            themes.forEach(theme => {
                select.innerHTML += `<option value="${theme.id}">${theme.icon} ${theme.name}</option>`;
            });
            select.value = currentValue;
        });
    } catch (error) {
        console.error('Error loading themes:', error);
    }
}

async function loadThemesAdmin() {
    const grid = document.getElementById('themes-admin-grid');
    grid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Chargement...</div>';

    try {
        const response = await fetch(`${API_BASE}/api/themes`);
        const data = await response.json();
        themes = data.data || [];

        if (!themes.length) {
            grid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Aucune thématique</div>';
            return;
        }

        // Séparer Red et Blue team
        const redThemes = themes.filter(t => t.team_type === 'red');
        const blueThemes = themes.filter(t => t.team_type === 'blue');

        grid.innerHTML = `
            <div class="themes-section">
                <h3 style="color: var(--red-accent); margin-bottom: 16px;">🔴 Red Team (Offensive)</h3>
                <div class="themes-cards">
                    ${redThemes.map(theme => `
                        <div class="theme-admin-card red">
                            <h3>${theme.icon || '📁'} ${theme.name}</h3>
                            <p>${theme.description || 'Aucune description'}</p>
                            <div class="meta">
                                <span>${theme.exercise_count || 0} exercices</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="themes-section" style="margin-top: 32px;">
                <h3 style="color: var(--blue-accent); margin-bottom: 16px;">🔵 Blue Team (Defensive)</h3>
                <div class="themes-cards">
                    ${blueThemes.map(theme => `
                        <div class="theme-admin-card blue">
                            <h3>${theme.icon || '📁'} ${theme.name}</h3>
                            <p>${theme.description || 'Aucune description'}</p>
                            <div class="meta">
                                <span>${theme.exercise_count || 0} exercices</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading themes:', error);
        grid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--danger);">Erreur de chargement</div>';
    }
}

function openThemeModal() {
    document.getElementById('theme-modal').classList.add('active');
}

function closeThemeModal() {
    document.getElementById('theme-modal').classList.remove('active');
    document.getElementById('theme-form').reset();
}

document.getElementById('theme-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('admin_token');
    const formData = {
        name: document.getElementById('theme-name').value,
        description: document.getElementById('theme-description').value,
        team_type: document.getElementById('theme-team').value,
        icon: document.getElementById('theme-icon').value || '📁'
    };

    try {
        const response = await fetch(`${API_BASE}/api/admin/themes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            closeThemeModal();
            loadThemesAdmin();
        }
    } catch (error) {
        console.error('Error creating theme:', error);
    }
});

// =============================================
// EDITORS (SuperAdmin only)
// =============================================

async function loadEditors() {
    if (currentUser.role !== 'superadmin') return;

    const token = localStorage.getItem('admin_token');
    const grid = document.getElementById('editors-grid');

    try {
        const response = await fetch(`${API_BASE}/api/admin/editors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        editors = data.data || [];

        grid.innerHTML = editors.map(editor => `
            <div class="editor-card">
                <div class="editor-card-header">
                    <div class="avatar">👤</div>
                    <div>
                        <div class="name">${editor.display_name}</div>
                        <div class="username">@${editor.username}</div>
                    </div>
                </div>
                <div class="editor-stats">
                    <div class="editor-stat">
                        <div class="value">${editor.exercises_count || 0}</div>
                        <div class="label">Exercices</div>
                    </div>
                    <div class="editor-stat">
                        <div class="value">${editor.questions_count || 0}</div>
                        <div class="label">Questions</div>
                    </div>
                    <div class="editor-stat">
                        <div class="value">${editor.published_count || 0}</div>
                        <div class="label">Publiés</div>
                    </div>
                </div>
                <div class="last-active">
                    Dernière connexion: ${editor.last_login_at ? formatTimeAgo(editor.last_login_at) : 'Jamais'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading editors:', error);
    }
}

// =============================================
// ACTIVITY LOG (SuperAdmin only)
// =============================================

async function loadActivityLog() {
    if (currentUser.role !== 'superadmin') return;

    const token = localStorage.getItem('admin_token');
    const container = document.getElementById('activity-log-container');

    try {
        const response = await fetch(`${API_BASE}/api/admin/activity?limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const activities = data.data || [];

        if (!activities.length) {
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Aucune activité enregistrée</div>';
            return;
        }

        container.innerHTML = activities.map(act => `
            <div class="activity-log-item">
                <div class="activity-avatar">👤</div>
                <div class="activity-details">
                    <div class="activity-user">${act.user_name}</div>
                    <div class="activity-action">${formatAction(act.action, act.entity_type)} - ${act.details || ''}</div>
                </div>
                <div class="activity-time">${formatTimeAgo(act.created_at)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activity log:', error);
    }
}

// =============================================
// STUDENTS (SuperAdmin only)
// =============================================

async function loadStudents() {
    if (currentUser.role !== 'superadmin') return;

    const token = localStorage.getItem('admin_token');
    const tbody = document.getElementById('students-table-body');

    try {
        const response = await fetch(`${API_BASE}/api/admin/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const students = data.data || [];

        if (!students.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">Aucun étudiant inscrit</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(s => `
            <tr>
                <td><code>${s.student_code}</code></td>
                <td>${s.display_name || '-'}</td>
                <td class="points-total">${s.total_points || 0}</td>
                <td class="points-red">${s.red_team_points || 0}</td>
                <td class="points-blue">${s.blue_team_points || 0}</td>
                <td>${s.exercises_completed || 0}</td>
                <td>${s.last_active_at ? formatTimeAgo(s.last_active_at) : 'Jamais'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// =============================================
// HELPERS
// =============================================

function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
    return date.toLocaleDateString('fr-FR');
}

function formatAction(action, entityType) {
    const actions = {
        'create': 'a créé',
        'update': 'a modifié',
        'delete': 'a supprimé',
        'publish': 'a publié',
        'unpublish': 'a dépublié',
        'login': 's\'est connecté'
    };

    const entities = {
        'exercise': 'un exercice',
        'question': 'une question',
        'theme': 'une thématique'
    };

    return `${actions[action] || action} ${entities[entityType] || entityType || ''}`;
}

// =============================================
// INIT
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
