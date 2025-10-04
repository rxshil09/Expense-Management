// User routes
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { handleAvatarUpload } = require('../middleware/upload');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');

// Profile validation
const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword')
    .optional(), // Make optional for OAuth users setting password for first time
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

// Delete account validation
const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, handleValidationErrors, updateProfile);

// Avatar routes
router.post('/avatar', protect, handleAvatarUpload, uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);

// Password and account management
router.put('/change-password', protect, changePasswordValidation, handleValidationErrors, changePassword);
router.delete('/account', protect, deleteAccountValidation, handleValidationErrors, deleteAccount);

module.exports = router;
