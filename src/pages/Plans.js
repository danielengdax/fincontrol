import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    color: '#9090b0',
    features: ['20 lançamentos/mês', '3 categorias', 'Histórico de 1 mês'],
    missing: ['Relatórios', 'Exportar CSV', 'Orçamento por categoria'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 14,90',
    period: '/mês',
    color: '#6c63ff',
    priceId: 'price_1Tm2X59yzS6BceV6keTWFkis',
    highlight: true,
    features: ['Lançamentos ilimitados', 'Categorias ilimitadas', 'Histórico de 24 meses', 'Relatórios completos', 'Exportar CSV/PDF', 'Orçamento por categoria'],
    missing: ['Múltiplos usuários', 'Metas financeiras'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 29,90',
    period: '/mês',
    color: '#00d4ff',
    priceId: 'price_1Tm2Yl9yzS6BceV6wJZOg2IO',
    features: ['Tudo do Pro', 'Até 5 usuários', 'Metas financeiras', 'Suporte prioritário'],
    missing: [],
  },
];

export default function Plans() {
  const { user } = useAuth();
  const [loading, setLoading] = useState('');

  const handleCheckout = async (plan) => {
    if (!plan.priceId) return;
    setLoading(plan.id);
    try {
      const res = await api.post('/subscriptions/checkout', { plan: plan.id });
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao iniciar checkout.');
    } finally { setLoading(''); }
  };

  const handlePortal = async () => {
    try {
      const res = await api.post('/subscriptions/portal');
      window.location.href = res.data.url;
    } catch { alert('Erro ao abrir portal do cliente.'); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontFamily: 'Space Grotesk', marginBottom: 8 }}>Escolha seu plano</h1>
        <p style={{ color: 'var(--text-muted)' }}>Comece grátis. Faça upgrade quando precisar de mais.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 900, margin: '0 auto' }}>
        {plans.map(plan => {
          const isCurrent = user?.plan === plan.id;
          const isHighlight = plan.highlight;

          return (
            <div key={plan.id} style={{
              background: isHighlight ? 'linear-gradient(135deg, #6c63ff15, #00d4ff08)' : 'var(--bg-card)',
              border: `1px solid ${isHighlight ? '#6c63ff66' : 'var(--border)'}`,
              borderRadius: 16, padding: 28,
              position: 'relative',
              boxShadow: isHighlight ? '0 0 40px #6c63ff22' : 'var(--shadow-card)',
              transform: isHighlight ? 'scale(1.02)' : 'none',
            }}>
              {isHighlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '4px 14px', borderRadius: 20, letterSpacing: '0.05em',
                }}>MAIS POPULAR</div>
              )}

              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, color: plan.color, fontFamily: 'Space Grotesk' }}>{plan.name}</h2>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{plan.period}</span>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: plan.color, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
                {plan.missing.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>✕</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div>
                  <div style={{ textAlign: 'center', padding: '10px', background: `${plan.color}22`, borderRadius: 8, color: plan.color, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
                    ✦ Plano atual
                  </div>
                  {user?.plan !== 'free' && (
                    <button onClick={handlePortal} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${plan.color}44`, borderRadius: 8, color: plan.color, fontSize: 13, cursor: 'pointer' }}>
                      Gerenciar assinatura
                    </button>
                  )}
                </div>
              ) : plan.id === 'free' ? null : (
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loading === plan.id}
                  style={{
                    width: '100%', padding: '12px',
                    background: loading === plan.id ? 'var(--bg-hover)' : `linear-gradient(135deg, ${plan.color}, ${plan.id === 'pro' ? '#00d4ff' : '#6c63ff'})`,
                    border: 'none', borderRadius: 8, color: '#fff',
                    fontWeight: 600, fontSize: 14, cursor: loading === plan.id ? 'not-allowed' : 'pointer',
                    boxShadow: `0 0 20px ${plan.color}44`,
                  }}
                >
                  {loading === plan.id ? 'Aguarde...' : `Assinar ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-muted)', fontSize: 12 }}>
        Pagamento seguro via Stripe · Cancele a qualquer momento · Sem taxa de cancelamento
      </p>
    </div>
  );
}
