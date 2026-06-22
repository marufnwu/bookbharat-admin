import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { toast } from '../utils/toast';

// Create single axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8000/api/v1/admin',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and network-level issues.
// HTTP error toasts (4xx/5xx) are intentionally NOT shown here to avoid
// duplicate toasts — each component handles its own error notifications.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 Unauthorized or 419 CSRF Token Expired — global concern
    if ((status === 401 || status === 419) && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth state and redirect to login
      useAuthStore.getState().logout();
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';

      return Promise.reject(error);
    }

    // Log server errors for debugging but do NOT show a toast
    // (components handle their own error messages)
    if (status && status >= 500) {
      console.error('Server Error:', error.response?.data?.message || error.message);
    }

    return Promise.reject(error);
  }
);

// Export strict alias if needed by other files, but prefer 'api'
export const axiosInstance = api;

export default api;