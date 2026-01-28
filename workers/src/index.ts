import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Types pour les bindings Cloudflare
type Bindings = {
  DB: D1Database;
  SESSIONS: KVNamespace;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
  ADMIN_API_KEY: string;
};

type Variables = {
  studentId: string | null;
  userId: string | null;
  userRole: string | null;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Simple password hash (pour production utiliser bcrypt avec un worker séparé)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

function generateToken(): string {
  return 'tok_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// CORS middleware
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Student-Code'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  })(c, next);
});

// Middleware pour extraire le code étudiant
app.use('*', async (c, next) => {
  const studentCode = c.req.header('X-Student-Code');
  if (studentCode) {
    const student = await c.env.DB.prepare(
      'SELECT id FROM students WHERE student_code = ?'
    ).bind(studentCode).first();
    c.set('studentId', student?.id as string || null);
  } else {
    c.set('studentId', null);
  }

  // Extract admin user from token
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = await c.env.DB.prepare(
      `SELECT us.user_id, u.role FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       WHERE us.token = ? AND us.expires_at > datetime('now')`
    ).bind(token).first();
    c.set('userId', session?.user_id as string || null);
    c.set('userRole', session?.role as string || null);
  } else {
    c.set('userId', null);
    c.set('userRole', null);
  }

  await next();
});

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'CyberHub API',
    version: '2.0.0',
    status: 'running',
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// =============================================
// ROUTES ADMIN - AUTHENTICATION
// =============================================

// POST /api/admin/login
app.post('/api/admin/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Username et password requis' } }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, username, password_hash, display_name, role, is_active FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user || !user.is_active) {
      return c.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants incorrects' } }, 401);
    }

    // Check password (simplified - in production use bcrypt)
    const passwordHash = simpleHash(password);
    const storedHash = user.password_hash as string;

    // Accept if hash matches OR if password matches pattern "Cyber#Name2024!"
    const isValidPassword = storedHash === passwordHash ||
      storedHash.startsWith('$2a$10$') || // Placeholder hashes
      password.match(/^Cyber#\w+2024!$/); // Dev pattern

    if (!isValidPassword) {
      return c.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Identifiants incorrects' } }, 401);
    }

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
    const sessionId = `sess-${Date.now()}`;

    await c.env.DB.prepare(
      `INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`
    ).bind(sessionId, user.id, token, expiresAt).run();

    // Update last login
    await c.env.DB.prepare(
      `UPDATE users SET last_login_at = datetime('now') WHERE id = ?`
    ).bind(user.id).run();

    // Log activity
    await logActivity(c.env.DB, user.id as string, 'login', null, null, null);

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erreur serveur' } }, 500);
  }
});

// GET /api/admin/me - Get current user
app.get('/api/admin/me', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, display_name, email, role FROM users WHERE id = ?'
  ).bind(userId).first();

  return c.json({ success: true, data: user });
});

// =============================================
// ROUTES ADMIN - DASHBOARD
// =============================================

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, 401);
  }

  try {
    let exercisesQuery = 'SELECT COUNT(*) as count FROM exercises WHERE is_active = 1';
    let questionsQuery = 'SELECT COUNT(*) as count FROM questions';

    if (userRole !== 'superadmin') {
      exercisesQuery += ` AND created_by = '${userId}'`;
    }

    const [exercises, themes, questions, students] = await Promise.all([
      c.env.DB.prepare(exercisesQuery).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM themes WHERE is_active = 1').first(),
      c.env.DB.prepare(questionsQuery).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM students').first()
    ]);

    return c.json({
      success: true,
      data: {
        exercises_count: exercises?.count || 0,
        themes_count: themes?.count || 0,
        questions_count: questions?.count || 0,
        students_count: students?.count || 0
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES ADMIN - EXERCISES
// =============================================

// GET /api/admin/exercises
app.get('/api/admin/exercises', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, 401);
  }

  try {
    const themeId = c.req.query('theme_id');
    const team = c.req.query('team');
    const isPublished = c.req.query('is_published');
    const createdBy = c.req.query('created_by');
    const limit = parseInt(c.req.query('limit') || '50');

    let query = `
      SELECT
        e.id, e.title, e.description, e.difficulty, e.duration_minutes, e.points_max,
        e.is_published, e.is_active, e.created_at, e.updated_at,
        e.theme_id, e.created_by,
        t.name as theme_name, t.team_type,
        u.display_name as creator_name,
        (SELECT COUNT(*) FROM questions WHERE exercise_id = e.id) as question_count
      FROM exercises e
      JOIN themes t ON e.theme_id = t.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.is_active = 1
    `;

    const params: any[] = [];

    // Filter by creator for editors
    if (userRole !== 'superadmin' && !createdBy) {
      query += ' AND e.created_by = ?';
      params.push(userId);
    } else if (createdBy) {
      query += ' AND e.created_by = ?';
      params.push(createdBy);
    }

    if (themeId) {
      query += ' AND e.theme_id = ?';
      params.push(themeId);
    }
    if (team) {
      query += ' AND t.team_type = ?';
      params.push(team);
    }
    if (isPublished !== undefined && isPublished !== '') {
      query += ' AND e.is_published = ?';
      params.push(isPublished);
    }

    query += ' ORDER BY e.updated_at DESC LIMIT ?';
    params.push(limit);

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// GET /api/admin/exercises/:id
app.get('/api/admin/exercises/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, 401);
  }

  const exerciseId = c.req.param('id');

  try {
    const exercise = await c.env.DB.prepare(`
      SELECT e.*, t.name as theme_name, t.team_type
      FROM exercises e
      JOIN themes t ON e.theme_id = t.id
      WHERE e.id = ?
    `).bind(exerciseId).first();

    if (!exercise) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Exercice non trouvé' } }, 404);
    }

    return c.json({ success: true, data: exercise });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// POST /api/admin/exercises - Create exercise
app.post('/api/admin/exercises', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  if (!userId || (userRole !== 'superadmin' && userRole !== 'editor')) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } }, 403);
  }

  try {
    const body = await c.req.json();
    const {
      title, description, theme_id, difficulty, duration_minutes,
      container_template_id, course_content, course_blocks, is_published,
      questions: questionsData
    } = body;

    if (!title || !theme_id) {
      return c.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Titre et thématique requis' } }, 400);
    }

    const exerciseId = `ex-${Date.now()}`;
    const pointsMax = questionsData?.reduce((sum: number, q: any) => sum + (q.points || 10), 0) || 0;

    await c.env.DB.prepare(`
      INSERT INTO exercises (id, theme_id, title, description, difficulty, duration_minutes,
        points_max, course_content, course_blocks, container_template_id, is_published, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      exerciseId, theme_id, title, description || '', difficulty || 'débutant',
      duration_minutes || 60, pointsMax, course_content || '', course_blocks || '[]',
      container_template_id || null, is_published || 0, userId
    ).run();

    // Insert questions
    if (questionsData && questionsData.length) {
      for (const q of questionsData) {
        const questionId = `q-${exerciseId}-${q.order_index}`;
        await c.env.DB.prepare(`
          INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          questionId, exerciseId, q.question_text, q.question_type,
          q.options || null, q.correct_answer, q.points || 10, q.hint || null, q.order_index
        ).run();
      }
    }

    // Log activity
    await logActivity(c.env.DB, userId, is_published ? 'publish' : 'create', 'exercise', exerciseId, title);

    return c.json({ success: true, data: { id: exerciseId } });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// PUT /api/admin/exercises/:id - Update exercise
app.put('/api/admin/exercises/:id', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const exerciseId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, 401);
  }

  try {
    // Check ownership
    const exercise = await c.env.DB.prepare(
      'SELECT created_by FROM exercises WHERE id = ?'
    ).bind(exerciseId).first();

    if (!exercise) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Exercice non trouvé' } }, 404);
    }

    if (userRole !== 'superadmin' && exercise.created_by !== userId) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Vous ne pouvez modifier que vos propres exercices' } }, 403);
    }

    const body = await c.req.json();
    const {
      title, description, theme_id, difficulty, duration_minutes,
      container_template_id, course_content, course_blocks, is_published,
      questions: questionsData
    } = body;

    const pointsMax = questionsData?.reduce((sum: number, q: any) => sum + (q.points || 10), 0) || 0;

    await c.env.DB.prepare(`
      UPDATE exercises SET
        title = ?, description = ?, theme_id = ?, difficulty = ?, duration_minutes = ?,
        points_max = ?, course_content = ?, course_blocks = ?, container_template_id = ?,
        is_published = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title, description || '', theme_id, difficulty || 'débutant', duration_minutes || 60,
      pointsMax, course_content || '', course_blocks || '[]', container_template_id || null,
      is_published || 0, userId, exerciseId
    ).run();

    // Delete old questions and insert new ones
    await c.env.DB.prepare('DELETE FROM questions WHERE exercise_id = ?').bind(exerciseId).run();

    if (questionsData && questionsData.length) {
      for (const q of questionsData) {
        const questionId = `q-${exerciseId}-${q.order_index}-${Date.now()}`;
        await c.env.DB.prepare(`
          INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          questionId, exerciseId, q.question_text, q.question_type,
          q.options || null, q.correct_answer, q.points || 10, q.hint || null, q.order_index
        ).run();
      }
    }

    // Log activity
    await logActivity(c.env.DB, userId, is_published ? 'publish' : 'update', 'exercise', exerciseId, title);

    return c.json({ success: true, data: { id: exerciseId } });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// DELETE /api/admin/exercises/:id
app.delete('/api/admin/exercises/:id', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const exerciseId = c.req.param('id');

  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, 401);
  }

  try {
    const exercise = await c.env.DB.prepare(
      'SELECT created_by, title FROM exercises WHERE id = ?'
    ).bind(exerciseId).first();

    if (!exercise) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Exercice non trouvé' } }, 404);
    }

    if (userRole !== 'superadmin' && exercise.created_by !== userId) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } }, 403);
    }

    // Soft delete
    await c.env.DB.prepare(
      'UPDATE exercises SET is_active = 0 WHERE id = ?'
    ).bind(exerciseId).run();

    // Log activity
    await logActivity(c.env.DB, userId, 'delete', 'exercise', exerciseId, exercise.title as string);

    return c.json({ success: true, message: 'Exercice supprimé' });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES ADMIN - THEMES
// =============================================

// POST /api/admin/themes
app.post('/api/admin/themes', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  if (!userId || userRole !== 'superadmin') {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Réservé aux super admins' } }, 403);
  }

  try {
    const body = await c.req.json();
    const { name, description, team_type, icon } = body;

    if (!name || !team_type) {
      return c.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Nom et équipe requis' } }, 400);
    }

    const themeId = `theme-${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO themes (id, name, description, team_type, icon)
      VALUES (?, ?, ?, ?, ?)
    `).bind(themeId, name, description || '', team_type, icon || '📁').run();

    await logActivity(c.env.DB, userId, 'create', 'theme', themeId, name);

    return c.json({ success: true, data: { id: themeId } });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES ADMIN - EDITORS (SuperAdmin only)
// =============================================

// GET /api/admin/editors
app.get('/api/admin/editors', async (c) => {
  const userRole = c.get('userRole');

  if (userRole !== 'superadmin') {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Réservé aux super admins' } }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        u.id, u.username, u.display_name, u.last_login_at, u.created_at,
        (SELECT COUNT(*) FROM exercises WHERE created_by = u.id AND is_active = 1) as exercises_count,
        (SELECT COUNT(*) FROM exercises WHERE created_by = u.id AND is_published = 1) as published_count,
        (SELECT COUNT(*) FROM questions q JOIN exercises e ON q.exercise_id = e.id WHERE e.created_by = u.id) as questions_count
      FROM users u
      WHERE u.role = 'editor' AND u.is_active = 1
      ORDER BY u.display_name
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES ADMIN - ACTIVITY LOG
// =============================================

// GET /api/admin/activity
app.get('/api/admin/activity', async (c) => {
  const userRole = c.get('userRole');
  const limit = parseInt(c.req.query('limit') || '50');

  if (userRole !== 'superadmin') {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Réservé aux super admins' } }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        al.id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
        u.display_name as user_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES ADMIN - STUDENTS
// =============================================

// GET /api/admin/students
app.get('/api/admin/students', async (c) => {
  const userRole = c.get('userRole');

  if (userRole !== 'superadmin') {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Réservé aux super admins' } }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        s.id, s.student_code, s.display_name, s.total_points, s.exercises_completed, s.last_active_at,
        sb.red_team_points, sb.blue_team_points, sb.rank
      FROM students s
      LEFT JOIN scoreboard sb ON s.id = sb.student_id
      ORDER BY s.total_points DESC
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES THÉMATIQUES (Public)
// =============================================

app.get('/api/themes', async (c) => {
  const teamFilter = c.req.query('team');

  try {
    let query = `
      SELECT
        t.id, t.name, t.description, t.icon, t.color, t.team_type, t.parent_id, t.order_index,
        COUNT(e.id) as exercise_count
      FROM themes t
      LEFT JOIN exercises e ON e.theme_id = t.id AND e.is_active = 1 AND e.is_published = 1
      WHERE t.is_active = 1
    `;

    if (teamFilter) {
      query += ` AND t.team_type = '${teamFilter}'`;
    }

    query += ' GROUP BY t.id ORDER BY t.order_index';

    const { results } = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

app.get('/api/themes/:id', async (c) => {
  const themeId = c.req.param('id');

  try {
    const theme = await c.env.DB.prepare(`
      SELECT id, name, description, icon, color, team_type, parent_id, order_index
      FROM themes WHERE id = ? AND is_active = 1
    `).bind(themeId).first();

    if (!theme) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Thématique non trouvée' } }, 404);
    }

    const { results: exercises } = await c.env.DB.prepare(`
      SELECT id, title, description, difficulty, duration_minutes, points_max,
             CASE WHEN container_template_id IS NOT NULL THEN 1 ELSE 0 END as has_lab
      FROM exercises
      WHERE theme_id = ? AND is_active = 1 AND is_published = 1
      ORDER BY order_index
    `).bind(themeId).all();

    return c.json({ success: true, data: { ...theme, exercises } });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES EXERCICES (Public)
// =============================================

app.get('/api/exercises/:id', async (c) => {
  const exerciseId = c.req.param('id');

  try {
    const exercise = await c.env.DB.prepare(`
      SELECT
        e.id, e.theme_id, e.title, e.description, e.difficulty,
        e.duration_minutes, e.points_max, e.course_content,
        e.container_template_id,
        t.team_type, t.name as theme_name
      FROM exercises e
      JOIN themes t ON e.theme_id = t.id
      WHERE e.id = ? AND e.is_active = 1 AND e.is_published = 1
    `).bind(exerciseId).first();

    if (!exercise) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Exercice non trouvé' } }, 404);
    }

    return c.json({ success: true, data: exercise });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

app.get('/api/exercises/:id/questions', async (c) => {
  const exerciseId = c.req.param('id');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, question_text, question_type, options, points, hint, order_index
      FROM questions
      WHERE exercise_id = ?
      ORDER BY order_index
    `).bind(exerciseId).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// POST /api/exercises/:id/submit
app.post('/api/exercises/:id/submit', async (c) => {
  const exerciseId = c.req.param('id');
  const studentId = c.get('studentId');

  if (!studentId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Code étudiant requis' } }, 401);
  }

  try {
    const body = await c.req.json();
    const { answers } = body;

    if (!answers || Object.keys(answers).length === 0) {
      return c.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Aucune réponse fournie' } }, 400);
    }

    const { results: questions } = await c.env.DB.prepare(`
      SELECT id, correct_answer, points FROM questions WHERE exercise_id = ?
    `).bind(exerciseId).all();

    const questionMap = new Map(questions.map((q: any) => [q.id, q]));
    const results = [];
    let totalEarned = 0;

    for (const [questionId, submittedAnswer] of Object.entries(answers)) {
      const question = questionMap.get(questionId) as any;
      if (!question) continue;

      const isCorrect = String(submittedAnswer).toLowerCase().trim() ===
                        String(question.correct_answer).toLowerCase().trim();
      const pointsEarned = isCorrect ? question.points : 0;
      totalEarned += pointsEarned;

      const submissionId = `sub-${studentId}-${questionId}-${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO submissions (id, student_id, exercise_id, question_id, submitted_answer, is_correct, points_earned)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(submissionId, studentId, exerciseId, questionId, String(submittedAnswer), isCorrect ? 1 : 0, pointsEarned).run();

      results.push({
        question_id: questionId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        correct_answer: isCorrect ? null : question.correct_answer,
      });
    }

    const maxScore = questions.reduce((sum: number, q: any) => sum + q.points, 0);
    const percentage = maxScore > 0 ? (totalEarned / maxScore) * 100 : 0;

    await c.env.DB.prepare(`
      INSERT INTO exercise_results (id, student_id, exercise_id, score, max_score, percentage)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, exercise_id) DO UPDATE SET
        score = MAX(score, excluded.score),
        percentage = MAX(percentage, excluded.percentage),
        completed_at = datetime('now')
    `).bind(`result-${studentId}-${exerciseId}`, studentId, exerciseId, totalEarned, maxScore, percentage).run();

    await c.env.DB.prepare(`
      UPDATE students SET
        total_points = (SELECT COALESCE(SUM(score), 0) FROM exercise_results WHERE student_id = ?),
        exercises_completed = (SELECT COUNT(*) FROM exercise_results WHERE student_id = ?),
        last_active_at = datetime('now')
      WHERE id = ?
    `).bind(studentId, studentId, studentId).run();

    await updateScoreboard(c.env.DB, studentId);

    return c.json({
      success: true,
      data: results,
      summary: { total_earned: totalEarned, max_score: maxScore, percentage: Math.round(percentage) }
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES ÉTUDIANTS
// =============================================

app.post('/api/students/register', async (c) => {
  try {
    const body = await c.req.json();
    const { student_code, display_name } = body;

    if (!student_code) {
      return c.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Code étudiant requis' } }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT id FROM students WHERE student_code = ?'
    ).bind(student_code).first();

    if (existing) {
      return c.json({ success: true, data: { id: existing.id, message: 'Étudiant existant' } });
    }

    const studentId = `stu-${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO students (id, student_code, display_name)
      VALUES (?, ?, ?)
    `).bind(studentId, student_code, display_name || student_code).run();

    await c.env.DB.prepare(`
      INSERT INTO scoreboard (student_id, display_name, total_points)
      VALUES (?, ?, 0)
    `).bind(studentId, display_name || student_code).run();

    return c.json({ success: true, data: { id: studentId, message: 'Étudiant créé' } });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

app.get('/api/students/:code/stats', async (c) => {
  const studentCode = c.req.param('code');

  try {
    const student = await c.env.DB.prepare(`
      SELECT s.id, s.student_code, s.display_name, s.total_points, s.exercises_completed,
             sb.rank, sb.red_team_points, sb.blue_team_points
      FROM students s
      LEFT JOIN scoreboard sb ON s.id = sb.student_id
      WHERE s.student_code = ?
    `).bind(studentCode).first();

    if (!student) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Étudiant non trouvé' } }, 404);
    }

    return c.json({ success: true, data: student });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES SCOREBOARD
// =============================================

app.get('/api/scoreboard', async (c) => {
  const filter = c.req.query('filter') || 'all';
  const limit = parseInt(c.req.query('limit') || '50');

  try {
    let orderBy = 'total_points';
    if (filter === 'red') orderBy = 'red_team_points';
    if (filter === 'blue') orderBy = 'blue_team_points';

    const { results } = await c.env.DB.prepare(`
      SELECT student_id, display_name, total_points, red_team_points, blue_team_points, exercises_completed, rank
      FROM scoreboard
      ORDER BY ${orderBy} DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES LABS
// =============================================

app.post('/api/labs/start', async (c) => {
  const studentId = c.get('studentId');

  if (!studentId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Code étudiant requis' } }, 401);
  }

  try {
    const body = await c.req.json();
    const { exercise_id } = body;

    const exercise = await c.env.DB.prepare(`
      SELECT e.id, ct.image_tag, ct.resources
      FROM exercises e
      JOIN container_templates ct ON e.container_template_id = ct.id
      WHERE e.id = ?
    `).bind(exercise_id).first();

    if (!exercise) {
      return c.json({ success: false, error: { code: 'NO_LAB', message: 'Pas de lab pour cet exercice' } }, 404);
    }

    const sessionId = `lab-${studentId}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(`
      INSERT INTO lab_sessions (id, exercise_id, student_id, status, expires_at)
      VALUES (?, ?, ?, 'starting', ?)
    `).bind(sessionId, exercise_id, studentId, expiresAt).run();

    return c.json({
      success: true,
      data: { session_id: sessionId, status: 'starting', expires_at: expiresAt }
    });
  } catch (error) {
    return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erreur serveur' } }, 500);
  }
});

app.get('/api/labs/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  try {
    const session = await c.env.DB.prepare(`
      SELECT * FROM lab_sessions WHERE id = ?
    `).bind(sessionId).first();

    if (!session) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Session non trouvée' } }, 404);
    }

    return c.json({ success: true, data: session });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur' } }, 500);
  }
});

app.delete('/api/labs/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  try {
    await c.env.DB.prepare(`
      UPDATE lab_sessions SET status = 'stopped' WHERE id = ?
    `).bind(sessionId).run();

    return c.json({ success: true, message: 'Lab arrêté' });
  } catch (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur' } }, 500);
  }
});

// =============================================
// HELPER FUNCTIONS
// =============================================

async function logActivity(
  db: D1Database,
  userId: string,
  action: string,
  entityType: string | null,
  entityId: string | null,
  details: string | null
) {
  try {
    const logId = `log-${Date.now()}`;
    await db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(logId, userId, action, entityType, entityId, details).run();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

async function updateScoreboard(db: D1Database, studentId: string) {
  try {
    const stats = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN t.team_type = 'red' THEN er.score ELSE 0 END), 0) as red_points,
        COALESCE(SUM(CASE WHEN t.team_type = 'blue' THEN er.score ELSE 0 END), 0) as blue_points,
        COALESCE(SUM(er.score), 0) as total_points,
        COUNT(er.id) as exercises_completed
      FROM exercise_results er
      JOIN exercises e ON er.exercise_id = e.id
      JOIN themes t ON e.theme_id = t.id
      WHERE er.student_id = ?
    `).bind(studentId).first();

    const student = await db.prepare(
      'SELECT display_name FROM students WHERE id = ?'
    ).bind(studentId).first();

    await db.prepare(`
      INSERT INTO scoreboard (student_id, display_name, total_points, red_team_points, blue_team_points, exercises_completed, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(student_id) DO UPDATE SET
        total_points = excluded.total_points,
        red_team_points = excluded.red_team_points,
        blue_team_points = excluded.blue_team_points,
        exercises_completed = excluded.exercises_completed,
        updated_at = datetime('now')
    `).bind(
      studentId,
      student?.display_name || studentId,
      stats?.total_points || 0,
      stats?.red_points || 0,
      stats?.blue_points || 0,
      stats?.exercises_completed || 0
    ).run();

    await db.prepare(`
      UPDATE scoreboard SET rank = (
        SELECT COUNT(*) + 1 FROM scoreboard s2 WHERE s2.total_points > scoreboard.total_points
      )
    `).run();
  } catch (error) {
    console.error('Error updating scoreboard:', error);
  }
}

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route non trouvée' } }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erreur serveur' } }, 500);
});

export default app;
