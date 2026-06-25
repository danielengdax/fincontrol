-- Migration 001: Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verify_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 002: Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
  status VARCHAR(20) NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','cancelled','suspended')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 003: Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6b6a66',
  icon VARCHAR(50) DEFAULT 'ti-dots',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 004: Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(3) NOT NULL CHECK (type IN ('in','out')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 005: Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Migration 006: Create goals table (Premium)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 007: Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Seed default categories (run after creating a user)
-- These are inserted per-user via the auth controller
