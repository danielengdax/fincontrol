import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="lp">
      {/* NAV */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <div className="lp-logo-icon">F</div>
            <span>FinControl</span>
          </div>
          <div className="lp-nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#planos">Planos</a>
          </div>
          <div className="lp-nav-cta">
            <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Entrar</button>
            <button className="lp-btn-primary" onClick={() => navigate('/cadastro')}>Começar grátis</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-glow glow-1" />
        <div className="lp-hero-glow glow-2" />
        <div className="lp-hero-grid" />
        <div className="lp-hero-content">
          <div className="lp-badge">✦ Controle financeiro inteligente</div>
          <h1 className="lp-hero-title">
            Suas finanças,<br />
            <span className="lp-gradient">sob controle</span>
          </h1>
          <p className="lp-hero-sub">
            Acompanhe receitas, despesas e orçamentos em tempo real.<br />
            Decisões melhores com dados claros e visuais poderosos.
          </p>
          <div className="lp-hero-btns">
            <button className="lp-btn-hero" onClick={() => navigate('/cadastro')}>
              Criar conta gratuita →
            </button>
            <button className="lp-btn-hero-outline" onClick={() => navigate('/login')}>
              Já tenho conta
            </button>
          </div>
          <div className="lp-hero-stats">
            <div className="lp-stat"><span className="lp-stat-n">100%</span><span className="lp-stat-l">Seguro</span></div>
            <div className="lp-stat-sep" />
            <div className="lp-stat"><span className="lp-stat-n">R$ 0</span><span className="lp-stat-l">Para começar</span></div>
            <div className="lp-stat-sep" />
            <div className="lp-stat"><span className="lp-stat-n">∞</span><span className="lp-stat-l">Transações</span></div>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="lp-mockup">
          <div className="lp-mock-card">
            <div className="lp-mock-bar">
              <span className="lp-dot r" /><span className="lp-dot y" /><span className="lp-dot g" />
              <span className="lp-mock-title">Dashboard — Junho 2026</span>
            </div>
            <div className="lp-mock-body">
              <div className="lp-mock-kpis">
                <div className="lp-kpi green"><span>Receitas</span><strong>R$ 8.450</strong><em>↑ 12%</em></div>
                <div className="lp-kpi red"><span>Despesas</span><strong>R$ 4.210</strong><em>↓ 5%</em></div>
                <div className="lp-kpi blue"><span>Saldo</span><strong>R$ 4.240</strong><em>↑ 32%</em></div>
              </div>
              <div className="lp-mock-chart">
                {[55,70,45,80,60,90,75].map((h,i) => (
                  <div key={i} className="lp-bar-wrap">
                    <div className="lp-bar" style={{height:`${h}%`}} />
                  </div>
                ))}
              </div>
              <div className="lp-mock-txs">
                {[['Salário','+R$ 5.000','in'],['Aluguel','-R$ 1.200','out'],['Freelance','+R$ 2.000','in']].map(([n,v,t],i)=>(
                  <div key={i} className="lp-tx">
                    <span className="lp-tx-name">{n}</span>
                    <span className={`lp-tx-val ${t}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="lp-section">
        <div className="lp-inner">
          <div className="lp-section-label">Recursos</div>
          <h2 className="lp-section-title">Tudo que você precisa<br /><span className="lp-gradient">em um só lugar</span></h2>
          <div className="lp-features">
            {[
              {icon:'📊', title:'Dashboard em tempo real', desc:'Visualize receitas, despesas e saldo com gráficos interativos atualizados na hora.', c:'green'},
              {icon:'🎯', title:'Orçamentos inteligentes', desc:'Defina limites por categoria e receba alertas antes de estourar o orçamento.', c:'purple'},
              {icon:'💳', title:'Controle de transações', desc:'Registre e categorize todas as suas movimentações financeiras com facilidade.', c:'blue'},
              {icon:'📈', title:'Relatórios detalhados', desc:'Analise seus padrões de gastos e identifique oportunidades de economia.', c:'pink'},
              {icon:'🔒', title:'Segurança total', desc:'Dados protegidos com criptografia de ponta a ponta. Sua privacidade em primeiro lugar.', c:'orange'},
              {icon:'⚡', title:'Categorias personalizadas', desc:'Crie suas próprias categorias e adapte o sistema à sua realidade financeira.', c:'green'},
            ].map((f,i) => (
              <div key={i} className={`lp-feat lp-feat-${f.c}`}>
                <div className={`lp-feat-icon fi-${f.c}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="lp-section lp-section-dark">
        <div className="lp-inner">
          <div className="lp-section-label">Planos</div>
          <h2 className="lp-section-title">Simples e transparente</h2>
          <p className="lp-section-sub">Comece gratuitamente. Faça upgrade quando precisar de mais.</p>
          <div className="lp-plans">
            {/* Gratuito */}
            <div className="lp-plan">
              <h3>Gratuito</h3>
              <div className="lp-plan-price"><span>R$ 0</span><em>/mês</em></div>
              <ul>{['Até 50 transações/mês','3 categorias','Dashboard básico','Suporte por email'].map(f=><li key={f}>✓ {f}</li>)}</ul>
              <button className="lp-plan-btn-outline" onClick={() => navigate('/cadastro')}>Começar grátis</button>
            </div>
            {/* Pro */}
            <div className="lp-plan lp-plan-featured">
              <div className="lp-plan-badge">Mais popular</div>
              <h3>Pro</h3>
              <div className="lp-plan-price"><span>R$ 14,90</span><em>/mês</em></div>
              <ul>{['Transações ilimitadas','Categorias ilimitadas','Orçamentos avançados','Relatórios completos','Suporte prioritário'].map(f=><li key={f}>✓ {f}</li>)}</ul>
              <button className="lp-plan-btn-green" onClick={() => navigate('/cadastro?plano=pro')}>Assinar Pro →</button>
            </div>
            {/* Premium */}
            <div className="lp-plan lp-plan-premium">
              <h3>Premium</h3>
              <div className="lp-plan-price"><span>R$ 29,90</span><em>/mês</em></div>
              <ul>{['Tudo do Pro','Múltiplos usuários','API de integração','Exportação CSV/PDF','Gerente de conta dedicado'].map(f=><li key={f}>✓ {f}</li>)}</ul>
              <button className="lp-plan-btn-purple" onClick={() => navigate('/cadastro?plano=premium')}>Assinar Premium →</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-glow" />
        <div className="lp-inner lp-cta-inner">
          <h2>Pronto para assumir o controle?</h2>
          <p>Junte-se a quem já organiza as finanças com o FinControl.</p>
          <button className="lp-btn-hero" onClick={() => navigate('/cadastro')}>Criar conta gratuita →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-inner lp-footer-inner">
          <div className="lp-logo"><div className="lp-logo-icon">F</div><span>FinControl</span></div>
          <p>© 2026 FinControl. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
