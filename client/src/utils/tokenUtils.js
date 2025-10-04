// Token refresh utility
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create a separate axios instance for refresh requests to avoid circular dependency
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const refreshAccessToken = async () => {
  const response = await refreshApi.post('/api/auth/refresh');
  return response.data;
};
