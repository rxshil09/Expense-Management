import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Set user and token
      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
        // Also store token in localStorage for axios interceptor
        if (token) {
          localStorage.setItem('token', token);
        }
      },

      // Login method (alias for setAuth for better semantics)
      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
        // Also store token in localStorage for axios interceptor
        if (token) {
          localStorage.setItem('token', token);
        }
      },

      // Set user only (for refresh scenarios)
      setUser: (user) => {
        set((state) => ({
          user,
          isAuthenticated: !!user,
        }));
      },

      // Clear auth state
      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        // Also clear from localStorage
        localStorage.removeItem('token');
      },

      // Set loading state
      setLoading: (isLoading) => set({ isLoading }),

      // Update user data
      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export default useAuthStore;
