/**
 * Utility functions for error handling and formatting
 */

/**
 * Formats error messages for display to users
 * @param {Error|Object|string} error - The error to format
 * @returns {string} - A user-friendly error message
 */
export const formatError = (error) => {
  // If it's a string, return as is
  if (typeof error === 'string') {
    return error;
  }

  // If it's an object with a message property
  if (error && typeof error === 'object') {
    // Check for API error response format
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Check for error message property
    if (error.message) {
      return error.message;
    }
    
    // Check for error property
    if (error.error) {
      return typeof error.error === 'string' ? error.error : error.error.message;
    }
  }

  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Checks if an error is a network error
 * @param {Error|Object} error - The error to check
 * @returns {boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch') ||
    !navigator.onLine
  );
};

/**
 * Checks if an error is an authentication error
 * @param {Error|Object} error - The error to check
 * @returns {boolean} - True if it's an auth error
 */
export const isAuthError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

/**
 * Checks if an error is a validation error
 * @param {Error|Object} error - The error to check
 * @returns {boolean} - True if it's a validation error
 */
export const isValidationError = (error) => {
  const status = error?.response?.status;
  return status === 400 || status === 422;
};

/**
 * Gets error details for logging
 * @param {Error|Object} error - The error to extract details from
 * @returns {Object} - Error details object
 */
export const getErrorDetails = (error) => {
  return {
    message: formatError(error),
    status: error?.response?.status,
    code: error?.code,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  };
};
