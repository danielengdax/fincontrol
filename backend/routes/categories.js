const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, checkSubscription, requirePlan } = require('../middleware/auth');

router.use(authMiddleware, checkSubscription);

// GET /api/categories
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY is_default DESC, name ASC',
    [req.user.id]
  );
  res.json(rows);
});

// POST /api/categories — Pro/Premium only for custom categories
router.post('/', async (req, res) => {
  // Free plan: max 3 categories (defaults already created)
  if (req.user.plan === 'free') {
    const { rows: [count] } = await pool.query(
      'SELECT COUNT(*) FROM categories WHERE user_id = $1',
      [req.user.id]
    );
    if (parseInt(count.count) >= 3) {
      return res.status(403).json({
        error: 'Limite de 3 categorias no plano grátis',
        code: 'LIMIT_REACHED',
        requiredPlan: 'pro'
      });
    }
  }

  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const { rows: [cat] } = await pool.query(
    'INSERT INTO categories (user_id, name, color, icon) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.user.id, name, color || '#888780', icon || 'ti-dots']
  );
  res.status(201).json(cat);
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = false',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Categoria não encontrada ou é padrão' });
  res.json({ message: 'Excluída com sucesso' });
});

module.exports = router;
