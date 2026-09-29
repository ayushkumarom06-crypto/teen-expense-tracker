/**
 * Validate email format.
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength.
 * Minimum 8 characters, at least one letter and one number.
 */
const isValidPassword = (password) => {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

/**
 * Validate that amount is a positive finite number.
 */
const isValidAmount = (amount) => {
  const num = parseFloat(amount);
  return isFinite(num) && num > 0;
};

/**
 * Validate ISO date string.
 */
const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

/**
 * Sanitize string input.
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 500);
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidAmount,
  isValidDate,
  sanitizeString,
};
