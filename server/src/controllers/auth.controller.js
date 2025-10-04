// Authentication controller
const User = require('../models/User');
const { 
  generateTokenPair, 
  setTokenCookies, 
  clearTokenCookies, 
  verifyJWT 
} = require('../utils/jwt');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');
const googleVerification = require('../services/googleVerification');
const tokenService = require('../services/tokenService');
const providerService = require('../services/providerService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { primaryEmail: email.toLowerCase() },
        { 'emails.email': email.toLowerCase() }
      ]
    });
    
    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    let user;
    if (existingUser && !existingUser.emailVerified) {
      // Update existing unverified user
      user = existingUser;
      user.name = name;
      user.password = password;
      user.primaryEmail = email.toLowerCase();
    } else {
      // Create new user (not verified yet)
      user = new User({
        name,
        email: email.toLowerCase(), // Legacy field
        primaryEmail: email.toLowerCase(), // New field
        password,
        emailVerified: false,
        emails: [{
          email: email.toLowerCase(),
          verified: false,
          isPrimary: true
        }],
        providers: [{
          type: 'password',
          email: email.toLowerCase()
        }]
      });
    }

    // Generate and send OTP
    const otp = user.generateEmailVerificationOTP();
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, name);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: email,
      userId: user._id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    console.log('Login attempt for email:', email);

    // Find user by email (check both legacy email field and new emails array)
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { 'emails.email': email.toLowerCase() }
      ]
    }).select('+password +passwordHash');

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    console.log('User found:', {
      id: user._id,
      email: user.primaryEmail || user.email,
      hasPassword: !!user.password,
      hasPasswordHash: !!user.passwordHash,
      providers: user.providers?.map(p => p.type) || []
    });

    // Migrate existing user if needed
    await providerService.migrateExistingUser(user);

    // Check if user has password provider
    const hasPassword = user.hasProvider('password') || user.password || user.passwordHash;
    if (!hasPassword) {
      console.log('User has no password set');
      return res.status(400).json({
        success: false,
        code: 'PASSWORD_NOT_SET',
        message: 'Password not set for this account. Please use Google sign-in or set up a password.'
      });
    }

    // Check password (try both legacy and new password fields)
    let isPasswordMatch = false;
    if (user.password) {
      isPasswordMatch = await user.matchPassword(password);
      console.log('Password match result (new):', isPasswordMatch);
      
      // If new password field doesn't work, try comparing directly with bcrypt
      // (in case of hashing conflicts)
      if (!isPasswordMatch) {
        const bcrypt = require('bcryptjs');
        isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log('Direct password match result:', isPasswordMatch);
      }
    } 
    
    // If still no match and user has passwordHash, try that
    if (!isPasswordMatch && user.passwordHash) {
      const bcrypt = require('bcryptjs');
      isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
      console.log('Password match result (legacy):', isPasswordMatch);
    }

    if (!isPasswordMatch) {
      console.log('Password mismatch for user:', user._id);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if primary email is verified
    const primaryEmailEntry = user.emails.find(e => e.isPrimary) || 
                             user.emails.find(e => e.email === user.primaryEmail);
    
    const isEmailVerified = user.emailVerified || (primaryEmailEntry && primaryEmailEntry.verified);
    
    if (!isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before logging in',
        emailVerificationRequired: true,
        email: user.primaryEmail || user.email,
      });
    }

    // Clean expired tokens
    await user.cleanExpiredTokens();

    // Generate token pair using new service
    const tokens = await tokenService.issueTokens(user._id, rememberMe);

    // Set cookies
    tokenService.setTokenCookies(res, tokens, rememberMe);

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.primaryEmail || user.email, // Use primaryEmail first, fallback to legacy email
        primaryEmail: user.primaryEmail,
        providers: user.providers || [],
        emails: user.emails || [],
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        location: user.location,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check remember me status
    const rememberMe = req.cookies.rememberMe === 'true';

    // Generate new token pair
    const tokens = generateTokenPair(user._id, rememberMe);
    
    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiry);

    // Set new cookies
    setTokenCookies(res, tokens, rememberMe);

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken && req.user) {
      // Remove refresh token from database
      const user = await User.findById(req.user._id);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }

    // Clear cookies
    clearTokenCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, otp, rememberMe = false } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    // Find user with OTP fields
    const user = await User.findOne({ email })
      .select('+emailVerificationOTP +emailVerificationOTPExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Verify OTP
    if (!user.verifyEmailOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    // Mark email as verified and clear OTP
    user.emailVerified = true;
    user.clearEmailVerificationOTP();
    await user.save();

    // Generate token pair
    const tokens = generateTokenPair(user._id, rememberMe);
    
    // Store refresh token in database
    await user.addRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiry);

    // Set cookies
    setTokenCookies(res, tokens, rememberMe);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
    });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Generate new OTP
    const otp = user.generateEmailVerificationOTP();
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP resend',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email (check both legacy email field and new emails array)
    const user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { 'emails.email': email.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address',
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.name);
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      // Clear reset token if email fails
      user.clearPasswordResetToken();
      await user.save();
      
      console.error('Failed to send password reset email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again.',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to match the stored hash
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this reset token and ensure it's not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires +password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.clearPasswordResetToken();

    // Ensure the user has proper email structure
    if (!user.emails || user.emails.length === 0) {
      const userEmail = user.primaryEmail || user.email;
      user.emails = [{
        email: userEmail,
        verified: true,
        isPrimary: true
      }];
      user.primaryEmail = userEmail;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
    });
  }
};

// @desc    Google OAuth login
// @route   GET /api/auth/google
// @access  Public
const googleAuth = (req, res, next) => {
  const passport = require('passport');
  
  // Store the action (login or link) in session for callback
  if (req.query.action === 'link') {
    req.session.oauthAction = 'link';
  } else {
    req.session.oauthAction = 'login';
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res, next) => {
  const passport = require('passport');
  
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        console.error('Google OAuth error:', err);
        const action = req.session.oauthAction || 'login';
        const redirectUrl = action === 'link' ? '/profile' : '/login';
        return res.redirect(`${process.env.CLIENT_URL}${redirectUrl}?error=oauth_error`);
      }

      if (!user) {
        console.log('No user returned from Google OAuth');
        const action = req.session.oauthAction || 'login';
        const redirectUrl = action === 'link' ? '/profile' : '/login';
        return res.redirect(`${process.env.CLIENT_URL}${redirectUrl}?error=oauth_failed`);
      }

      // Check if this is a linking action
      if (req.session.oauthAction === 'link') {
        // Clear the action from session
        delete req.session.oauthAction;
        
        // For linking, we need to get the current user from cookies
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
          return res.redirect(`${process.env.CLIENT_URL}/profile?error=not_authenticated`);
        }

        // Find current user by refresh token
        const currentUser = await User.findOne({
          'refreshTokens.token': refreshToken,
          'refreshTokens.expiresAt': { $gt: new Date() }
        });

        if (!currentUser) {
          return res.redirect(`${process.env.CLIENT_URL}/profile?error=session_expired`);
        }

        // Check if Google account is already linked to someone else
        const existingGoogleUser = await User.findOne({
          'providers.type': 'google',
          'providers.sub': user.googleId || info?.profile?.id,
          '_id': { $ne: currentUser._id }
        });

        if (existingGoogleUser) {
          return res.redirect(`${process.env.CLIENT_URL}/profile?error=google_already_linked`);
        }

        // Link Google account to current user
        try {
          // Remove Google provider if it already exists on current user
          currentUser.providers = currentUser.providers.filter(p => p.type !== 'google');
          
          // Add Google provider
          currentUser.providers.push({
            type: 'google',
            sub: user.googleId || info?.profile?.id,
            email: user.email || info?.profile?.emails?.[0]?.value,
            emailVerifiedAt: new Date(),
            linkedAt: new Date()
          });

          // Also store googleId for legacy compatibility
          currentUser.googleId = user.googleId || info?.profile?.id;

          await currentUser.save();
          
          return res.redirect(`${process.env.CLIENT_URL}/profile?linked=google`);
        } catch (linkError) {
          console.error('Google linking error:', linkError);
          return res.redirect(`${process.env.CLIENT_URL}/profile?error=link_failed`);
        }
      }

      // Regular login flow
      // Generate JWT tokens
      const tokens = generateTokenPair(user._id);

      // Store refresh token
      user.refreshTokens.push({
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      await user.save();

      // Set tokens in cookies
      setTokenCookies(res, tokens);

      // Redirect to client with success
      res.redirect(`${process.env.CLIENT_URL}/dashboard?auth=success`);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  })(req, res, next);
};

// @desc    Verify Google ID Token (new provider-based flow)
// @route   POST /api/auth/google/verify
// @access  Public
const googleVerify = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify Google ID token
    const googleData = await googleVerification.verifyAndExtractClaims(idToken);
    const { sub, email, emailVerified, name, avatar } = googleData;

    // Check if user exists with this Google sub
    let user = await providerService.findUserByGoogleSub(sub);

    if (user) {
      // User exists with Google ID, sign them in
      await providerService.migrateExistingUser(user);
      const tokens = await tokenService.issueTokens(user._id);
      tokenService.setTokenCookies(res, tokens);

      return res.json({
        success: true,
        message: 'Signed in successfully',
        user: user.getPublicProfile(),
        accessToken: tokens.accessToken
      });
    }

    // Check if user exists with this email (auto-link if email is verified)
    if (email && emailVerified) {
      user = await providerService.autoLinkGoogleByEmail(email, googleData);
      
      if (user) {
        // Auto-linked existing user
        const tokens = await tokenService.issueTokens(user._id);
        tokenService.setTokenCookies(res, tokens);

        return res.json({
          success: true,
          message: 'Google account linked and signed in successfully',
          user: user.getPublicProfile(),
          accessToken: tokens.accessToken
        });
      }
    }

    // Create new user
    user = await providerService.createUserFromGoogle(googleData);
    const tokens = await tokenService.issueTokens(user._id);
    tokenService.setTokenCookies(res, tokens);

    res.status(201).json({
      success: true,
      message: 'Account created and signed in successfully',
      user: user.getPublicProfile(),
      accessToken: tokens.accessToken
    });

  } catch (error) {
    console.error('Google verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Google authentication failed'
    });
  }
};

// @desc    Link Google account to existing user
// @route   POST /api/auth/providers/link/google
// @access  Private
const linkGoogle = async (req, res) => {
  try {
    console.log('=== GOOGLE LINK REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);
    
    const { idToken } = req.body;
    const userId = req.user.id;

    if (!idToken) {
      console.log('Missing ID token');
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify Google ID token
    console.log('Verifying Google ID token...');
    const googleData = await googleVerification.verifyAndExtractClaims(idToken);
    console.log('Google data extracted:', { sub: googleData.sub, email: googleData.email, emailVerified: googleData.emailVerified });
    
    const { sub, email, emailVerified } = googleData;

    // Check for collisions
    const googleSubCollision = await providerService.checkGoogleSubCollision(sub, userId);
    if (googleSubCollision) {
      return res.status(409).json({
        success: false,
        code: 'GOOGLE_ACCOUNT_ALREADY_LINKED',
        message: 'This Google account is already linked to another user'
      });
    }

    if (email && emailVerified) {
      const emailCollision = await providerService.checkEmailCollision(email, userId);
      if (emailCollision) {
        return res.status(409).json({
          success: false,
          code: 'EMAIL_ALREADY_VERIFIED_ELSEWHERE',
          message: 'This email is already verified on another account'
        });
      }
    }

    // Get current user and link Google account
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await providerService.linkGoogleToUser(user, googleData);

    // Issue new tokens (rotation)
    const tokens = await tokenService.issueTokens(user._id);
    tokenService.setTokenCookies(res, tokens);

    res.json({
      success: true,
      message: 'Google account linked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.primaryEmail || user.email,
        primaryEmail: user.primaryEmail,
        providers: user.providers || [],
        emails: user.emails || [],
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        location: user.location,
        createdAt: user.createdAt,
      },
      accessToken: tokens.accessToken
    });

  } catch (error) {
    console.error('Google linking error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to link Google account'
    });
  }
};

// @desc    Unlink provider from user account
// @route   DELETE /api/auth/providers/:type
// @access  Private
const unlinkProvider = async (req, res) => {
  try {
    const { type } = req.params;
    const { sub } = req.query; // For Google, pass the sub ID
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await providerService.unlinkProvider(user, type, sub);

    res.json({
      success: true,
      message: `${type} provider unlinked successfully`,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Provider unlink error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to unlink provider'
    });
  }
};

module.exports = {
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
  unlinkProvider,
};
