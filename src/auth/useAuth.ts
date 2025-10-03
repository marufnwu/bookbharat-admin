import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { authApi } from '../api';
import { LoginCredentials } from '../types';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setLoading,
    setError
  } = useAuthStore();

  const { showSuccess, showError } = useNotificationStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (response) => {
      login(response.data.user, response.data.token);
      showSuccess('Welcome back!', 'You have been successfully logged in.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      showError('Login Failed', message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      showSuccess('Logged out', 'You have been successfully logged out.');
    },
    onError: () => {
      // Even if the API call fails, we should still log out locally
      logout();
    },
  });

  // Get current user query
  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleLogin = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const checkAuth = () => {
    if (token && !user) {
      refetchUser();
    }
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    error,

    // Actions
    login: handleLogin,
    logout: handleLogout,
    checkAuth,
    refetchUser,

    // Mutation states
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
};