// Crypto utility functions
const crypto = require('crypto');

// Generate reset token
const generateResetToken = () => {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return {
    resetToken,
    resetPasswordToken,
    resetPasswordExpire,
  };
};

module.exports = {
  generateResetToken,
};
