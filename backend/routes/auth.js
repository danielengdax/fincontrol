const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email');

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', color: '#ff6b6b', icon: 'ti-fork' },
  { name: 'Transporte',  color: '#60a5fa', icon: 'ti-car' },
  { name: 'Moradia',     color: '#a78bfa', icon: 'ti-home' },
  { name: 'Saúde',       color: '#00e5a0', icon: 'ti-heart' },
  { name: 'Lazer',       color: '#fbbf24', icon: 'ti-device-gamepad' },
  { name: 'Educação',    color: '#f472b6', icon: 'ti-school' },
  { name: 'Salário',     color: '#00e5a0', icon: 'ti-cash' },
  { name: 'Outros',      color: '#888780', icon: 'ti-dots' },
];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Preencha todos os campos' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows[0]) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const { rows: [user] } = await client.query(
      `INSERT INTO users (name, email, password_hash, email_verify_token)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email`,
      [name, email.toLowerCase(), hash, verifyToken]
    );

    // Create trial subscription
    await client.query(
      `INSERT INTO subscriptions (user_id, plan, status, trial_ends_at)
       VALUES ($1, 'free', 'trialing', NOW() + INTERVAL '14 days')`,
      [user.id]
    );

    // Seed default categories
    for (const cat of DEFAULT_CATEGORIES) {
      await client.query(
        `INSERT INTO categories (user_id, name, color, icon, is_default)
         VALUES ($1, $2, $3, $4, true)`,
        [user.id, cat.name, cat.color, cat.icon]
      );
    }

    await client.query('COMMIT');

    await sendWelcomeEmail(user.email, user.name, verifyToken);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

  const { rows: [user] } = await pool.query(
    `SELECT u.*, s.plan, s.status, s.trial_ends_at, s.current_period_end
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email,
      plan: user.plan, status: user.status,
      trialEndsAt: user.trial_ends_at,
      periodEnd: user.current_period_end,
    }
  });
});

// GET /api/auth/me
const { authMiddleware } = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  const u = req.user;
  res.json({
    id: u.id, name: u.name, email: u.email,
    plan: u.plan, status: u.status,
    trialEndsAt: u.trial_ends_at,
    periodEnd: u.current_period_end,
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { rows: [user] } = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email?.toLowerCase()]);
  if (!user) return res.json({ message: 'Se o e-mail existir, você receberá as instruções.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [token, expires, user.id]
  );

  await sendPasswordResetEmail(user.email, user.name, token);
  res.json({ message: 'Se o e-mail existir, você receberá as instruções.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8)
    return res.status(400).json({ error: 'Dados inválidos' });

  const { rows: [user] } = await pool.query(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );
  if (!user) return res.status(400).json({ error: 'Token inválido ou expirado' });

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [hash, user.id]
  );

  res.json({ message: 'Senha alterada com sucesso' });
});

module.exports = router;
