const jwt = require('jsonwebtoken');
const { pool } = require('../db');

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT u.*, s.plan, s.status, s.trial_ends_at, s.current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [decoded.userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Usuário não encontrado' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

async function checkSubscription(req, res, next) {
  const user = req.user;
  const now = new Date();

  if (user.status === 'trialing') {
    if (new Date(user.trial_ends_at) < now) {
      return res.status(403).json({
        error: 'Trial expirado',
        code: 'TRIAL_EXPIRED',
        redirect: '/planos'
      });
    }
    return next();
  }

  if (user.status === 'active') return next();

  if (user.status === 'past_due') {
    if (new Date(user.current_period_end) > now) return next();
    return res.status(403).json({
      error: 'Pagamento pendente',
      code: 'PAYMENT_FAILED',
      redirect: '/assinatura'
    });
  }

  if (user.status === 'suspended' || user.status === 'cancelled') {
    return res.status(403).json({
      error: 'Conta suspensa',
      code: 'ACCOUNT_SUSPENDED',
      redirect: '/planos'
    });
  }

  next();
}

function requirePlan(minPlan) {
  const hierarchy = { free: 0, pro: 1, premium: 2 };
  return (req, res, next) => {
    const userLevel = hierarchy[req.user.plan] ?? 0;
    const required = hierarchy[minPlan] ?? 0;
    if (userLevel < required) {
      return res.status(403).json({
        error: `Este recurso requer o plano ${minPlan}`,
        code: 'PLAN_REQUIRED',
        requiredPlan: minPlan
      });
    }
    next();
  };
}

module.exports = { authMiddleware, checkSubscription, requirePlan };
