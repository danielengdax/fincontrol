import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/transacoes', label: 'Transações', icon: '↕' },
  { path: '/orcamento', label: 'Orçamento', icon: '◎' },
  { path: '/planos', label: 'Planos', icon: '★' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const planColor = {
    free: '#9090b0',
    pro: '#6c63ff',
    premium: '#00d4ff',
  }[user?.plan] || '#9090b0';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, flexShrink: 0,
            boxShadow: '0 0 20px #6c63ff44',
          }}>F</div>
          {!collapsed && (
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, background: 'linear-gradient(135deg, #6c63ff, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FinControl
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', flexShrink: 0,
          }}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                  background: active ? '#6c63ff22' : 'transparent',
                  border: active ? '1px solid #6c63ff44' : '1px solid transparent',
                  color: active ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: 'var(--bg-card)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 10, color: planColor, fontWeight: 600, textTransform: 'uppercase' }}>
                  {user?.plan || 'Free'}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', marginTop: 6, padding: '8px 12px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)', fontSize: 12,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.target.style.color = '#ff6b6b'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            {collapsed ? '⏻' : 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {children}
      </main>
    </div>
  );
}
