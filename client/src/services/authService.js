import api from '../config/api';

export const authService = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Refresh access token
  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post(`/api/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  },

  // Verify email OTP
  verifyEmail: async (data) => {
    const response = await api.post('/api/auth/verify-email', data);
    return response.data;
  },

  // Resend OTP
  resendOTP: async (data) => {
    const response = await api.post('/api/auth/resend-otp', data);
    return response.data;
  },

  // Profile Management
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/api/users/profile', profileData);
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await api.post('/api/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAvatar: async () => {
    const response = await api.delete('/api/users/avatar');
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/api/users/change-password', passwordData);
    return response.data;
  },

  deleteAccount: async (password) => {
    const response = await api.delete('/api/users/account', {
      data: { password },
    });
    return response.data;
  },
};
