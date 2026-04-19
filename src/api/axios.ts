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

    // Handle 401 Unauthorized or 419 CSRF Token Expired
    const status = error.response?.status;
    if ((status === 401 || status === 419) && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth state and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');

      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      toast.error('A server error occurred. Please try again later.');
      console.error('Server Error:', error.response?.data?.message || error.message);
    }

    // Handle Network Errors (includes CORS-blocked responses)
    if (!error.response && error.request) {
      // If authenticated, session likely expired and server returned error without CORS headers
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (isAuthenticated) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
    }

    return Promise.reject(error);
  }
);

// Export strict alias if needed by other files, but prefer 'api'
export const axiosInstance = api;

export default api;