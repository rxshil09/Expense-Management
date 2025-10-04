// Token utility functions
const crypto = require('crypto');

// Generate random token
const generateRandomToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Hash token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateRandomToken,
  hashToken,
};
