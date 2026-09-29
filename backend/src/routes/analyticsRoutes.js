const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getSummary, getCategoryBreakdown, getSpendingTrend, getBudgetPerformance, getInsights } = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/categories', getCategoryBreakdown);
router.get('/trends', getSpendingTrend);
router.get('/budget-performance', getBudgetPerformance);
router.get('/insights', getInsights);

module.exports = router;
