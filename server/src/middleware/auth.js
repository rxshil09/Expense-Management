// Authentication middleware
const { verifyJWT } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token' 
    });
  }

  try {
    // Verify token
    const decoded = verifyJWT(token);

    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, user not found' 
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Not authorized, token failed' 
    });
  }
};

module.exports = { protect };
