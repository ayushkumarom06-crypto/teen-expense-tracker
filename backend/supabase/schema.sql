create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null unique,
  password_hash text not null,
  currency char(3) not null default 'INR',
  monthly_allowance numeric(12, 2) not null default 0 check (monthly_allowance >= 0),
  budget_period text not null default 'monthly' check (budget_period in ('weekly', 'monthly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'circle',
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, name)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 120),
  expense_date date not null,
  payment_method text not null check (payment_method in ('Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  period text not null check (period in ('weekly', 'monthly')),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0 and current_amount <= target_amount),
  target_date date,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses(user_id, expense_date desc);
create index if not exists expenses_user_category_idx on public.expenses(user_id, category_id);
create index if not exists budgets_user_period_idx on public.budgets(user_id, start_date, end_date);
create index if not exists savings_goals_user_idx on public.savings_goals(user_id);

insert into public.categories (user_id, name, icon) values
  (null, 'Food', 'utensils'), (null, 'Transportation', 'bus'), (null, 'Education', 'book-open'),
  (null, 'Entertainment', 'clapperboard'), (null, 'Shopping', 'shopping-bag'), (null, 'Gaming', 'gamepad-2'),
  (null, 'Mobile/Internet', 'smartphone'), (null, 'Health', 'heart-pulse'), (null, 'Personal Care', 'sparkles'),
  (null, 'Gifts', 'gift'), (null, 'Travel', 'plane'), (null, 'Subscriptions', 'repeat'), (null, 'Other', 'shapes')
on conflict do nothing;

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;

create policy "Users can read their own profile" on public.users for select using (id = auth.uid());
create policy "Users can update their own profile" on public.users for update using (id = auth.uid());
create policy "Users can read available categories" on public.categories for select using (user_id is null or user_id = auth.uid());
create policy "Users can manage their categories" on public.categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can manage their expenses" on public.expenses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can manage their budgets" on public.budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can manage their savings goals" on public.savings_goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());