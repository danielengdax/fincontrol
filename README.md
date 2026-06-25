# FinControl — SaaS de Gestão Financeira Pessoal

App completo com planos Pro (R$ 14,90/mês) e Premium (R$ 29,90/mês), cobrança automática via Stripe.

---

## Stack

- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + Tailwind CSS + Chart.js
- **Pagamentos:** Stripe (checkout + webhooks + portal)
- **E-mails:** SendGrid
- **Deploy:** Railway (backend + banco) + Vercel (frontend)

---

## Setup Local (15 minutos)

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/fincontrol
cd fincontrol/backend
npm install
```

### 2. Configure o banco de dados

Instale PostgreSQL localmente ou use Railway (gratuito):

```bash
# Crie o banco
createdb fincontrol

# Rode as migrations
psql fincontrol -f migrations.sql

# Configure o .env
cp .env.example .env
# Edite o .env com suas credenciais
```

### 3. Configure o Stripe

1. Crie conta em [stripe.com](https://stripe.com)
2. Vá em **Products** → Crie dois produtos:
   - **FinControl Pro** → Preço recorrente R$ 14,90/mês
   - **FinControl Premium** → Preço recorrente R$ 29,90/mês
3. Copie os `price_...` IDs para o `.env`
4. Vá em **Developers → API Keys** → Copie a secret key
5. Configure o webhook:

```bash
# Instale o Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escute webhooks localmente
stripe listen --forward-to localhost:3001/webhooks/stripe
# Copie o whsec_... para STRIPE_WEBHOOK_SECRET no .env
```

### 4. Configure o SendGrid

1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Vá em **Settings → API Keys** → Crie uma chave
3. Copie para `SENDGRID_API_KEY` no `.env`
4. Verifique seu domínio de envio

### 5. Rode o servidor

```bash
npm run dev
# Servidor em http://localhost:3001
```

### 6. Seed de usuários de teste

```bash
npm run seed
```

Usuários criados:
| E-mail | Senha | Plano |
|--------|-------|-------|
| trial@fincontrol.app | demo123456 | Trial 7 dias |
| pro@fincontrol.app | demo123456 | Pro ativo |
| premium@fincontrol.app | demo123456 | Premium ativo |
| suspenso@fincontrol.app | demo123456 | Conta suspensa |

---

## Deploy em Produção (grátis pra começar)

### Backend + Banco → Railway

1. Acesse [railway.app](https://railway.app) → New Project
2. Deploy from GitHub → selecione a pasta `backend`
3. Add Plugin → PostgreSQL (banco criado automaticamente)
4. Vá em Variables → adicione todas as variáveis do `.env`
5. Execute as migrations: Settings → Deploy → Custom Start Command:
   ```
   npm run migrate && npm start
   ```
6. Copie a URL gerada (ex: `fincontrol-backend.up.railway.app`)

### Frontend → Vercel

1. Acesse [vercel.com](https://vercel.com) → New Project
2. Import do GitHub → pasta `frontend`
3. Framework: Create React App (ou Next.js)
4. Environment Variables:
   ```
   REACT_APP_API_URL=https://fincontrol-backend.up.railway.app
   ```
5. Deploy → seu app estará em `fincontrol.vercel.app`

### Webhook em Produção

No [Dashboard do Stripe](https://dashboard.stripe.com/webhooks) → Add endpoint:
- URL: `https://fincontrol-backend.up.railway.app/webhooks/stripe`
- Eventos:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`

---

## Fluxo de Assinatura

```
Usuário cadastra → Trial 14 dias automático
       ↓
Trial expira → Bloqueio + tela de planos
       ↓
Escolhe plano → Checkout Stripe
       ↓
Pagamento aprovado → Webhook → Acesso liberado
       ↓
Todo mês → Cobrança automática
       ↓
Falha → E-mail aviso + 3 dias grace period
       ↓
Sem pagamento → Conta suspensa (dados preservados 90 dias)
```

---

## Limites por Plano

| Recurso | Grátis | Pro | Premium |
|---------|--------|-----|---------|
| Lançamentos/mês | 20 | ∞ | ∞ |
| Categorias | 3 | ∞ | ∞ |
| Relatórios | ❌ | ✅ | ✅ |
| Exportação CSV/PDF | ❌ | ✅ | ✅ |
| Orçamento | ❌ | ✅ | ✅ |
| Histórico | 1 mês | 24 meses | 24 meses |
| Usuários | 1 | 1 | 5 |
| Metas financeiras | ❌ | ❌ | ✅ |
| Preço | Grátis | R$ 14,90/mês | R$ 29,90/mês |

---

## API Endpoints

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/register | Cadastro |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Usuário atual |
| POST | /api/auth/forgot-password | Recuperar senha |
| POST | /api/auth/reset-password | Redefinir senha |

### Transações
| Método | Rota | Plano |
|--------|------|-------|
| GET | /api/transactions | Todos |
| POST | /api/transactions | Todos (limite free) |
| PUT | /api/transactions/:id | Todos |
| DELETE | /api/transactions/:id | Todos |
| GET | /api/transactions/summary | Todos |
| GET | /api/transactions/export | Pro+ |

### Assinatura
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/subscriptions/current | Dados da assinatura |
| POST | /api/subscriptions/checkout | Criar sessão Stripe |
| POST | /api/subscriptions/portal | Portal do cliente |
| POST | /api/subscriptions/cancel | Cancelar |

---

## Suporte
Dúvidas? Entre em contato: suporte@fincontrol.app
