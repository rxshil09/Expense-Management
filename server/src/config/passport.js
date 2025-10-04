const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // User exists with Google ID, return user
        return done(null, user);
      }

      // Check if user exists with the same email
      user = await User.findOne({ 
        $or: [
          { primaryEmail: profile.emails[0].value },
          { 'emails.email': profile.emails[0].value }
        ]
      });

      if (user) {
        // User exists with email but no Google ID, link accounts
        user.googleId = profile.id;
        
        // Add Google provider if not already present
        const hasGoogleProvider = user.providers?.some(p => p.type === 'google');
        if (!hasGoogleProvider) {
          user.providers = user.providers || [];
          user.providers.push({
            type: 'google',
            sub: profile.id,
            email: profile.emails[0].value,
            emailVerifiedAt: new Date(),
            linkedAt: new Date()
          });
        }
        
        // Update primary email verification if this email matches
        if (user.primaryEmail === profile.emails[0].value) {
          user.emailVerified = true;
        }
        
        // Update emails array verification
        const emailEntry = user.emails?.find(e => e.email === profile.emails[0].value);
        if (emailEntry) {
          emailEntry.verified = true;
          emailEntry.verifiedAt = new Date();
        }
        
        await user.save();
        return done(null, user);
      }

      // Create new user
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value, // Set legacy email field
        primaryEmail: profile.emails[0].value,
        emails: [{
          email: profile.emails[0].value,
          verified: true,
          verifiedAt: new Date(),
          isPrimary: true
        }],
        providers: [{
          type: 'google',
          sub: profile.id,
          email: profile.emails[0].value,
          emailVerifiedAt: new Date(),
          linkedAt: new Date()
        }],
        emailVerified: true, // Google emails are verified
        avatar: profile.photos[0]?.value || null,
        provider: 'google'
      });

      await user.save();
      return done(null, user);

    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
