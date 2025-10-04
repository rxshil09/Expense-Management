const { OAuth2Client } = require('google-auth-library');

class GoogleVerificationService {
  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyIdToken(idToken, options = {}) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: options.audience || process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      // Verify issuer
      if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
        throw new Error('Invalid issuer');
      }

      // Check nonce if provided
      if (options.nonce && payload.nonce !== options.nonce) {
        throw new Error('Invalid nonce');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
        locale: payload.locale,
        aud: payload.aud,
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      throw new Error(`Google ID token verification failed: ${error.message}`);
    }
  }

  async verifyAndExtractClaims(idToken, options = {}) {
    const claims = await this.verifyIdToken(idToken, options);
    
    return {
      sub: claims.sub,
      email: claims.email || null,
      emailVerified: claims.email_verified === true,
      name: claims.name || `${claims.given_name || ''} ${claims.family_name || ''}`.trim(),
      avatar: claims.picture || null
    };
  }
}

module.exports = new GoogleVerificationService();
