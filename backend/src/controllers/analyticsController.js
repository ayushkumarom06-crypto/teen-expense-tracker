const analyticsService = require('../services/analyticsService');
const { generateInsights } = require('../services/insightService');

const getSummary = async (req, res, next) => {
  try {
    const data = await analyticsService.getSummary(req.user.id, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await analyticsService.getCategoryBreakdown(req.user.id, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSpendingTrend = async (req, res, next) => {
  try {
    const data = await analyticsService.getSpendingTrend(req.user.id, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getBudgetPerformance = async (req, res, next) => {
  try {
    const data = await analyticsService.getBudgetPerformance(req.user.id, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const { period } = req.query;
    const data = await generateInsights(req.user.id, period || 'this_month');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getSpendingTrend, getBudgetPerformance, getInsights };
