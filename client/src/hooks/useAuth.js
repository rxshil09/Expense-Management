import { useEffect } from 'react';
import { useQuery } from 'react-query';
import useAuthStore from '../stores/authStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth, setLoading } = useAuthStore();

  const { data, isLoading, error } = useQuery(
    'currentUser',
    authService.getCurrentUser,
    {
      enabled: !!localStorage.getItem('token') && !user,
      retry: false,
    }
  );

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data) {
      setAuth(data.user, localStorage.getItem('token'));
    } else if (error) {
      clearAuth();
      localStorage.removeItem('token');
    }
  }, [data, error, setAuth, clearAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
};
