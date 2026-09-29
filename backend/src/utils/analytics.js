export function sum(items, selector = (item) => item.amount) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

export function categoryTotals(expenses) {
  const totals = new Map();
  for (const expense of expenses) {
    const name = expense.categories?.name ?? 'Other';
    totals.set(name, (totals.get(name) ?? 0) + Number(expense.amount));
  }
  return [...totals].map(([name, value]) => ({ name, value }));
}

export function buildInsights(expenses, budgets, previousExpenses = []) {
  const totals = categoryTotals(expenses).sort((a, b) => b.value - a.value);
  const total = sum(expenses);
  const previousTotal = sum(previousExpenses);
  const insights = [];
  if (totals[0]) insights.push({ type: 'category', title: 'Your biggest category', message: `${totals[0].name} is your top spending category at ₹${Math.round(totals[0].value).toLocaleString('en-IN')} this period.` });
  if (previousExpenses.length && previousTotal > 0) {
    const change = ((total - previousTotal) / previousTotal) * 100;
    insights.push({ type: 'trend', title: 'Spending trend', message: change >= 0 ? `Spending is up ${Math.round(change)}% compared with the previous period.` : `Spending is down ${Math.round(Math.abs(change))}% compared with the previous period.` });
  }
  for (const budget of budgets) {
    const spent = expenses.filter((item) => item.category_id === budget.category_id).reduce((value, item) => value + Number(item.amount), 0);
    const ratio = spent / Number(budget.amount);
    if (ratio >= 0.8) insights.push({ type: 'budget', title: `${budget.categories?.name ?? 'Budget'} budget`, message: ratio >= 1 ? `This budget is over by ₹${Math.round(spent - budget.amount).toLocaleString('en-IN')}.` : `You have used ${Math.round(ratio * 100)}% of this budget.` });
  }
  if (total > 0 && expenses.length >= 5) {
    const smallPurchases = expenses.filter((item) => Number(item.amount) <= total * 0.05);
    const smallTotal = sum(smallPurchases);
    if (smallPurchases.length >= 4 && smallTotal / total >= 0.2) insights.push({ type: 'pattern', title: 'Small purchases add up', message: `${smallPurchases.length} smaller purchases add up to ₹${Math.round(smallTotal).toLocaleString('en-IN')} this period.` });
  }
  return insights;
}