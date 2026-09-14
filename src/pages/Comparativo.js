import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, LabelList,
} from 'recharts';

const COLOR_RECEITAS = '#00ff88';
const COLOR_DESPESAS = '#ff3b3b';
const COLOR_RECEITAS_NEON = '#39ff14';
const COLOR_DESPESAS_NEON = '#ff073a';
const LABEL_STYLE = { fill: '#ffffff', fontWeight: 700, fontSize: 11 };
const NEON_GLOW = (color) => ({ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 2px ${color})` });

const MONTH_ABBR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function ComparativoTooltip({ active, payload, label }) {
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

function ViewToggle({ view, onChange }) {
  const options = [
    { key: 'bar', label: '▤ Barras' },
    { key: 'line', label: '⟋ Linhas' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            background: view === opt.key ? 'linear-gradient(135deg, #6c63ff, #00d4ff)' : 'transparent',
            border: view === opt.key ? 'none' : '1px solid var(--border)',
            color: view === opt.key ? '#fff' : 'var(--text-secondary)',
            fontWeight: view === opt.key ? 600 : 400,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Comparativo() {
  const { user } = useAuth();
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('bar');

  useEffect(() => {
    api.get('/transactions/summary')
      .then((res) => {
        const raw = res.data?.monthly || [];
        setMonthly(raw.map((m) => ({
          label: `${MONTH_ABBR[parseInt(m.month) - 1]}/${String(m.year).slice(2)}`,
          Receitas: parseFloat(m.total_in || 0),
          Despesas: parseFloat(m.total_out || 0),
        })));
      })
      .catch(() => setMonthly([]))
      .finally(() => setLoading(false));
  }, []);

  const isFree = user?.plan === 'free';

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontFamily: 'Space Grotesk' }}>Comparativo de Meses</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          Receitas x Despesas ao longo dos últimos 6 meses
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 16 }}>Últimos 6 meses</h2>
          {!isFree && <ViewToggle view={view} onChange={setView} />}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Carregando...</div>
        ) : isFree ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔒</p>
            <p>Comparativo entre meses é exclusivo dos planos Pro e Premium.</p>
            <Link to="/planos" style={{ color: '#6c63ff', fontSize: 13 }}>Ver planos →</Link>
          </div>
        ) : !monthly.length ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📈</p>
            <p>Sem histórico suficiente ainda.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            {view === 'bar' ? (
              <BarChart data={monthly} margin={{ top: 28, right: 16, left: 0, bottom: 8 }}>
                <XAxis dataKey="label" tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700 }} />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(v) => fmt(v).replace(/ /, ' ')}
                  width={90}
                />
                <Tooltip content={<ComparativoTooltip />} cursor={{ fill: '#ffffff0d' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill={COLOR_RECEITAS} radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="Receitas" position="top" formatter={fmt} style={LABEL_STYLE} />
                </Bar>
                <Bar dataKey="Despesas" fill={COLOR_DESPESAS} radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="Despesas" position="top" formatter={fmt} style={LABEL_STYLE} />
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={monthly} margin={{ top: 28, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700 }} />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(v) => fmt(v).replace(/ /, ' ')}
                  width={90}
                />
                <Tooltip content={<ComparativoTooltip />} cursor={{ stroke: 'var(--border)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone" dataKey="Receitas"
                  stroke={COLOR_RECEITAS_NEON} strokeWidth={3}
                  dot={{ r: 5, fill: COLOR_RECEITAS_NEON, stroke: '#0d0d14', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  style={NEON_GLOW(COLOR_RECEITAS_NEON)}
                >
                  <LabelList dataKey="Receitas" position="top" formatter={fmt} style={LABEL_STYLE} />
                </Line>
                <Line
                  type="monotone" dataKey="Despesas"
                  stroke={COLOR_DESPESAS_NEON} strokeWidth={3}
                  dot={{ r: 5, fill: COLOR_DESPESAS_NEON, stroke: '#0d0d14', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  style={NEON_GLOW(COLOR_DESPESAS_NEON)}
                >
                  <LabelList dataKey="Despesas" position="top" formatter={fmt} style={LABEL_STYLE} />
                </Line>
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
