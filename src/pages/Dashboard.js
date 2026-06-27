import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
      borderTop: `2px solid ${color}`,
      boxShadow: `0 4px 24px #00000044`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color, marginTop: 6, fontFamily: 'Space Grotesk' }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
        </div>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/transactions/summary').catch(() => ({ data: {} })),
      api.get('/transactions?limit=5').catch(() => ({ data: { transactions: [] } })),
    ]).then(([sumRes, txRes]) => {
      setSummary(sumRes.data);
      setTransactions(txRes.data.transactions || []);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontFamily: 'Space Grotesk' }}>
          Olá, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          Aqui está o resumo das suas finanças
        </p>
      </div>

      {/* Trial banner */}
      {user?.plan === 'free' && (
        <div style={{
          background: 'linear-gradient(135deg, #6c63ff22, #00d4ff11)',
          border: '1px solid #6c63ff44', borderRadius: 12,
          padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>✦ Trial Gratuito</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: 13 }}>
              Você está no plano gratuito. Faça upgrade para desbloquear tudo.
            </span>
          </div>
          <Link to="/planos" style={{
            background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
            color: '#fff', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>Ver planos</Link>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Carregando...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard label="Receitas" value={fmt(summary?.income)} icon="↑" color="#00ff88" sub="Este mês" />
            <StatCard label="Despesas" value={fmt(summary?.expenses)} icon="↓" color="#ff6b9d" sub="Este mês" />
            <StatCard label="Saldo" value={fmt((summary?.income || 0) - (summary?.expenses || 0))} icon="◈" color="#6c63ff" sub="Balanço atual" />
            <StatCard label="Transações" value={summary?.count || 0} icon="≡" color="#00d4ff" sub="Este mês" />
          </div>

          {/* Recent transactions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16 }}>Transações Recentes</h2>
              <Link to="/transacoes" style={{ color: 'var(--accent-purple)', fontSize: 13 }}>Ver todas →</Link>
            </div>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
                <p>Nenhuma transação ainda.</p>
                <Link to="/transacoes" style={{ color: 'var(--accent-purple)', fontSize: 13 }}>Adicionar primeira transação →</Link>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <div key={tx.id || i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: tx.type === 'income' ? '#00ff8822' : '#ff6b9d22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {tx.type === 'income' ? '↑' : '↓'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 13 }}>{tx.description}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tx.category_name || 'Sem categoria'}</p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color: tx.type === 'income' ? '#00ff88' : '#ff6b9d' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
