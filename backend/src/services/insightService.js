const supabase = require('../config/supabase');
const { getCategoryBreakdown, getSummary } = require('./analyticsService');
const { getDateRange } = require('../utils/calculations');

/**
 * Generate data-driven spending insights for a user.
 */
const generateInsights = async (userId, period = 'this_month') => {
  const insights = [];

  const range = getDateRange(period);
  const prevRange = getDateRange('last_month');

  // Get current period summary
  const summary = await getSummary(userId, { period });
  const categories = await getCategoryBreakdown(userId, { period });

  // Get previous period for comparison
  const prevCategories = await getCategoryBreakdown(userId, {
    start_date: prevRange.start,
    end_date: prevRange.end,
  });

  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('expense_date', prevRange.start)
    .lte('expense_date', prevRange.end);

  const prevTotal = (prevExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const currentTotal = summary.total_expenses;

  // 1. Highest spending category
  if (categories.length > 0) {
    const top = categories[0];
    insights.push({
      type: 'top_category',
      icon: top.icon,
      title: `Your top spending: ${top.name}`,
      message: `You spent ₹${top.amount.toLocaleString('en-IN')} on ${top.name} this period, which is ${top.percentage}% of your total spending.`,
      priority: 1,
    });
  }

  // 2. Spending trend vs previous period
  if (prevTotal > 0) {
    const change = ((currentTotal - prevTotal) / prevTotal) * 100;
    const increased = change > 0;
    insights.push({
      type: 'trend',
      icon: increased ? '📈' : '📉',
      title: increased ? 'Spending increased' : 'Spending decreased',
      message: increased
        ? `Your spending increased by ${Math.abs(Math.round(change))}% compared to last month. Try reviewing your ${categories[0]?.name || 'top'} expenses.`
        : `Great job! Your spending decreased by ${Math.abs(Math.round(change))}% compared to last month.`,
      priority: 2,
    });
  }

  // 3. Budget warnings
  const { data: budgets } = await supabase
    .from('budgets')
    .select('amount, categories ( name, icon )')
    .eq('user_id', userId);

  if (budgets && budgets.length > 0) {
    for (const budget of budgets) {
      const catData = categories.find((c) => c.name === budget.categories?.name);
      if (catData) {
        const pct = (catData.amount / parseFloat(budget.amount)) * 100;
        if (pct >= 100) {
          insights.push({
            type: 'budget_exceeded',
            icon: '🚨',
            title: `${budget.categories?.name} budget exceeded`,
            message: `You have exceeded your ${budget.categories?.name} budget by ₹${(catData.amount - parseFloat(budget.amount)).toLocaleString('en-IN')}. Consider reviewing your spending in this category.`,
            priority: 0,
          });
        } else if (pct >= 80) {
          insights.push({
            type: 'budget_warning',
            icon: '⚠️',
            title: `${budget.categories?.name} budget almost full`,
            message: `You've used ${Math.round(pct)}% of your ${budget.categories?.name} budget. Only ₹${(parseFloat(budget.amount) - catData.amount).toLocaleString('en-IN')} remaining.`,
            priority: 1,
          });
        }
      }
    }
  }

  // 4. Small frequent purchases check
  const { data: allExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('expense_date', range.start)
    .lte('expense_date', range.end);

  if (allExpenses && allExpenses.length > 0) {
    const smallExpenses = allExpenses.filter((e) => parseFloat(e.amount) < 200);
    const smallTotal = smallExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const smallPct = currentTotal > 0 ? (smallTotal / currentTotal) * 100 : 0;

    if (smallPct > 30 && smallExpenses.length > 5) {
      insights.push({
        type: 'small_purchases',
        icon: '🔍',
        title: 'Small purchases add up',
        message: `You made ${smallExpenses.length} small purchases (under ₹200) totalling ₹${Math.round(smallTotal).toLocaleString('en-IN')} — that's ${Math.round(smallPct)}% of your spending. Tracking these can help you save more.`,
        priority: 3,
      });
    }
  }

  // 5. Savings suggestion
  if (summary.remaining > 0) {
    const savingsAmount = Math.round(summary.remaining * 0.5);
    insights.push({
      type: 'savings_suggestion',
      icon: '💰',
      title: 'Savings opportunity',
      message: `You have ₹${summary.remaining.toLocaleString('en-IN')} left this period. Consider saving at least ₹${savingsAmount.toLocaleString('en-IN')} toward a savings goal.`,
      priority: 4,
    });
  }

  // 6. Smart spending tips per category
  const tips = [];
  categories.slice(0, 3).forEach((cat) => {
    if (cat.percentage > 30) {
      const suggested = Math.round(cat.amount * 0.85);
      tips.push({
        category: cat.name,
        icon: cat.icon,
        current: cat.amount,
        suggested,
        saving: cat.amount - suggested,
      });
    }
  });

  return {
    insights: insights.sort((a, b) => a.priority - b.priority),
    smart_tips: tips,
    summary,
  };
};

module.exports = { generateInsights };
