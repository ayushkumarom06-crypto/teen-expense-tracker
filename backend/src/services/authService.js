const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');
const { generateToken } = require('../utils/jwt');
const { isValidEmail, isValidPassword, sanitizeString } = require('../utils/validators');

const BCRYPT_ROUNDS = 12;

/**
 * Register a new user.
 */
const register = async ({ fullName, email, password, confirmPassword }) => {
  // Validate inputs
  if (!fullName || !email || !password || !confirmPassword) {
    throw { status: 400, message: 'All fields are required' };
  }

  const cleanName = sanitizeString(fullName);
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || cleanName.length < 2) {
    throw { status: 400, message: 'Full name must be at least 2 characters' };
  }

  if (!isValidEmail(cleanEmail)) {
    throw { status: 400, message: 'Please provide a valid email address' };
  }

  if (!isValidPassword(password)) {
    throw { status: 400, message: 'Password must be at least 8 characters and contain at least one letter and one number' };
  }

  if (password !== confirmPassword) {
    throw { status: 400, message: 'Passwords do not match' };
  }

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', cleanEmail)
    .single();

  if (existing) {
    throw { status: 409, message: 'An account with this email already exists' };
  }

  // Hash password — never store plaintext
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Insert user
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      full_name: cleanName,
      email: cleanEmail,
      password_hash: passwordHash,
      currency: 'INR',
      monthly_allowance: 0,
    })
    .select('id, full_name, email, currency, monthly_allowance, created_at')
    .single();

  if (error) throw { status: 500, message: 'Failed to create account. Please try again.' };

  // Generate JWT — only id and email in payload
  const token = generateToken({ id: user.id, email: user.email });

  return { user, token };
};

/**
 * Login an existing user.
 */
const login = async ({ email, password }) => {
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Fetch user (include password_hash for comparison)
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, password_hash, currency, monthly_allowance, created_at')
    .eq('email', cleanEmail)
    .single();

  if (error || !user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  // Compare passwords using bcrypt
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  // Generate JWT
  const token = generateToken({ id: user.id, email: user.email });

  // Never return password hash to frontend
  const { password_hash, ...safeUser } = user;

  return { user: safeUser, token };
};

/**
 * Get current authenticated user profile.
 */
const getMe = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, currency, monthly_allowance, budget_period, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw { status: 404, message: 'User not found' };
  }

  return user;
};

/**
 * Update user profile.
 */
const updateProfile = async (userId, updates) => {
  const allowedFields = ['full_name', 'monthly_allowance', 'currency', 'budget_period'];
  const cleanUpdates = {};

  if (updates.full_name) {
    const name = sanitizeString(updates.full_name);
    if (name.length < 2) throw { status: 400, message: 'Name must be at least 2 characters' };
    cleanUpdates.full_name = name;
  }

  if (updates.monthly_allowance !== undefined) {
    const amount = parseFloat(updates.monthly_allowance);
    if (isNaN(amount) || amount < 0) throw { status: 400, message: 'Monthly allowance must be a non-negative number' };
    cleanUpdates.monthly_allowance = amount;
  }

  if (updates.currency) cleanUpdates.currency = sanitizeString(updates.currency);
  if (updates.budget_period) cleanUpdates.budget_period = sanitizeString(updates.budget_period);

  cleanUpdates.updated_at = new Date().toISOString();

  const { data: user, error } = await supabase
    .from('users')
    .update(cleanUpdates)
    .eq('id', userId)
    .select('id, full_name, email, currency, monthly_allowance, budget_period, updated_at')
    .single();

  if (error) throw { status: 500, message: 'Failed to update profile' };

  return user;
};

module.exports = { register, login, getMe, updateProfile };
