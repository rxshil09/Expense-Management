// Authentication routes
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  refreshToken, 
  logout, 
  verifyEmail, 
  resendOTP,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleCallback,
  googleVerify,
  linkGoogle,
  unlinkProvider
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../validation/auth.schemas');
const { handleValidationErrors } = require('../middleware/validate');

router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/forgot-password', forgotPasswordValidation, handleValidationErrors, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, handleValidationErrors, resetPassword);
router.get('/me', protect, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// New provider-based Google authentication
router.post('/google/verify', googleVerify);

// Provider linking routes (authenticated)
router.post('/providers/link/google', protect, linkGoogle);
router.delete('/providers/:type', protect, unlinkProvider);

module.exports = router;
