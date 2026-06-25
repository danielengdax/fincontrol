const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, checkSubscription, requirePlan } = require('../middleware/auth');

router.use(authMiddleware, checkSubscription);

// GET /api/transactions
router.get('/', async (req, res) => {
  const { month, year, type, category_id, search } = req.query;
  let query = `
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = $1
  `;
  const params = [req.user.id];
  let i = 2;

  if (month && year) {
    query += ` AND EXTRACT(MONTH FROM t.date) = $${i++} AND EXTRACT(YEAR FROM t.date) = $${i++}`;
    params.push(month, year);
  }
  if (type) { query += ` AND t.type = $${i++}`; params.push(type); }
  if (category_id) { query += ` AND t.category_id = $${i++}`; params.push(category_id); }
  if (search) { query += ` AND t.description ILIKE $${i++}`; params.push(`%${search}%`); }

  query += ' ORDER BY t.date DESC, t.created_at DESC';

  // Free plan: limit to 20 per month
  if (req.user.plan === 'free') {
    const now = new Date();
    const { rows: [count] } = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1
       AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
      [req.user.id, now.getMonth() + 1, now.getFullYear()]
    );
    res.setHeader('X-Monthly-Count', count.count);
    res.setHeader('X-Monthly-Limit', '20');
  }

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// POST /api/transactions
router.post('/', async (req, res) => {
  // Free plan: max 20 per month
  if (req.user.plan === 'free') {
    const now = new Date();
    const { rows: [count] } = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1
       AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
      [req.user.id, now.getMonth() + 1, now.getFullYear()]
    );
    if (parseInt(count.count) >= 20) {
      return res.status(403).json({
        error: 'Limite de 20 lançamentos atingido no plano grátis',
        code: 'LIMIT_REACHED',
        requiredPlan: 'pro'
      });
    }
  }

  const { description, amount, type, date, category_id, notes } = req.body;
  if (!description || !amount || !type || !date)
    return res.status(400).json({ error: 'Campos obrigatórios: descrição, valor, tipo, data' });

  const { rows: [tx] } = await pool.query(
    `INSERT INTO transactions (user_id, description, amount, type, date, category_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *, (SELECT name FROM categories WHERE id = $6) as category_name`,
    [req.user.id, description, amount, type, date, category_id || null, notes || null]
  );
  res.status(201).json(tx);
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  const { description, amount, type, date, category_id, notes } = req.body;
  const { rows: [tx] } = await pool.query(
    `UPDATE transactions SET description=$1, amount=$2, type=$3, date=$4, category_id=$5, notes=$6, updated_at=NOW()
     WHERE id=$7 AND user_id=$8 RETURNING *`,
    [description, amount, type, date, category_id || null, notes || null, req.params.id, req.user.id]
  );
  if (!tx) return res.status(404).json({ error: 'Lançamento não encontrado' });
  res.json(tx);
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Lançamento não encontrado' });
  res.json({ message: 'Excluído com sucesso' });
});

// GET /api/transactions/summary — dashboard data
router.get('/summary', async (req, res) => {
  const { month, year } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();

  const { rows: [summary] } = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type='in' THEN amount ELSE 0 END), 0) as total_in,
       COALESCE(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0) as total_out,
       COUNT(*) as total_count
     FROM transactions
     WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
    [req.user.id, m, y]
  );

  const { rows: byCategory } = await pool.query(
    `SELECT c.id, c.name, c.color, c.icon,
       COALESCE(SUM(t.amount), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'out'
       AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
       AND t.user_id = $1
     WHERE c.user_id = $1
     GROUP BY c.id ORDER BY total DESC`,
    [req.user.id, m, y]
  );

  // Monthly history (last 6 months) — Pro/Premium only
  let monthly = [];
  if (req.user.plan !== 'free') {
    const { rows } = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM date) as month, EXTRACT(YEAR FROM date) as year,
         SUM(CASE WHEN type='in' THEN amount ELSE 0 END) as total_in,
         SUM(CASE WHEN type='out' THEN amount ELSE 0 END) as total_out
       FROM transactions WHERE user_id = $1
         AND date >= NOW() - INTERVAL '6 months'
       GROUP BY month, year ORDER BY year, month`,
      [req.user.id]
    );
    monthly = rows;
  }

  res.json({ summary, byCategory, monthly });
});

// GET /api/transactions/export — Pro/Premium
router.get('/export', requirePlan('pro'), async (req, res) => {
  const { month, year, format } = req.query;
  const { rows } = await pool.query(
    `SELECT t.date, t.description, t.amount, t.type, c.name as category, t.notes
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
       AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
     ORDER BY t.date`,
    [req.user.id, month, year]
  );

  if (format === 'csv') {
    const csv = ['Data,Descrição,Valor,Tipo,Categoria,Notas',
      ...rows.map(r => `${r.date},${r.description},${r.amount},${r.type === 'in' ? 'Receita' : 'Despesa'},${r.category || ''},${r.notes || ''}`)
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=extrato-${year}-${month}.csv`);
    return res.send(csv);
  }

  res.json(rows);
});

module.exports = router;
