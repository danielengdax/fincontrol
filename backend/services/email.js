const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = { email: 'noreply@fincontrol.app', name: 'FinControl' };

async function send(to, subject, html) {
  try {
    await sgMail.send({ to, from: FROM, subject, html });
  } catch (err) {
    console.error('Email send error:', err.response?.body || err.message);
  }
}

async function sendWelcomeEmail(email, name, verifyToken) {
  const url = `${process.env.APP_URL}/verificar-email?token=${verifyToken}`;
  await send(email, 'Bem-vindo ao FinControl! 🎉', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#00e5a0">Olá, ${name}! 👋</h2>
      <p>Sua conta foi criada com sucesso. Você tem <strong>14 dias de trial grátis</strong>.</p>
      <a href="${url}" style="display:inline-block;background:#00e5a0;color:#0d0d14;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Verificar e-mail
      </a>
      <p style="color:#666;font-size:13px">Se não se cadastrou, ignore este e-mail.</p>
    </div>
  `);
}

async function sendPasswordResetEmail(email, name, token) {
  const url = `${process.env.APP_URL}/redefinir-senha?token=${token}`;
  await send(email, 'Redefinir sua senha — FinControl', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Redefinir senha</h2>
      <p>Olá ${name}, clique no botão abaixo para redefinir sua senha. O link expira em 1 hora.</p>
      <a href="${url}" style="display:inline-block;background:#00e5a0;color:#0d0d14;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Redefinir senha
      </a>
    </div>
  `);
}

async function sendPaymentSuccessEmail(email, name, plan, periodEnd) {
  const date = new Date(periodEnd * 1000).toLocaleDateString('pt-BR');
  await send(email, '✅ Pagamento confirmado — FinControl', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#00e5a0">Pagamento confirmado!</h2>
      <p>Olá ${name}, seu pagamento foi aprovado.</p>
      <p><strong>Plano:</strong> ${plan === 'pro' ? 'Pro — R$ 14,90/mês' : 'Premium — R$ 29,90/mês'}</p>
      <p><strong>Próxima cobrança:</strong> ${date}</p>
      <a href="${process.env.APP_URL}/dashboard" style="display:inline-block;background:#00e5a0;color:#0d0d14;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Acessar FinControl
      </a>
    </div>
  `);
}

async function sendPaymentFailedEmail(email, name) {
  await send(email, '⚠️ Problema com seu pagamento — FinControl', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#ff6b6b">Pagamento não processado</h2>
      <p>Olá ${name}, não conseguimos processar seu pagamento.</p>
      <p>Você tem <strong>3 dias</strong> para atualizar seu método de pagamento antes de ter o acesso suspenso.</p>
      <a href="${process.env.APP_URL}/assinatura" style="display:inline-block;background:#ff6b6b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Atualizar cartão
      </a>
    </div>
  `);
}

async function sendAccountSuspendedEmail(email, name) {
  await send(email, '🔴 Conta suspensa — FinControl', `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#ff6b6b">Conta suspensa</h2>
      <p>Olá ${name}, sua conta foi suspensa por falta de pagamento.</p>
      <p>Seus dados estão preservados por 90 dias. Reative sua assinatura para recuperar o acesso.</p>
      <a href="${process.env.APP_URL}/planos" style="display:inline-block;background:#00e5a0;color:#0d0d14;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Reativar assinatura
      </a>
    </div>
  `);
}

async function sendTrialEndingEmail(email, name, daysLeft) {
  await send(email, `⏰ Seu trial expira em ${daysLeft} dias — FinControl`, `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#fbbf24">Trial expirando em breve</h2>
      <p>Olá ${name}, seu trial gratuito expira em <strong>${daysLeft} dias</strong>.</p>
      <p>Assine agora para continuar gerenciando suas finanças sem interrupção.</p>
      <a href="${process.env.APP_URL}/planos" style="display:inline-block;background:#00e5a0;color:#0d0d14;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Ver planos — a partir de R$ 14,90/mês
      </a>
    </div>
  `);
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendAccountSuspendedEmail,
  sendTrialEndingEmail,
};
