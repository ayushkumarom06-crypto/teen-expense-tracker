const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  getCategories, createCategory,
  getBudgets, createBudget, updateBudget, deleteBudget,
  getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
} = require('../controllers/budgetController');

router.use(authenticate);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);

// Budgets
router.get('/budgets', getBudgets);
router.post('/budgets', createBudget);
router.put('/budgets/:id', updateBudget);
router.delete('/budgets/:id', deleteBudget);

// Savings Goals
router.get('/savings-goals', getSavingsGoals);
router.post('/savings-goals', createSavingsGoal);
router.put('/savings-goals/:id', updateSavingsGoal);
router.delete('/savings-goals/:id', deleteSavingsGoal);

module.exports = router;
