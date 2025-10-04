import { getCookie } from './cookies';

const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }
}

export const api = new ApiClient();

// Convenience methods for common endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  list: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/users${query}`);
  },
  create: (userData: any) => api.post('/users', userData),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, userData: any) => api.patch(`/users/${id}`, userData),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const expensesApi = {
  list: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/expenses${query}`);
  },
  create: (expenseData: any) => api.post('/expenses', expenseData),
  get: (id: string) => api.get(`/expenses/${id}`),
  update: (id: string, expenseData: any) => api.patch(`/expenses/${id}`, expenseData),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  approve: (id: string, action: { status: string; comments?: string }) =>
    api.post(`/expenses/${id}/approve`, action),
};

export const companyApi = {
  get: () => api.get('/company'),
  update: (companyData: any) => api.patch('/company', companyData),
};

export const currencyApi = {
  latest: (base?: string) => {
    const query = base ? `?base=${base}` : '';
    return api.get(`/currency/latest${query}`);
  },
  convert: (from: string, to: string, amount: number) =>
    api.get(`/currency/convert?from=${from}&to=${to}&amount=${amount}`),
};

export const ocrApi = {
  parseReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.upload('/ocr', formData);
  },
};

export default api;