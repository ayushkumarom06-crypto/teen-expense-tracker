const supabase = require('../config/supabase');
const { safeDivide, calcPercentage, calcAverageDailySpending, getDateRange } = require('../utils/calculations');

/**
 * Get analytics summary for a user.
 */
const getSummary = async (userId, { period, start_date, end_date }) => {
  let startDate, endDate;

  if (start_date && end_date) {
    startDate = start_date;
    endDate = end_date;
  } else {
    const range = getDateRange(period || 'this_month');
    startDate = range.start;
    endDate = range.end;
  }

  // Fetch user for allowance
  const { data: user } = await supabase
    .from('users')
    .select('monthly_allowance, currency')
    .eq('id', userId)
    .single();

  // Fetch expenses in range
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const monthlyAllowance = parseFloat(user?.monthly_allowance || 0);
  const remaining = Math.max(0, monthlyAllowance - totalExpenses);
  const avgDaily = calcAverageDailySpending(totalExpenses, startDate, endDate);

  return {
    monthly_allowance: monthlyAllowance,
    total_expenses: Math.round(totalExpenses * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    average_daily: Math.round(avgDaily * 100) / 100,
    currency: user?.currency || 'INR',
    period: { start: startDate, end: endDate },
    expense_count: (expenses || []).length,
  };
};

/**
 * Get spending by category for charts.
 */
const getCategoryBreakdown = async (userId, { period, start_date, end_date }) => {
  let startDate, endDate;
  if (start_date && end_date) {
    startDate = start_date;
    endDate = end_date;
  } else {
    const range = getDateRange(period || 'this_month');
    startDate = range.start;
    endDate = range.end;
  }

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, categories ( id, name, icon )')
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  if (!expenses || expenses.length === 0) return [];

  // Group by category
  const categoryMap = {};
  let total = 0;

  expenses.forEach((e) => {
    const catName = e.categories?.name || 'Other';
    const catId = e.categories?.id || 'other';
    const catIcon = e.categories?.icon || '💰';
    const amount = parseFloat(e.amount);
    total += amount;

    if (!categoryMap[catId]) {
      categoryMap[catId] = { id: catId, name: catName, icon: catIcon, amount: 0 };
    }
    categoryMap[catId].amount += amount;
  });

  return Object.values(categoryMap)
    .map((cat) => ({
      ...cat,
      amount: Math.round(cat.amount * 100) / 100,
      percentage: calcPercentage(cat.amount, total),
    }))
    .sort((a, b) => b.amount - a.amount);
};

/**
 * Get spending trend over time (daily aggregation).
 */
const getSpendingTrend = async (userId, { period, start_date, end_date }) => {
  let startDate, endDate;
  if (start_date && end_date) {
    startDate = start_date;
    endDate = end_date;
  } else {
    const range = getDateRange(period || 'this_month');
    startDate = range.start;
    endDate = range.end;
  }

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('expense_date', { ascending: true });

  if (!expenses || expenses.length === 0) return [];

  // Group by date
  const dailyMap = {};
  expenses.forEach((e) => {
    const date = e.expense_date.split('T')[0];
    if (!dailyMap[date]) dailyMap[date] = 0;
    dailyMap[date] += parseFloat(e.amount);
  });

  return Object.entries(dailyMap)
    .map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get budget vs actual performance.
 */
const getBudgetPerformance = async (userId, { period, start_date, end_date }) => {
  let startDate, endDate;
  if (start_date && end_date) {
    startDate = start_date;
    endDate = end_date;
  } else {
    const range = getDateRange(period || 'this_month');
    startDate = range.start;
    endDate = range.end;
  }

  // Fetch budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('id, amount, categories ( id, name, icon )')
    .eq('user_id', userId);

  if (!budgets || budgets.length === 0) return [];

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category_id')
    .eq('user_id', userId)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  // Group expenses by category
  const spentMap = {};
  (expenses || []).forEach((e) => {
    if (!spentMap[e.category_id]) spentMap[e.category_id] = 0;
    spentMap[e.category_id] += parseFloat(e.amount);
  });

  return budgets.map((b) => {
    const catId = b.categories?.id;
    const spent = spentMap[catId] || 0;
    const budget = parseFloat(b.amount);
    const remaining = budget - spent;
    const percentage = calcPercentage(spent, budget);

    return {
      category: b.categories?.name || 'Unknown',
      icon: b.categories?.icon || '💰',
      budget: Math.round(budget * 100) / 100,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentage,
      over_budget: spent > budget,
    };
  });
};

module.exports = { getSummary, getCategoryBreakdown, getSpendingTrend, getBudgetPerformance };
