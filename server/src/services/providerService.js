const User = require('../models/User');

class ProviderService {
  constructor() {}

  async checkGoogleSubCollision(sub, excludeUserId = null) {
    const query = {
      'providers.type': 'google',
      'providers.sub': sub
    };
    
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.findOne(query);
    return existingUser;
  }

  async checkEmailCollision(email, excludeUserId = null) {
    const query = {
      'emails.email': email.toLowerCase(),
      'emails.verified': true
    };
    
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.findOne(query);
    return existingUser;
  }

  async findUserByGoogleSub(sub) {
    return await User.findOne({
      'providers.type': 'google',
      'providers.sub': sub
    });
  }

  async findUserByEmail(email) {
    return await User.findOne({
      'emails.email': email.toLowerCase()
    });
  }

  async findUserByLegacyEmail(email) {
    return await User.findOne({
      email: email.toLowerCase()
    });
  }

  async createUserFromGoogle(googleData) {
    const { sub, email, emailVerified, name, avatar } = googleData;
    
    // Determine primary email
    const primaryEmail = email || `google-${sub}@noemail.local`;
    
    const userData = {
      name,
      email: email, // Set legacy email field
      primaryEmail,
      avatar,
      providers: [{
        type: 'google',
        sub,
        email,
        emailVerifiedAt: emailVerified ? new Date() : null,
        linkedAt: new Date()
      }],
      emails: email ? [{
        email: email.toLowerCase(),
        verified: emailVerified,
        verifiedAt: emailVerified ? new Date() : null,
        isPrimary: true
      }] : [],
      emailVerified: emailVerified // Legacy support
    };

    const user = new User(userData);
    await user.save();
    return user;
  }

  async linkGoogleToUser(user, googleData) {
    const { sub, email, emailVerified } = googleData;
    
    // Add Google provider
    const providerAdded = user.addProvider({
      type: 'google',
      sub,
      email,
      emailVerifiedAt: emailVerified ? new Date() : null
    });

    if (!providerAdded) {
      throw new Error('Google account already linked');
    }

    // Handle email verification and addition
    if (email) {
      const existingEmail = user.emails.find(e => e.email === email.toLowerCase());
      
      if (existingEmail) {
        // Email exists, update verification status if Google says it's verified
        if (emailVerified && !existingEmail.verified) {
          user.verifyEmail(email);
        }
      } else {
        // Add new email
        user.addEmail(email, emailVerified);
      }
    }

    await user.save();
    return user;
  }

  async autoLinkGoogleByEmail(email, googleData) {
    // First check legacy email field
    let user = await this.findUserByLegacyEmail(email);
    
    // If not found, check new emails array
    if (!user) {
      user = await this.findUserByEmail(email);
    }

    if (user) {
      return await this.linkGoogleToUser(user, googleData);
    }

    return null;
  }

  validateUnlinkProvider(user, providerType, sub = null) {
    // Check if user has more than one provider
    if (user.providers.length <= 1) {
      return {
        canUnlink: false,
        reason: 'Cannot unlink the last authentication method. Please add another sign-in method first.'
      };
    }

    // Check if the specific provider exists
    const hasProvider = user.providers.some(p => 
      p.type === providerType && (sub === null || p.sub === sub)
    );

    if (!hasProvider) {
      return {
        canUnlink: false,
        reason: 'Provider not found or not linked to this account.'
      };
    }

    return {
      canUnlink: true,
      reason: null
    };
  }

  async unlinkProvider(user, providerType, sub = null) {
    const validation = this.validateUnlinkProvider(user, providerType, sub);
    
    if (!validation.canUnlink) {
      throw new Error(validation.reason);
    }

    const removed = user.removeProvider(providerType, sub);
    
    if (removed) {
      await user.save();
      return true;
    }

    return false;
  }

  // Migration helper for existing users
  async migrateExistingUser(user) {
    let needsSave = false;

    // Migrate email to new structure
    if (user.email && !user.primaryEmail) {
      user.primaryEmail = user.email;
      needsSave = true;

      // Add to emails array if not exists
      if (!user.emails.find(e => e.email === user.email)) {
        user.emails.push({
          email: user.email,
          verified: user.emailVerified || false,
          verifiedAt: user.emailVerified ? new Date() : null,
          isPrimary: true
        });
        needsSave = true;
      }
    }

    // Migrate providers
    if (user.googleId && !user.providers.find(p => p.type === 'google')) {
      user.providers.push({
        type: 'google',
        sub: user.googleId,
        email: user.email,
        emailVerifiedAt: user.emailVerified ? new Date() : null,
        linkedAt: user.createdAt || new Date()
      });
      needsSave = true;
    }

    // Migrate password
    if (user.password && !user.providers.find(p => p.type === 'password')) {
      user.providers.push({
        type: 'password',
        linkedAt: user.createdAt || new Date()
      });
      needsSave = true;
    }

    if (needsSave) {
      await user.save();
    }

    return user;
  }
}

module.exports = new ProviderService();
