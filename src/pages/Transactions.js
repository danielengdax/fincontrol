import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const load = () => {
    Promise.all([
      api.get('/transactions'),
      api.get('/categories').catch(() => ({ data: { categories: [] } })),
    ]).then(([txRes, catRes]) => {
      setTransactions(txRes.data.transactions || txRes.data || []);
      setCategories(catRes.data.categories || catRes.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const dbType = form.type === 'income' ? 'in' : 'out';
      await api.post('/transactions', { ...form, amount: parseFloat(form.amount), type: dbType });
      setShowForm(false);
      setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar transação.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta transação?')) return;
    await api.delete(`/transactions/${id}`).catch(() => {});
    load();
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Space Grotesk' }}>Transações</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>Gerencie suas entradas e saídas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
          border: 'none', borderRadius: 8, padding: '10px 18px',
          color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          boxShadow: '0 0 20px #6c63ff44',
        }}>
          + Nova Transação
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Nova Transação</h3>
          {error && <div style={{ background: '#ff6b6b11', border: '1px solid #ff6b6b44', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ff6b6b', fontSize: 13 }}>{error}</div>}
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Descrição</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Ex: Aluguel" style={inp} />
              </div>
              <div>
                <label style={lbl}>Valor (R$)</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="0,00" style={inp} />
              </div>
              <div>
                <label style={lbl}>Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Categoria</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={inp}>
                  <option value="">Sem categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Data</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{ background: 'linear-gradient(135deg, #6c63ff, #00d4ff)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Carregando...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>💳</p>
            <p>Nenhuma transação. Adicione a primeira!</p>
          </div>
        ) : (
          transactions.map((tx, i) => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: tx.type === 'in' ? '#00ff8822' : '#ff6b9d22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {tx.type === 'in' ? '↑' : '↓'}
                </div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>{tx.description}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                    {tx.category_name || 'Sem categoria'} · {new Date(tx.date || tx.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: tx.type === 'in' ? '#00ff88' : '#ff6b9d' }}>
                  {tx.type === 'in' ? '+' : '-'}{fmt(tx.amount)}
                </span>
                <button onClick={() => handleDelete(tx.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 }}
                  onMouseEnter={e => e.target.style.color = '#ff6b6b'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 };
const inp = { width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' };
