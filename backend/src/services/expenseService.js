const supabase = require('../config/supabase');
const { isValidAmount, isValidDate, sanitizeString } = require('../utils/validators');

const VALID_PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

/**
 * Get all expenses for authenticated user with optional filters.
 */
const getExpenses = async (userId, { category, payment_method, search, start_date, end_date, sort_by = 'expense_date', sort_order = 'desc', page = 1, limit = 20 } = {}) => {
  let query = supabase
    .from('expenses')
    .select(`
      id, amount, description, expense_date, payment_method, notes, created_at, updated_at,
      categories ( id, name, icon )
    `, { count: 'exact' })
    .eq('user_id', userId);

  // Filters
  if (category) query = query.eq('category_id', category);
  if (payment_method) query = query.eq('payment_method', payment_method);
  if (start_date) query = query.gte('expense_date', start_date);
  if (end_date) query = query.lte('expense_date', end_date);
  if (search) {
    query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['expense_date', 'amount', 'created_at'];
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'expense_date';
  const ascending = sort_order === 'asc';
  query = query.order(sortField, { ascending });

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw { status: 500, message: 'Failed to fetch expenses' };

  return {
    expenses: data || [],
    pagination: {
      page: pageNum,
      limit: pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  };
};

/**
 * Get a single expense by ID — enforces ownership.
 */
const getExpenseById = async (userId, expenseId) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`id, amount, description, expense_date, payment_method, notes, created_at, updated_at, categories ( id, name, icon )`)
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw { status: 404, message: 'Expense not found' };
  }

  return data;
};

/**
 * Create a new expense.
 */
const createExpense = async (userId, { amount, category_id, description, expense_date, payment_method, notes }) => {
  // Validate
  if (!isValidAmount(amount)) throw { status: 400, message: 'Amount must be a positive number' };
  if (!category_id) throw { status: 400, message: 'Category is required' };
  if (!description || !sanitizeString(description)) throw { status: 400, message: 'Description is required' };
  if (!isValidDate(expense_date)) throw { status: 400, message: 'Valid date is required' };
  if (payment_method && !VALID_PAYMENT_METHODS.includes(payment_method)) {
    throw { status: 400, message: 'Invalid payment method' };
  }

  // Verify category belongs to this user or is a global category
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('id', category_id)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .single();

  if (!cat) throw { status: 400, message: 'Invalid category' };

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      amount: parseFloat(amount),
      category_id,
      description: sanitizeString(description),
      expense_date,
      payment_method: payment_method || 'Cash',
      notes: notes ? sanitizeString(notes) : null,
    })
    .select(`id, amount, description, expense_date, payment_method, notes, created_at, categories ( id, name, icon )`)
    .single();

  if (error) throw { status: 500, message: 'Failed to create expense' };

  return data;
};

/**
 * Update an expense — enforces ownership.
 */
const updateExpense = async (userId, expenseId, updates) => {
  // Check ownership first
  const { data: existing } = await supabase
    .from('expenses')
    .select('id')
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  if (!existing) throw { status: 404, message: 'Expense not found' };

  const cleanUpdates = {};

  if (updates.amount !== undefined) {
    if (!isValidAmount(updates.amount)) throw { status: 400, message: 'Amount must be a positive number' };
    cleanUpdates.amount = parseFloat(updates.amount);
  }

  if (updates.category_id) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', updates.category_id)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .single();
    if (!cat) throw { status: 400, message: 'Invalid category' };
    cleanUpdates.category_id = updates.category_id;
  }

  if (updates.description !== undefined) {
    const desc = sanitizeString(updates.description);
    if (!desc) throw { status: 400, message: 'Description cannot be empty' };
    cleanUpdates.description = desc;
  }

  if (updates.expense_date) {
    if (!isValidDate(updates.expense_date)) throw { status: 400, message: 'Valid date is required' };
    cleanUpdates.expense_date = updates.expense_date;
  }

  if (updates.payment_method) {
    if (!VALID_PAYMENT_METHODS.includes(updates.payment_method)) throw { status: 400, message: 'Invalid payment method' };
    cleanUpdates.payment_method = updates.payment_method;
  }

  if (updates.notes !== undefined) cleanUpdates.notes = updates.notes ? sanitizeString(updates.notes) : null;

  cleanUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('expenses')
    .update(cleanUpdates)
    .eq('id', expenseId)
    .eq('user_id', userId)
    .select(`id, amount, description, expense_date, payment_method, notes, updated_at, categories ( id, name, icon )`)
    .single();

  if (error) throw { status: 500, message: 'Failed to update expense' };

  return data;
};

/**
 * Delete an expense — enforces ownership.
 */
const deleteExpense = async (userId, expenseId) => {
  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error || !data) throw { status: 404, message: 'Expense not found' };

  return { id: expenseId };
};

module.exports = { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense };
