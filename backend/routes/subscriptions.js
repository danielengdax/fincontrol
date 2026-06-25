const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const PLAN_PRICES = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  premium: process.env.STRIPE_PRICE_ID_PREMIUM,
};

// GET /api/subscriptions/current
router.get('/current', async (req, res) => {
  const { rows: [sub] } = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1',
    [req.user.id]
  );
  const { rows: invoices } = await pool.query(
    'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
    [req.user.id]
  );
  res.json({ subscription: sub, invoices });
});

// POST /api/subscriptions/checkout — create Stripe checkout session
router.post('/checkout', async (req, res) => {
  const { plan } = req.body;
  if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Plano inválido' });

  const { rows: [sub] } = await pool.query(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
    [req.user.id]
  );

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.name,
      metadata: { userId: req.user.id },
    });
    customerId = customer.id;
    await pool.query(
      'UPDATE subscriptions SET stripe_customer_id = $1 WHERE user_id = $2',
      [customerId, req.user.id]
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
    success_url: `${process.env.APP_URL}/assinatura?success=1`,
    cancel_url: `${process.env.APP_URL}/planos?cancelled=1`,
    metadata: { userId: req.user.id, plan },
    subscription_data: {
      metadata: { userId: req.user.id, plan },
    },
  });

  res.json({ url: session.url });
});

// POST /api/subscriptions/portal — Stripe customer portal
router.post('/portal', async (req, res) => {
  const { rows: [sub] } = await pool.query(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
    [req.user.id]
  );
  if (!sub?.stripe_customer_id)
    return res.status(400).json({ error: 'Sem assinatura ativa' });

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.APP_URL}/assinatura`,
  });

  res.json({ url: session.url });
});

// POST /api/subscriptions/cancel
router.post('/cancel', async (req, res) => {
  const { reason } = req.body;
  const { rows: [sub] } = await pool.query(
    'SELECT * FROM subscriptions WHERE user_id = $1',
    [req.user.id]
  );

  if (!sub?.stripe_subscription_id)
    return res.status(400).json({ error: 'Sem assinatura ativa' });

  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
    metadata: { cancel_reason: reason || '' },
  });

  await pool.query(
    'UPDATE subscriptions SET cancelled_at = NOW() WHERE user_id = $1',
    [req.user.id]
  );

  res.json({ message: 'Assinatura será cancelada ao fim do período' });
});

module.exports = router;
