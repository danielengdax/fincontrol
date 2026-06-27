import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Budget() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  useEffect(() => {
    if (user?.plan === 'free') { setLoading(false); return; }
    api.get('/budgets').then(res => setBudgets(res.data.budgets || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (user?.plan === 'free') {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <h1 style={{ fontSize: 24, fontFamily: 'Space Grotesk', marginBottom: 8 }}>Orçamento</h1>
        <div style={{
          marginTop: 40, textAlign: 'center', padding: '60px 40px',
          background: 'var(--bg-card)', border: '1px solid #6c63ff44',
          borderRadius: 16, maxWidth: 480, margin: '60px auto',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: 8 }}>Recurso Pro</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
            O controle de orçamento está disponível nos planos Pro e Premium.
            Defina limites por categoria e acompanhe seus gastos.
          </p>
          <Link to="/planos" style={{
            display: 'inline-block', background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
            color: '#fff', padding: '12px 28px', borderRadius: 8,
            fontWeight: 600, textDecoration: 'none', boxShadow: '0 0 20px #6c63ff44',
          }}>
            Fazer upgrade agora
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontFamily: 'Space Grotesk' }}>Orçamento</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Controle seus limites de gastos por categoria</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Carregando...</div>
      ) : budgets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
          <p>Nenhum orçamento configurado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {budgets.map((b, i) => {
            const pct = Math.min(100, ((b.spent || 0) / b.limit_amount) * 100);
            const color = pct > 90 ? '#ff6b9d' : pct > 70 ? '#ff9f43' : '#00ff88';
            return (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600 }}>{b.category_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmt(b.spent || 0)} / {fmt(b.limit_amount)}</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s ease', boxShadow: `0 0 10px ${color}88` }} />
                </div>
                <p style={{ color: pct > 90 ? '#ff6b9d' : 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>
                  {pct.toFixed(0)}% utilizado
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
