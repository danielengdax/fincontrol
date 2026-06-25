require('dotenv').config();
const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const users = [
      { name: 'Usuário Trial',     email: 'trial@fincontrol.app',     plan: 'free',    status: 'trialing', daysLeft: 7 },
      { name: 'Usuário Pro',       email: 'pro@fincontrol.app',       plan: 'pro',     status: 'active',   daysLeft: 0 },
      { name: 'Usuário Premium',   email: 'premium@fincontrol.app',   plan: 'premium', status: 'active',   daysLeft: 0 },
      { name: 'Usuário Suspenso',  email: 'suspenso@fincontrol.app',  plan: 'free',    status: 'suspended',daysLeft: 0 },
    ];

    const hash = await bcrypt.hash('demo123456', 12);

    for (const u of users) {
      const { rows: [user] } = await client.query(
        `INSERT INTO users (name, email, password_hash, email_verified)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [u.name, u.email, hash]
      );

      const trialEnd = u.status === 'trialing'
        ? `NOW() + INTERVAL '${u.daysLeft} days'`
        : 'NOW() - INTERVAL \'1 day\'';

      await client.query(
        `INSERT INTO subscriptions (user_id, plan, status, trial_ends_at, current_period_end)
         VALUES ($1, $2, $3, ${trialEnd}, NOW() + INTERVAL '30 days')
         ON CONFLICT (user_id) DO UPDATE
         SET plan = EXCLUDED.plan, status = EXCLUDED.status`,
        [user.id, u.plan, u.status]
      );

      // Default categories
      const cats = [
        { name: 'Alimentação', color: '#ff6b6b', icon: 'ti-fork' },
        { name: 'Transporte',  color: '#60a5fa', icon: 'ti-car' },
        { name: 'Moradia',     color: '#a78bfa', icon: 'ti-home' },
        { name: 'Saúde',       color: '#00e5a0', icon: 'ti-heart' },
        { name: 'Lazer',       color: '#fbbf24', icon: 'ti-device-gamepad' },
        { name: 'Educação',    color: '#f472b6', icon: 'ti-school' },
        { name: 'Salário',     color: '#00e5a0', icon: 'ti-cash' },
        { name: 'Outros',      color: '#888780', icon: 'ti-dots' },
      ];

      for (const cat of cats) {
        const { rows: [c] } = await client.query(
          `INSERT INTO categories (user_id, name, color, icon, is_default)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT DO NOTHING RETURNING id`,
          [user.id, cat.name, cat.color, cat.icon]
        );
        if (!c) continue;

        // Sample transactions
        const txs = [
          { desc: 'Salário', amount: 5800, type: 'in', days: 1, catName: 'Salário' },
          { desc: 'Aluguel', amount: 1500, type: 'out', days: 5, catName: 'Moradia' },
          { desc: 'Supermercado', amount: 380, type: 'out', days: 8, catName: 'Alimentação' },
          { desc: 'Uber', amount: 45, type: 'out', days: 10, catName: 'Transporte' },
        ];

        for (const tx of txs) {
          if (cat.name === tx.catName) {
            await client.query(
              `INSERT INTO transactions (user_id, category_id, description, amount, type, date)
               VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${tx.days} days')
               ON CONFLICT DO NOTHING`,
              [user.id, c.id, tx.desc, tx.amount, tx.type]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed concluído!');
    console.log('📧 Usuários de teste:');
    console.log('   trial@fincontrol.app    / demo123456 (Trial 7 dias)');
    console.log('   pro@fincontrol.app      / demo123456 (Plano Pro)');
    console.log('   premium@fincontrol.app  / demo123456 (Plano Premium)');
    console.log('   suspenso@fincontrol.app / demo123456 (Conta Suspensa)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
