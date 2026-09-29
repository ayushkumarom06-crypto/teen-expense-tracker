const supabase = require('../config/supabase');
const { sanitizeString, isValidAmount, isValidDate } = require('../utils/validators');

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

const getCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, user_id')
      .or(`user_id.eq.${req.user.id},user_id.is.null`)
      .order('name');

    if (error) throw { status: 500, message: 'Failed to fetch categories' };
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const { data, error } = await supabase
      .from('categories')
      .insert({ name: sanitizeString(name), icon: icon || '📌', user_id: req.user.id })
      .select()
      .single();

    if (error) throw { status: 500, message: 'Failed to create category' };
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

const getBudgets = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('id, amount, period, start_date, end_date, created_at, categories ( id, name, icon )')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw { status: 500, message: 'Failed to fetch budgets' };
    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
};

const createBudget = async (req, res, next) => {
  try {
    const { category_id, amount, period, start_date, end_date } = req.body;
    if (!category_id || !amount || !period) {
      return res.status(400).json({ success: false, message: 'Category, amount, and period are required' });
    }
    if (!isValidAmount(amount)) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    // Verify category access
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .or(`user_id.eq.${req.user.id},user_id.is.null`)
      .single();
    if (!cat) return res.status(400).json({ success: false, message: 'Invalid category' });

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: req.user.id,
        category_id,
        amount: parseFloat(amount),
        period: sanitizeString(period),
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select('id, amount, period, start_date, end_date, categories ( id, name, icon )')
      .single();

    if (error) throw { status: 500, message: 'Failed to create budget' };
    res.status(201).json({ success: true, data, message: 'Budget created successfully' });
  } catch (err) {
    next(err);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const { amount, period, start_date, end_date } = req.body;
    const updates = {};

    if (amount !== undefined) {
      if (!isValidAmount(amount)) return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      updates.amount = parseFloat(amount);
    }
    if (period) updates.period = sanitizeString(period);
    if (start_date) updates.start_date = start_date;
    if (end_date) updates.end_date = end_date;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id, amount, period, start_date, end_date, categories ( id, name, icon )')
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Budget not found' });
    res.status(200).json({ success: true, data, message: 'Budget updated successfully' });
  } catch (err) {
    next(err);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id')
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Budget not found' });
    res.status(200).json({ success: true, message: 'Budget deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── SAVINGS GOALS ────────────────────────────────────────────────────────────

const getSavingsGoals = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('id, name, target_amount, current_amount, target_date, description, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw { status: 500, message: 'Failed to fetch savings goals' };

    const goals = (data || []).map((g) => ({
      ...g,
      percentage: g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0,
    }));

    res.status(200).json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
};

const createSavingsGoal = async (req, res, next) => {
  try {
    const { name, target_amount, current_amount = 0, target_date, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Goal name is required' });
    if (!isValidAmount(target_amount)) return res.status(400).json({ success: false, message: 'Target amount must be a positive number' });

    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: req.user.id,
        name: sanitizeString(name),
        target_amount: parseFloat(target_amount),
        current_amount: parseFloat(current_amount) || 0,
        target_date: target_date || null,
        description: description ? sanitizeString(description) : null,
      })
      .select()
      .single();

    if (error) throw { status: 500, message: 'Failed to create savings goal' };
    res.status(201).json({ success: true, data: { ...data, percentage: 0 }, message: 'Savings goal created successfully' });
  } catch (err) {
    next(err);
  }
};

const updateSavingsGoal = async (req, res, next) => {
  try {
    const { name, target_amount, current_amount, target_date, description } = req.body;
    const updates = {};

    if (name) updates.name = sanitizeString(name);
    if (target_amount !== undefined) {
      if (!isValidAmount(target_amount)) return res.status(400).json({ success: false, message: 'Target amount must be a positive number' });
      updates.target_amount = parseFloat(target_amount);
    }
    if (current_amount !== undefined) {
      const amt = parseFloat(current_amount);
      if (isNaN(amt) || amt < 0) return res.status(400).json({ success: false, message: 'Current amount must be non-negative' });
      updates.current_amount = amt;
    }
    if (target_date !== undefined) updates.target_date = target_date || null;
    if (description !== undefined) updates.description = description ? sanitizeString(description) : null;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Savings goal not found' });

    const percentage = data.target_amount > 0 ? Math.min(100, Math.round((data.current_amount / data.target_amount) * 100)) : 0;
    res.status(200).json({ success: true, data: { ...data, percentage }, message: 'Savings goal updated successfully' });
  } catch (err) {
    next(err);
  }
};

const deleteSavingsGoal = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id')
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Savings goal not found' });
    res.status(200).json({ success: true, message: 'Savings goal deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories, createCategory,
  getBudgets, createBudget, updateBudget, deleteBudget,
  getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
};
