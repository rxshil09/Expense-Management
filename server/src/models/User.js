// User model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Provider schema for tracking authentication methods
const ProviderSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['google', 'password', 'email-otp'],
    required: true
  },
  sub: {
    type: String, // Google sub ID
    sparse: true
  },
  email: {
    type: String,
    sparse: true
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  linkedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Email entry schema for tracking multiple emails
const EmailEntrySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  // New provider-based authentication system
  providers: [ProviderSchema],
  emails: [EmailEntrySchema],
  primaryEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    select: false
  },
  // Legacy fields for backward compatibility
  email: {
    type: String,
    required: function() {
      return !this.primaryEmail; // Only required if primaryEmail not set
    },
    unique: true,
    sparse: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.passwordHash; // Not required for OAuth or new system
    },
    minlength: 6,
    select: false,
  },
  avatar: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationOTP: {
    type: String,
    select: false,
  },
  emailVerificationOTPExpires: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Google OAuth fields
  googleId: {
    type: String,
    default: null,
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
});

// Indexes for efficient queries
UserSchema.index({ 'providers.sub': 1, 'providers.type': 1 }, { sparse: true });
UserSchema.index({ 'emails.email': 1 }, { unique: true, sparse: true });
UserSchema.index({ primaryEmail: 1 }, { unique: true });
// Legacy email field index - only for non-null values
UserSchema.index({ email: 1 }, { 
  unique: true, 
  partialFilterExpression: { email: { $ne: null, $exists: true } }
});

// Pre-save middleware
UserSchema.pre('save', async function (next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // Handle legacy email migration
  if (this.email && !this.primaryEmail) {
    this.primaryEmail = this.email;
    if (!this.emails.find(e => e.email === this.email)) {
      this.emails.push({
        email: this.email,
        verified: this.emailVerified || false,
        verifiedAt: this.emailVerified ? new Date() : null,
        isPrimary: true
      });
    }
  }

  // Handle password hashing
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Add password provider if not exists
    if (!this.providers.find(p => p.type === 'password')) {
      this.providers.push({
        type: 'password',
        email: this.primaryEmail,
        linkedAt: new Date()
      });
    }
  }
  
  next();
});

// Exclude deleted users from queries by default
UserSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add refresh token
UserSchema.methods.addRefreshToken = async function (token, expiresAt) {
  this.refreshTokens.push({ token, expiresAt });
  await this.save();
};

// Remove refresh token
UserSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  await this.save();
};

// Clean expired refresh tokens
UserSchema.methods.cleanExpiredTokens = async function () {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > new Date());
  await this.save();
};

// Generate email verification OTP
UserSchema.methods.generateEmailVerificationOTP = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP and set expiry (10 minutes)
  this.emailVerificationOTP = require('crypto')
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  this.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return otp;
};

// Verify email OTP
UserSchema.methods.verifyEmailOTP = function (otp) {
  if (!this.emailVerificationOTP || !this.emailVerificationOTPExpires) {
    return false;
  }
  
  if (this.emailVerificationOTPExpires < Date.now()) {
    return false;
  }
  
  const hashedOTP = require('crypto')
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  return hashedOTP === this.emailVerificationOTP;
};

// Clear email verification OTP
UserSchema.methods.clearEmailVerificationOTP = function () {
  this.emailVerificationOTP = undefined;
  this.emailVerificationOTPExpires = undefined;
};

// Generate password reset token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = require('crypto').randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Verify password reset token
UserSchema.methods.verifyResetPasswordToken = function (token) {
  if (!this.passwordResetToken || !this.passwordResetExpires) {
    return false;
  }
  
  if (this.passwordResetExpires < Date.now()) {
    return false;
  }
  
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return hashedToken === this.passwordResetToken;
};

// Clear password reset token
UserSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

// Update profile information
UserSchema.methods.updateProfile = function (profileData) {
  const allowedFields = ['name', 'bio', 'phone', 'dateOfBirth', 'gender', 'location'];
  
  Object.keys(profileData).forEach(key => {
    if (allowedFields.includes(key) && profileData[key] !== undefined) {
      this[key] = profileData[key];
    }
  });
};

// Update avatar
UserSchema.methods.updateAvatar = function (avatarUrl) {
  this.avatar = avatarUrl;
};

// Delete account (soft delete - mark as deleted but keep data for audit)
UserSchema.methods.deleteAccount = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.email = `deleted_${Date.now()}_${this.email}`;
};

// Provider management methods
UserSchema.methods.hasProvider = function (type, sub = null) {
  return this.providers.some(p => 
    p.type === type && (sub === null || p.sub === sub)
  );
};

UserSchema.methods.addProvider = function (providerData) {
  // Check if provider already exists
  const exists = this.providers.some(p => 
    p.type === providerData.type && 
    (providerData.sub ? p.sub === providerData.sub : true)
  );
  
  if (!exists) {
    this.providers.push({
      ...providerData,
      linkedAt: new Date()
    });
  }
  
  return !exists;
};

UserSchema.methods.removeProvider = function (type, sub = null) {
  const initialLength = this.providers.length;
  this.providers = this.providers.filter(p => 
    !(p.type === type && (sub === null || p.sub === sub))
  );
  return this.providers.length < initialLength;
};

UserSchema.methods.canRemoveProvider = function (type, sub = null) {
  // Can't remove the last provider
  if (this.providers.length <= 1) {
    return false;
  }
  
  // Check if this specific provider exists
  return this.providers.some(p => 
    p.type === type && (sub === null || p.sub === sub)
  );
};

UserSchema.methods.addEmail = function (email, verified = false) {
  // Check if email already exists
  const exists = this.emails.some(e => e.email === email);
  
  if (!exists) {
    this.emails.push({
      email: email.toLowerCase().trim(),
      verified,
      verifiedAt: verified ? new Date() : null,
      isPrimary: this.emails.length === 0
    });
  }
  
  return !exists;
};

UserSchema.methods.verifyEmail = function (email) {
  const emailEntry = this.emails.find(e => e.email === email);
  if (emailEntry && !emailEntry.verified) {
    emailEntry.verified = true;
    emailEntry.verifiedAt = new Date();
    return true;
  }
  return false;
};

UserSchema.methods.setPrimaryEmail = function (email) {
  // Remove primary flag from all emails
  this.emails.forEach(e => e.isPrimary = false);
  
  // Set new primary email
  const emailEntry = this.emails.find(e => e.email === email);
  if (emailEntry) {
    emailEntry.isPrimary = true;
    this.primaryEmail = email;
    return true;
  }
  return false;
};

UserSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.password;
  delete user.refreshTokens;
  delete user.emailVerificationOTP;
  delete user.emailVerificationOTPExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  
  return {
    ...user,
    hasPassword: this.hasProvider('password'),
    hasGoogle: this.hasProvider('google'),
    verifiedEmails: this.emails.filter(e => e.verified).map(e => e.email),
    providers: this.providers.map(p => ({
      type: p.type,
      linkedAt: p.linkedAt,
      ...(p.type === 'google' ? { email: p.email } : {})
    }))
  };
};

module.exports = mongoose.model('User', UserSchema);
