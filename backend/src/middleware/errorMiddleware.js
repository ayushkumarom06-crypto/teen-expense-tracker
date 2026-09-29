/**
 * Centralized error handling middleware.
 * Always returns consistent JSON structure. Never exposes stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Supabase/PostgreSQL errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists.',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource not found.',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.',
    });
  }

  // Validation errors
  if (err.status === 400 || err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid request data',
    });
  }

  // Default server error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong. Please try again.'
        : err.message || 'Internal server error',
  });
};

/**
 * 404 handler for unmatched routes.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
};

module.exports = { errorHandler, notFoundHandler };
