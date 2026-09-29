const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to authenticate JWT tokens.
 * Reads from Authorization: Bearer <token>
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Attach user info from token to request — never trust body user_id
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }
};

module.exports = { authenticate };
