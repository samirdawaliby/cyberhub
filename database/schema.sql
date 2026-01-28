-- =============================================
-- CYBERHUB - SCHÉMA DE BASE DE DONNÉES
-- Plateforme de formation Cybersécurité
-- Red Team (Offensive) & Blue Team (Défensive)
-- =============================================

-- Thématiques (Red Team, Blue Team, sous-catégories)
CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    team_type TEXT CHECK(team_type IN ('red', 'blue')),
    parent_id TEXT REFERENCES themes(id),
    order_index INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Exercices / TPs
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    theme_id TEXT NOT NULL REFERENCES themes(id),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT CHECK(difficulty IN ('débutant', 'intermédiaire', 'avancé', 'expert')),
    duration_minutes INTEGER DEFAULT 60,
    points_max INTEGER DEFAULT 100,
    course_content TEXT,
    pdf_path TEXT,
    container_template_id TEXT REFERENCES container_templates(id),
    order_index INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Questions pour chaque exercice
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('qcm', 'text', 'flag', 'code')),
    options TEXT,  -- JSON pour QCM: ["option1", "option2", "option3"]
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 10,
    hint TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Étudiants
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    student_code TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    total_points INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_active_at TEXT DEFAULT (datetime('now'))
);

-- Soumissions de réponses
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id),
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    question_id TEXT NOT NULL REFERENCES questions(id),
    submitted_answer TEXT NOT NULL,
    is_correct INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 1,
    submitted_at TEXT DEFAULT (datetime('now'))
);

-- Résultats d'exercices (score final par exercice)
CREATE TABLE IF NOT EXISTS exercise_results (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id),
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    percentage REAL DEFAULT 0,
    time_spent_minutes INTEGER,
    started_at TEXT,
    completed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, exercise_id)
);

-- Sessions de labs actives
CREATE TABLE IF NOT EXISTS lab_sessions (
    id TEXT PRIMARY KEY,
    exercise_id TEXT REFERENCES exercises(id),
    student_id TEXT REFERENCES students(id),
    container_id TEXT,
    vnc_url TEXT,
    status TEXT DEFAULT 'starting' CHECK(status IN ('starting', 'running', 'stopped', 'error', 'expired')),
    started_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    error_message TEXT
);

-- Templates de containers pour les labs
CREATE TABLE IF NOT EXISTS container_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_tag TEXT NOT NULL,
    team_type TEXT CHECK(team_type IN ('red', 'blue', 'both')),
    vnc_port INTEGER DEFAULT 5900,
    resources TEXT,  -- JSON: {"cpu": "1", "memory": "2Gi"}
    created_at TEXT DEFAULT (datetime('now'))
);

-- Scoreboard cache (mis à jour périodiquement)
CREATE TABLE IF NOT EXISTS scoreboard (
    student_id TEXT PRIMARY KEY REFERENCES students(id),
    display_name TEXT,
    total_points INTEGER DEFAULT 0,
    red_team_points INTEGER DEFAULT 0,
    blue_team_points INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_exercises_theme ON exercises(theme_id);
CREATE INDEX IF NOT EXISTS idx_questions_exercise ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exercise ON submissions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON exercise_results(student_id);
CREATE INDEX IF NOT EXISTS idx_scoreboard_points ON scoreboard(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
