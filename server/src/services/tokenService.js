const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

class TokenService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  }

  generateAccessToken(userId) {
    return jwt.sign({ id: userId }, this.jwtSecret, { 
      expiresIn: this.accessTokenExpiry 
    });
  }

  generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async issueTokens(userId, rememberMe = false) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : this.refreshTokenExpiry));

    // Store refresh token in user document
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.addRefreshToken(refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  async rotateRefreshToken(oldRefreshToken) {
    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': oldRefreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      // Check if token exists but is expired or revoked
      const tokenOwner = await User.findOne({
        'refreshTokens.token': oldRefreshToken
      });

      if (tokenOwner) {
        // Token reuse detected - revoke all tokens for this user
        await this.revokeAllTokens(tokenOwner._id);
        throw new Error('Token reuse detected - all sessions revoked');
      }

      throw new Error('Invalid refresh token');
    }

    // Remove old refresh token
    await user.removeRefreshToken(oldRefreshToken);

    // Issue new tokens
    return await this.issueTokens(user._id);
  }

  async revokeRefreshToken(refreshToken) {
    const user = await User.findOne({
      'refreshTokens.token': refreshToken
    });

    if (user) {
      await user.removeRefreshToken(refreshToken);
      return true;
    }

    return false;
  }

  async revokeAllTokens(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
      return true;
    }
    return false;
  }

  setTokenCookies(res, tokens, rememberMe = false) {
    const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes
    const refreshTokenMaxAge = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 7 * 24 * 60 * 60 * 1000;  // 7 days

    // Set access token cookie
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: accessTokenMaxAge
    });

    // Set refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: refreshTokenMaxAge
    });

    // Set remember me flag
    res.cookie('rememberMe', rememberMe.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: refreshTokenMaxAge
    });
  }

  clearTokenCookies(res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('rememberMe');
  }
}

module.exports = new TokenService();
