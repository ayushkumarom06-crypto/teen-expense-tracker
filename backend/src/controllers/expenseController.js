const expenseService = require('../services/expenseService');

const getExpenses = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenses(req.user.id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.user.id, req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const result = await expenseService.deleteExpense(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result, message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense };
