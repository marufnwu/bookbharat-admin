import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

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

// Response interceptor to handle auth errors and global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 Unauthorized or 419 CSRF Token Expired
    if ((status === 401 || status === 419) && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth state and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');

      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (status === 403) {
      toast.error('You do not have permission to perform this action.');
      return Promise.reject(error);
    }

    // Handle 500+ Server Errors - show error toast but do NOT log out
    // Use optional chaining defensively in case response is malformed
    if (status && status >= 500) {
      toast.error('A server error occurred. Please try again later.');
      console.error('Server Error:', error.response?.data?.message || error.message);
      return Promise.reject(error);
    }

    // Handle 400-499 Client Errors - show error toast, do NOT log out
    if (status && status >= 400 && status < 500) {
      const message = error.response?.data?.message || 'An error occurred.';
      toast.error(message);
      return Promise.reject(error);
    }

    // Handle Network Errors (no response received) - show error toast but do NOT log out
    // We intentionally do NOT log out on network errors since they don't indicate auth failures
    if (!error.response && error.request) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle any other errors (fallback)
    if (!error.response) {
      toast.error('An unexpected error occurred. Please try again.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Export strict alias if needed by other files, but prefer 'api'
export const axiosInstance = api;

export default api;