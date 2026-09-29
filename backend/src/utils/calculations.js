/**
 * Safe division — returns 0 instead of Infinity/NaN.
 */
const safeDivide = (numerator, denominator) => {
  if (!denominator || denominator === 0) return 0;
  const result = numerator / denominator;
  return isFinite(result) ? result : 0;
};

/**
 * Calculate percentage safely.
 */
const calcPercentage = (part, total) => {
  return Math.round(safeDivide(part, total) * 100 * 100) / 100;
};

/**
 * Calculate average daily spending.
 */
const calcAverageDailySpending = (totalSpending, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  return Math.round(safeDivide(totalSpending, diffDays) * 100) / 100;
};

/**
 * Get start/end dates for common filter periods.
 */
const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today': {
      const start = new Date(today);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case 'last_3_months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    default: {
      // Default: this month
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
  }
};

module.exports = {
  safeDivide,
  calcPercentage,
  calcAverageDailySpending,
  getDateRange,
};
