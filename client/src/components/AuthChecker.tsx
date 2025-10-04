import React, { useEffect, useState, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import api from '../config/api';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

const AuthChecker = ({ children }) => {
  const { isAuthenticated, setUser, clearAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedRef = useRef(false);
  const checkTimeoutRef = useRef(null);

  // Use token refresh hook for automatic token management
  useTokenRefresh();

  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (hasCheckedRef.current) {
        setIsChecking(false);
        return;
      }

      // Clear any existing timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      hasCheckedRef.current = true;
      setIsChecking(true);

      try {
        // Try to get current user (works with both localStorage tokens and cookies)
        const response = await api.get('/api/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          // No valid authentication found
          clearAuth();
        }
      } catch (error: any) {
        // Handle authentication errors gracefully
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token expired or invalid, or no token - clear auth state
          clearAuth();
        } else {
          // Only log unexpected errors, not authentication failures
          console.error('Unexpected error during auth check:', error);
          // Network or other errors - don't clear auth immediately
          console.warn('Auth check failed due to network error:', error.message);
          
          // Retry after a delay for network errors
          checkTimeoutRef.current = setTimeout(() => {
            hasCheckedRef.current = false;
            checkAuth();
          }, 5000) as any;
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();

    // Cleanup timeout on unmount
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Show loading state during initial auth check
  if (isChecking && hasCheckedRef.current === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthChecker;
