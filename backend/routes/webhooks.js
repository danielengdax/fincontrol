const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../db');
const { sendPaymentSuccessEmail, sendPaymentFailedEmail, sendAccountSuspendedEmail } = require('../services/email');

// POST /webhooks/stripe
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const data = event.data.object;

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const { userId, plan } = data.metadata;
        const stripeSubId = data.subscription;
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

        await pool.query(
          `UPDATE subscriptions SET
             plan = $1, status = 'active',
             stripe_subscription_id = $2,
             stripe_customer_id = $3,
             current_period_start = to_timestamp($4),
             current_period_end = to_timestamp($5),
             updated_at = NOW()
           WHERE user_id = $6`,
          [
            plan,
            stripeSubId,
            data.customer,
            stripeSub.current_period_start,
            stripeSub.current_period_end,
            userId
          ]
        );

        const { rows: [user] } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        await sendPaymentSuccessEmail(user.email, user.name, plan, stripeSub.current_period_end);
        break;
      }

      case 'invoice.payment_succeeded': {
        const subId = data.subscription;
        if (!subId) break;

        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const { userId, plan } = stripeSub.metadata;

        await pool.query(
          `UPDATE subscriptions SET
             status = 'active',
             current_period_start = to_timestamp($1),
             current_period_end = to_timestamp($2),
             updated_at = NOW()
           WHERE stripe_subscription_id = $3`,
          [stripeSub.current_period_start, stripeSub.current_period_end, subId]
        );

        // Save invoice
        await pool.query(
          `INSERT INTO invoices (user_id, stripe_invoice_id, amount, status, period_start, period_end, pdf_url)
           VALUES ($1, $2, $3, 'paid', to_timestamp($4), to_timestamp($5), $6)
           ON CONFLICT (stripe_invoice_id) DO UPDATE SET status = 'paid'`,
          [userId, data.id, data.amount_paid / 100, data.period_start, data.period_end, data.invoice_pdf]
        );
        break;
      }

      case 'invoice.payment_failed': {
        const subId = data.subscription;
        if (!subId) break;

        await pool.query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [subId]
        );

        const { rows: [sub] } = await pool.query(
          'SELECT s.*, u.email, u.name FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE s.stripe_subscription_id = $1',
          [subId]
        );
        if (sub) await sendPaymentFailedEmail(sub.email, sub.name);
        break;
      }

      case 'customer.subscription.deleted': {
        const subId = data.id;
        const { rows: [sub] } = await pool.query(
          'SELECT s.*, u.email, u.name FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE s.stripe_subscription_id = $1',
          [subId]
        );

        await pool.query(
          `UPDATE subscriptions SET status = 'suspended', plan = 'free', updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [subId]
        );

        if (sub) await sendAccountSuspendedEmail(sub.email, sub.name);
        break;
      }

      case 'customer.subscription.updated': {
        const subId = data.id;
        const newPlan = data.metadata?.plan;
        if (!newPlan) break;

        await pool.query(
          `UPDATE subscriptions SET
             plan = $1,
             current_period_start = to_timestamp($2),
             current_period_end = to_timestamp($3),
             updated_at = NOW()
           WHERE stripe_subscription_id = $4`,
          [newPlan, data.current_period_start, data.current_period_end, subId]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
