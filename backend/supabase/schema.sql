-- =====================================================================
-- Teen Expense Tracker — Supabase PostgreSQL Schema
-- Run this entire file in the Supabase SQL Editor
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name        TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'INR',
  monthly_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  budget_period    TEXT NOT NULL DEFAULT 'monthly',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
-- user_id NULL = global/default category available to all users
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '📌',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- ─── EXPENSES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id    UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount         DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description    TEXT NOT NULL,
  expense_date   DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id      ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id  ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date    ON expenses(user_id, expense_date DESC);

-- ─── BUDGETS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  period      TEXT NOT NULL DEFAULT 'monthly',
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- ─── SAVINGS GOALS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date    DATE,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);

-- =====================================================================
-- SEED: Default Global Categories (user_id = NULL means available to all)
-- =====================================================================
INSERT INTO categories (id, user_id, name, icon) VALUES
  (uuid_generate_v4(), NULL, 'Food',            '🍔'),
  (uuid_generate_v4(), NULL, 'Transportation',  '🚌'),
  (uuid_generate_v4(), NULL, 'Education',       '📚'),
  (uuid_generate_v4(), NULL, 'Entertainment',   '🎬'),
  (uuid_generate_v4(), NULL, 'Shopping',        '🛍️'),
  (uuid_generate_v4(), NULL, 'Gaming',          '🎮'),
  (uuid_generate_v4(), NULL, 'Mobile/Internet', '📱'),
  (uuid_generate_v4(), NULL, 'Health',          '💊'),
  (uuid_generate_v4(), NULL, 'Personal Care',   '✨'),
  (uuid_generate_v4(), NULL, 'Gifts',           '🎁'),
  (uuid_generate_v4(), NULL, 'Travel',          '✈️'),
  (uuid_generate_v4(), NULL, 'Subscriptions',   '🔄'),
  (uuid_generate_v4(), NULL, 'Other',           '💰')
ON CONFLICT DO NOTHING;
