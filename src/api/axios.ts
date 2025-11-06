import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8000/api/v1/admin',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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
axiosInstance.interceptors.request.use(
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

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth state and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';

      return Promise.reject(error);
    }

    // Handle other error cases
    if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.error('Insufficient permissions');
    }

    if (error.response?.status >= 500) {
      // Server error
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

// Also add interceptors to the original api instance
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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear auth state and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';

      return Promise.reject(error);
    }

    // Handle other error cases
    if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.error('Insufficient permissions');
    }

    if (error.response?.status >= 500) {
      // Server error
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

export default api;