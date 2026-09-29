const express = require('express');
const router = express.Router();
const { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
