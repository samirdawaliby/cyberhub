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
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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
  await next();
});

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'CyberHub API',
    version: '1.0.0',
    status: 'running',
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// =============================================
// ROUTES THÉMATIQUES
// =============================================

// GET /api/themes - Liste toutes les thématiques
app.get('/api/themes', async (c) => {
  const teamFilter = c.req.query('team');

  try {
    let query = `
      SELECT
        t.id, t.name, t.description, t.icon, t.color, t.team_type, t.parent_id, t.order_index,
        COUNT(e.id) as exercise_count
      FROM themes t
      LEFT JOIN exercises e ON e.theme_id = t.id AND e.is_active = 1
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

// GET /api/themes/:id - Détail d'une thématique avec exercices
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
      WHERE theme_id = ? AND is_active = 1
      ORDER BY order_index
    `).bind(themeId).all();

    return c.json({ success: true, data: { ...theme, exercises } });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES EXERCICES
// =============================================

// GET /api/exercises/:id - Détail d'un exercice
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
      WHERE e.id = ? AND e.is_active = 1
    `).bind(exerciseId).first();

    if (!exercise) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Exercice non trouvé' } }, 404);
    }

    return c.json({ success: true, data: exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// GET /api/exercises/:id/questions - Questions d'un exercice
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
    console.error('Error fetching questions:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// POST /api/exercises/:id/submit - Soumettre toutes les réponses
app.post('/api/exercises/:id/submit', async (c) => {
  const exerciseId = c.req.param('id');
  const studentId = c.get('studentId');

  if (!studentId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Code étudiant requis' } }, 401);
  }

  try {
    const body = await c.req.json();
    const { answers } = body; // { questionId: answer, ... }

    if (!answers || Object.keys(answers).length === 0) {
      return c.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Aucune réponse fournie' } }, 400);
    }

    // Récupérer les questions avec réponses correctes
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

      // Enregistrer la soumission
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

    // Mettre à jour ou créer le résultat d'exercice
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

    // Mettre à jour les points totaux de l'étudiant
    await c.env.DB.prepare(`
      UPDATE students SET
        total_points = (SELECT COALESCE(SUM(score), 0) FROM exercise_results WHERE student_id = ?),
        exercises_completed = (SELECT COUNT(*) FROM exercise_results WHERE student_id = ?),
        last_active_at = datetime('now')
      WHERE id = ?
    `).bind(studentId, studentId, studentId).run();

    // Mettre à jour le scoreboard
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

// POST /api/students/register - Enregistrer un étudiant
app.post('/api/students/register', async (c) => {
  try {
    const body = await c.req.json();
    const { student_code, display_name } = body;

    if (!student_code) {
      return c.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Code étudiant requis' } }, 400);
    }

    // Vérifier si l'étudiant existe déjà
    const existing = await c.env.DB.prepare(
      'SELECT id FROM students WHERE student_code = ?'
    ).bind(student_code).first();

    if (existing) {
      return c.json({ success: true, data: { id: existing.id, message: 'Étudiant existant' } });
    }

    // Créer le nouvel étudiant
    const studentId = `stu-${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO students (id, student_code, display_name)
      VALUES (?, ?, ?)
    `).bind(studentId, student_code, display_name || student_code).run();

    // Initialiser dans le scoreboard
    await c.env.DB.prepare(`
      INSERT INTO scoreboard (student_id, display_name, total_points)
      VALUES (?, ?, 0)
    `).bind(studentId, display_name || student_code).run();

    return c.json({ success: true, data: { id: studentId, message: 'Étudiant créé' } });
  } catch (error) {
    console.error('Error registering student:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// GET /api/students/:code/stats - Stats d'un étudiant
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
    console.error('Error fetching student stats:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES SCOREBOARD
// =============================================

// GET /api/scoreboard - Classement
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
    console.error('Error fetching scoreboard:', error);
    return c.json({ success: false, error: { code: 'DB_ERROR', message: 'Erreur base de données' } }, 500);
  }
});

// =============================================
// ROUTES LABS
// =============================================

// POST /api/labs/start - Démarrer un lab
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
      data: {
        session_id: sessionId,
        status: 'starting',
        expires_at: expiresAt,
      }
    });
  } catch (error) {
    console.error('Error starting lab:', error);
    return c.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Erreur serveur' } }, 500);
  }
});

// GET /api/labs/:sessionId
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

// DELETE /api/labs/:sessionId
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

async function updateScoreboard(db: D1Database, studentId: string) {
  try {
    // Calculer les points par team
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

    // Mettre à jour les rangs
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
