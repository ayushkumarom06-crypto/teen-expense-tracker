export function money(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function dateOnly(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateRange(period) {
  const end = new Date();
  const start = new Date(end);
  if (period === 'today') start.setDate(end.getDate());
  else if (period === 'week') start.setDate(end.getDate() - 6);
  else if (period === 'lastMonth') { start.setDate(1); start.setMonth(start.getMonth() - 1); end.setDate(0); }
  else if (period === 'quarter') start.setMonth(end.getMonth() - 2, 1);
  else start.setDate(1);
  return { start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') };
}

export function today() {
  return new Date().toLocaleDateString('en-CA');
}