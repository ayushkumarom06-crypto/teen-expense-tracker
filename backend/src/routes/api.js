import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { asyncRoute, databaseError, fail, respond } from '../utils/http.js';
import { buildInsights, categoryTotals, sum } from '../utils/analytics.js';
import { budgetSchema, expenseSchema, goalSchema, loginSchema, parse, profileSchema, registerSchema } from '../utils/validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const publicUserFields = 'id, full_name, email, currency, monthly_allowance, budget_period, created_at';
const paymentMethods = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

function dataOrFail(result) {
  if (result.error) databaseError(result.error);
  return result.data;
}

function rangeFromQuery(query) {
  const start = query.start;
  const end = query.end;
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) {
    throw fail(400, 'Choose a valid start and end date.');
  }
  return { start, end };
}

async function ownedByCategory(db, userId, categoryId) {
  const { data, error } = await db.from('categories').select('id').eq('id', categoryId).or(`user_id.is.null,user_id.eq.${userId}`).maybeSingle();
  if (error) throw error;
  if (!data) throw fail(400, 'Choose a valid category.');
}

router.post('/auth/register', asyncRoute(async (req, res) => {
  const input = parse(registerSchema, req.body);
  const db = req.supabase;
  const existing = dataOrFail(await db.from('users').select('id').eq('email', input.email).maybeSingle());
  if (existing) throw fail(409, 'An account with this email already exists.');
  const password_hash = await bcrypt.hash(input.password, 12);
  const user = dataOrFail(await db.from('users').insert({ full_name: input.fullName, email: input.email, password_hash }).select(publicUserFields).single());
  respond(res, { user }, 201);
}));

router.post('/auth/login', asyncRoute(async (req, res) => {
  const input = parse(loginSchema, req.body);
  const db = req.supabase;
  const result = await db.from('users').select('id, full_name, email, currency, monthly_allowance, budget_period, password_hash').eq('email', input.email).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data || !(await bcrypt.compare(input.password, result.data.password_hash))) throw fail(401, 'Email or password is incorrect.');
  const { password_hash, ...user } = result.data;
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  respond(res, { token, user });
}));

router.use(requireAuth);

router.get('/auth/me', asyncRoute(async (req, res) => {
  const user = dataOrFail(await req.supabase.from('users').select(publicUserFields).eq('id', req.userId).single());
  respond(res, { user });
}));

router.patch('/profile', asyncRoute(async (req, res) => {
  const input = parse(profileSchema, req.body);
  const user = dataOrFail(await req.supabase.from('users').update(input).eq('id', req.userId).select(publicUserFields).single());
  respond(res, { user });
}));

router.get('/categories', asyncRoute(async (req, res) => {
  const { data, error } = await req.supabase.from('categories').select('id, name, icon').or(`user_id.is.null,user_id.eq.${req.userId}`).order('name');
  if (error) throw error;
  respond(res, data);
}));

router.get('/expenses', asyncRoute(async (req, res) => {
  const db = req.supabase;
  let query = db.from('expenses').select('*, categories(id, name, icon)', { count: 'exact' }).eq('user_id', req.userId);
  if (req.query.start || req.query.end) {
    const start = req.query.start;
    const end = req.query.end;
    if ((start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) || (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) || (start && end && end < start)) {
      throw fail(400, 'Choose a valid date range.');
    }
    if (start) query = query.gte('expense_date', start);
    if (end) query = query.lte('expense_date', end);
  }
  if (req.query.category) query = query.eq('category_id', req.query.category);
  if (req.query.payment) {
    if (!paymentMethods.includes(req.query.payment)) throw fail(400, 'Choose a valid payment method.');
    query = query.eq('payment_method', req.query.payment);
  }
  if (req.query.search) {
    const term = String(req.query.search).trim().slice(0, 80).replace(/[(),.*%_\\]/g, '');
    if (term) {
      const match = await db.from('categories').select('id').ilike('name', `%${term}%`).or(`user_id.is.null,user_id.eq.${req.userId}`);
      if (match.error) throw match.error;
      const conditions = [`description.ilike.%${term}%`, `notes.ilike.%${term}%`];
      if (match.data.length) conditions.push(`category_id.in.(${match.data.map((item) => item.id).join(',')})`);
      query = query.or(conditions.join(','));
    }
  }
  const sort = req.query.sort === 'amount' ? 'amount' : 'expense_date';
  const ascending = req.query.order === 'asc';
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const { data, error, count } = await query.order(sort, { ascending }).range((page - 1) * limit, page * limit - 1);
  if (error) throw error;
  respond(res, { items: data, page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) });
}));

router.post('/expenses', asyncRoute(async (req, res) => {
  const input = parse(expenseSchema, req.body);
  await ownedByCategory(req.supabase, req.userId, input.category_id);
  const expense = dataOrFail(await req.supabase.from('expenses').insert({ ...input, user_id: req.userId }).select('*, categories(id, name, icon)').single());
  respond(res, expense, 201);
}));

router.get('/expenses/:id', asyncRoute(async (req, res) => {
  const expense = dataOrFail(await req.supabase.from('expenses').select('*, categories(id, name, icon)').eq('id', req.params.id).eq('user_id', req.userId).maybeSingle());
  if (!expense) throw fail(404, 'Expense not found.');
  respond(res, expense);
}));

router.put('/expenses/:id', asyncRoute(async (req, res) => {
  const input = parse(expenseSchema, req.body);
  await ownedByCategory(req.supabase, req.userId, input.category_id);
  const expense = dataOrFail(await req.supabase.from('expenses').update(input).eq('id', req.params.id).eq('user_id', req.userId).select('*, categories(id, name, icon)').maybeSingle());
  if (!expense) throw fail(404, 'Expense not found.');
  respond(res, expense);
}));

router.delete('/expenses/:id', asyncRoute(async (req, res) => {
  const result = await req.supabase.from('expenses').delete().eq('id', req.params.id).eq('user_id', req.userId).select('id').maybeSingle();
  const removed = dataOrFail(result);
  if (!removed) throw fail(404, 'Expense not found.');
  respond(res, { id: removed.id });
}));

function resourceRoutes(path, table, schema, fields) {
  router.get(path, asyncRoute(async (req, res) => {
    const { data, error } = await req.supabase.from(table).select(fields).eq('user_id', req.userId).order('created_at', { ascending: false });
    if (error) throw error;
    if (table !== 'budgets' || !data.length) return respond(res, data);
    const start = data.reduce((value, item) => item.start_date < value ? item.start_date : value, data[0].start_date);
    const end = data.reduce((value, item) => item.end_date > value ? item.end_date : value, data[0].end_date);
    const expenses = await req.supabase.from('expenses').select('category_id, amount, expense_date').eq('user_id', req.userId).gte('expense_date', start).lte('expense_date', end);
    if (expenses.error) throw expenses.error;
    const budgets = data.map((budget) => {
      const spent = expenses.data.filter((expense) => expense.category_id === budget.category_id && expense.expense_date >= budget.start_date && expense.expense_date <= budget.end_date).reduce((total, expense) => total + Number(expense.amount), 0);
      return { ...budget, spent, remaining: Number(budget.amount) - spent, percentage: Number(budget.amount) > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0 };
    });
    respond(res, budgets);
  }));
  router.post(path, asyncRoute(async (req, res) => {
    const input = parse(schema, req.body);
    if (input.category_id) await ownedByCategory(req.supabase, req.userId, input.category_id);
    const item = dataOrFail(await req.supabase.from(table).insert({ ...input, user_id: req.userId }).select(fields).single());
    respond(res, item, 201);
  }));
  router.put(`${path}/:id`, asyncRoute(async (req, res) => {
    const input = parse(schema, req.body);
    if (input.category_id) await ownedByCategory(req.supabase, req.userId, input.category_id);
    const item = dataOrFail(await req.supabase.from(table).update(input).eq('id', req.params.id).eq('user_id', req.userId).select(fields).maybeSingle());
    if (!item) throw fail(404, 'Item not found.');
    respond(res, item);
  }));
  router.delete(`${path}/:id`, asyncRoute(async (req, res) => {
    const removed = dataOrFail(await req.supabase.from(table).delete().eq('id', req.params.id).eq('user_id', req.userId).select('id').maybeSingle());
    if (!removed) throw fail(404, 'Item not found.');
    respond(res, { id: removed.id });
  }));
}

resourceRoutes('/budgets', 'budgets', budgetSchema, '*, categories(id, name, icon)');
resourceRoutes('/savings-goals', 'savings_goals', goalSchema, '*');

router.get('/analytics/dashboard', asyncRoute(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  const db = req.supabase;
  const [userResult, expensesResult, budgetsResult, goalsResult] = await Promise.all([
    db.from('users').select('monthly_allowance, currency').eq('id', req.userId).single(),
    db.from('expenses').select('amount, expense_date, category_id, categories(name, icon)').eq('user_id', req.userId).gte('expense_date', start).lte('expense_date', end),
    db.from('budgets').select('*, categories(name, icon)').eq('user_id', req.userId).lte('start_date', end).gte('end_date', start),
    db.from('savings_goals').select('current_amount').eq('user_id', req.userId),
  ]);
  for (const result of [userResult, expensesResult, budgetsResult, goalsResult]) if (result.error) throw result.error;
  const expenses = expensesResult.data;
  const totalSpent = sum(expenses);
  const days = Math.max(1, Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000) + 1);
  const monthlyIncome = Number(userResult.data.monthly_allowance);
  const income = monthlyIncome * (days / 30);
  const byDate = new Map();
  for (const expense of expenses) byDate.set(expense.expense_date, (byDate.get(expense.expense_date) ?? 0) + Number(expense.amount));
  const trends = [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount }));
  const budgets = budgetsResult.data.map((budget) => {
    const spent = expenses.filter((expense) => expense.category_id === budget.category_id).reduce((value, expense) => value + Number(expense.amount), 0);
    return { ...budget, spent, remaining: Number(budget.amount) - spent, percentage: Number(budget.amount) > 0 ? Math.round((spent / Number(budget.amount)) * 100) : 0 };
  });
  respond(res, {
    currency: userResult.data.currency,
    summary: { income, spent: totalSpent, remaining: income - totalSpent, saved: sum(goalsResult.data, (goal) => goal.current_amount), averageDaily: totalSpent / days },
    categories: categoryTotals(expenses), trends, budgets,
    insights: buildInsights(expenses, budgetsResult.data),
  });
}));

router.get('/analytics/insights', asyncRoute(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  const db = req.supabase;
  const duration = Math.max(1, Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000) + 1);
  const previousEnd = new Date(`${start}T00:00:00Z`);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - duration + 1);
  const fmt = (date) => date.toISOString().slice(0, 10);
  const [current, previous, budgets] = await Promise.all([
    db.from('expenses').select('amount, category_id, categories(name)').eq('user_id', req.userId).gte('expense_date', start).lte('expense_date', end),
    db.from('expenses').select('amount').eq('user_id', req.userId).gte('expense_date', fmt(previousStart)).lte('expense_date', fmt(previousEnd)),
    db.from('budgets').select('*, categories(name)').eq('user_id', req.userId).lte('start_date', end).gte('end_date', start),
  ]);
  for (const result of [current, previous, budgets]) if (result.error) throw result.error;
  respond(res, buildInsights(current.data, budgets.data, previous.data));
}));

export default router;