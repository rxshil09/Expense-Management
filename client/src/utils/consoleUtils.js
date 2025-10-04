// Utility to suppress expected authentication errors in development
export const suppressAuthErrors = () => {
  // Only suppress errors in development mode
  if (import.meta.env.DEV) {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      
      // Suppress expected authentication-related errors
      if (
        typeof message === 'string' && (
          message.includes('401 (Unauthorized)') ||
          message.includes('/api/auth/me') ||
          message.includes('/api/auth/refresh')
        )
      ) {
        return; // Don't log these expected errors in development
      }
      
      // Log all other errors normally
      originalError.apply(console, args);
    };
  }
  
  // In production, log all errors normally for proper monitoring
};
