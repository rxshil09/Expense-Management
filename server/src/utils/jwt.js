// JWT utility functions
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateJWT = (payload, expiresIn = '15m') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Verify JWT token
const verifyJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Generate token pair (access + refresh)
const generateTokenPair = (userId, rememberMe = false) => {
  const payload = { id: userId };
  
  // Access token - short lived
  const accessToken = generateJWT(payload, '15m');
  
  // Refresh token - long lived based on remember me
  const refreshToken = generateRefreshToken();
  const refreshTokenExpiry = rememberMe 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days
  
  return {
    accessToken,
    refreshToken,
    refreshTokenExpiry,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
};

// Set token cookies
const setTokenCookies = (res, tokens, rememberMe = false) => {
  const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes
  const refreshTokenMaxAge = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000;  // 7 days

  // Set access token cookie
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: accessTokenMaxAge
  });

  // Set refresh token cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshTokenMaxAge
  });

  // Set remember me flag
  res.cookie('rememberMe', rememberMe.toString(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshTokenMaxAge
  });
};

// Clear token cookies
const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('rememberMe');
};

module.exports = {
  generateJWT,
  generateRefreshToken,
  verifyJWT,
  generateTokenPair,
  setTokenCookies,
  clearTokenCookies
};
