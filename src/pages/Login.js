import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 20,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, #6c63ff11 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 0 60px #6c63ff11',
        animation: 'fadeIn 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, margin: '0 auto 12px',
            boxShadow: '0 0 30px #6c63ff55',
          }}>F</div>
          <h1 style={{ fontSize: 22, fontFamily: 'Space Grotesk', background: 'linear-gradient(135deg, #6c63ff, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FinControl
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Bem-vindo de volta
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ff6b6b11', border: '1px solid #ff6b6b44',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            color: '#ff6b6b', fontSize: 13,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              E-mail
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Senha
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
          Não tem conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 14,
  outline: 'none', transition: 'border-color 0.15s',
};

const btnStyle = (loading) => ({
  width: '100%', padding: '12px',
  background: loading ? 'var(--bg-hover)' : 'linear-gradient(135deg, #6c63ff, #00d4ff)',
  border: 'none', borderRadius: 8,
  color: '#fff', fontSize: 14, fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'opacity 0.15s',
  boxShadow: loading ? 'none' : '0 0 20px #6c63ff44',
});
