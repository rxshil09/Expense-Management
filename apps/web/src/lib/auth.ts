'use client';

import { useState, useEffect } from 'react';
import { api, authApi } from './api';
import { User } from '@expense-mgmt/shared';
import { useRouter } from 'next/navigation';

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated by calling /api/auth/me
    authApi.me()
      .then(response => {
        if (response.success && response.data) {
          setUser(response.data);
        }
      })
      .catch(() => {
        // User is not authenticated
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await authApi.login(data);
      
      if (!response.success || !response.data) {
        throw new Error('Login failed');
      }
      
      const { user, token } = response.data;
      setUser(user);
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    // The logout will clear the HTTP-only cookie
    authApi.logout().finally(() => {
      router.push('/(auth)/login');
    });
  };

  const register = async (data: any): Promise<AuthResponse> => {
    try {
      // Register endpoint would be implemented similarly
      const response = await api.post('/auth/register', data);
      
      if (!response.success || !response.data) {
        throw new Error('Registration failed');
      }
      
      const { user, token } = response.data;
      setUser(user);
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
}