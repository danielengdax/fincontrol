import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MONTH_ABBR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

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

function MonthSelector({ month, year, onPrev, onNext }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 16px', marginBottom: 24, width: 'fit-content',
    }}>
      <button
        onClick={onPrev}
        aria-label="Mês anterior"
        style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
          color: '#fff', width: 32, height: 32, cursor: 'pointer', fontSize: 16,
        }}
      >‹</button>
      <span style={{ fontWeight: 700, fontSize: 14, minWidth: 140, textAlign: 'center' }}>
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        onClick={onNext}
        aria-label="Próximo mês"
        style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
          color: '#fff', width: 32, height: 32, cursor: 'pointer', fontSize: 16,
        }}
      >›</button>
    </div>
  );
}

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const FALLBACK_COLORS = ['#ff6b9d', '#6c63ff', '#00d4ff', '#fbbf24', '#00ff88', '#f472b6', '#a78bfa', '#ff6b6b'];

function buildCategoryTotals(byCategory) {
  return (byCategory || [])
    .map((c) => ({ name: c.name, value: parseFloat(c.total || 0), color: c.color }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((item, i) => ({ ...item, color: item.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
    }}>
      <strong>{item.name}</strong>
      <div style={{ color: '#ff6b9d', marginTop: 2 }}>{fmt(item.value)}</div>
    </div>
  );
}

function ExpensesByCategoryChart({ data }) {
  if (!data.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
        <p>Sem despesas registradas nesse mês.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 8 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          tickFormatter={(v) => fmt(v).replace(/ /, ' ')}
          width={90}
        />
        <Tooltip content={<CategoryTooltip />} cursor={{ fill: '#ffffff0d' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={fmt}
            style={{ fill: '#ffffff', fontWeight: 700, fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
    }}>
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, marginTop: 2 }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
}

function MonthlyComparisonChart({ data }) {
  if (!data.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📈</p>
        <p>Sem histórico suficiente ainda.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <XAxis dataKey="label" tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700 }} />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          tickFormatter={(v) => fmt(v).replace(/ /, ' ')}
          width={90}
        />
        <Tooltip content={<MonthlyTooltip />} cursor={{ fill: '#ffffff0d' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="total_in" name="Receitas" fill="#00ff88" radius={[6, 6, 0, 0]} />
        <Bar dataKey="total_out" name="Despesas" fill="#ff6b9d" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/transactions/summary', { params: { month, year } }).catch(() => ({ data: {} })),
      api.get('/transactions', { params: { month, year } }).catch(() => ({ data: [] })),
    ]).then(([sumRes, txRes]) => {
      setSummary(sumRes.data?.summary || {});
      setByCategory(sumRes.data?.byCategory || []);
      const monthlyRaw = sumRes.data?.monthly || [];
      setMonthly(monthlyRaw.map((m) => ({
        label: `${MONTH_ABBR[parseInt(m.month) - 1]}/${String(m.year).slice(2)}`,
        total_in: parseFloat(m.total_in || 0),
        total_out: parseFloat(m.total_out || 0),
      })));
      const txList = txRes.data?.transactions || txRes.data || [];
      const list = Array.isArray(txList) ? txList : [];
      setTransactions(list.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [month, year]);

  const goPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const income = parseFloat(summary?.total_in || 0);
  const expenses = parseFloat(summary?.total_out || 0);
  const balance = income - expenses;
  const count = parseInt(summary?.total_count || 0);
  const categoryTotals = buildCategoryTotals(byCategory);
  const monthLabel = `${MONTH_NAMES[month - 1]}`;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontFamily: 'Space Grotesk' }}>
          Olá, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          Aqui está o resumo das suas finanças
        </p>
      </div>

      {user?.plan === 'free' && (
        <div style={{
          background: 'linear-gradient(135deg, #6c63ff22, #00d4ff11)',
          border: '1px solid #6c63ff44', borderRadius: 12,
          padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ color: '#6c63ff', fontWeight: 600 }}>✦ Trial Gratuito</span>
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

      <MonthSelector month={month} year={year} onPrev={goPrevMonth} onNext={goNextMonth} />

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Carregando...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard label="Receitas" value={fmt(income)} icon="↑" color="#00ff88" sub={monthLabel} />
            <StatCard label="Despesas" value={fmt(expenses)} icon="↓" color="#ff6b9d" sub={monthLabel} />
            <StatCard label="Saldo" value={fmt(balance)} icon="◈" color="#6c63ff" sub={monthLabel} />
            <StatCard label="Transações" value={count} icon="≡" color="#00d4ff" sub={monthLabel} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16 }}>Maiores Gastos por Categoria <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>({monthLabel.toLowerCase()})</span></h2>
            </div>
            <ExpensesByCategoryChart data={categoryTotals} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16 }}>Comparação de Meses <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(últimos 6 meses)</span></h2>
            </div>
            {user?.plan === 'free' ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🔒</p>
                <p>Comparação entre meses é exclusiva dos planos Pro e Premium.</p>
                <Link to="/planos" style={{ color: '#6c63ff', fontSize: 13 }}>Ver planos →</Link>
              </div>
            ) : (
              <MonthlyComparisonChart data={monthly} />
            )}
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16 }}>Transações do Mês</h2>
              <Link to="/transacoes" style={{ color: '#6c63ff', fontSize: 13 }}>Ver todas →</Link>
            </div>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
                <p>Nenhuma transação nesse mês.</p>
                <Link to="/transacoes" style={{ color: '#6c63ff', fontSize: 13 }}>Adicionar transação →</Link>
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
                      background: tx.type === 'in' ? '#00ff8822' : '#ff6b9d22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {tx.type === 'in' ? '↑' : '↓'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 13 }}>{tx.description}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tx.category_name || 'Sem categoria'}</p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color: tx.type === 'in' ? '#00ff88' : '#ff6b9d' }}>
                    {tx.type === 'in' ? '+' : '-'}{fmt(tx.amount)}
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
