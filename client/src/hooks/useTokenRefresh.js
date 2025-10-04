import { useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import { authService } from '../services/authService';

// Hook to automatically refresh tokens before expiry
export const useTokenRefresh = () => {
  const { isAuthenticated, setUser, clearAuth } = useAuthStore();
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear any existing refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Function to refresh token
    const refreshToken = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success) {
          setUser(response.user);
        } else {
          clearAuth();
        }
      } catch (error) {
        if (error.response?.status === 401) {
          clearAuth();
        }
      }
    };

    // Set up token refresh interval (every 14 minutes)
    // JWT tokens typically expire in 15 minutes, so refresh 1 minute early
    refreshIntervalRef.current = setInterval(refreshToken, 14 * 60 * 1000);

    // Cleanup on unmount or when auth state changes
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, setUser, clearAuth]);

  // Also set up visibility change handler to refresh when user returns
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isAuthenticated) {
        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            setUser(response.user);
          } else {
            clearAuth();
          }
        } catch (error) {
          if (error.response?.status === 401) {
            clearAuth();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, setUser, clearAuth]);
};
