import toast from 'react-hot-toast';

// Common toast utility for consistent notifications across the admin UI
export const showToast = {
  success: (message: string, options?: any) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  error: (message: string, options?: any) => {
    return toast.error(message, {
      duration: 6000,
      position: 'top-right',
      ...options
    });
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      position: 'top-right',
      ...options
    });
  },

  info: (message: string, options?: any) => {
    return toast(message, {
      icon: 'ℹ️',
      duration: 4000,
      position: 'top-right',
      ...options
    });
  },

  warning: (message: string, options?: any) => {
    return toast(message, {
      icon: '⚠️',
      duration: 5000,
      position: 'top-right',
      ...options
    });
  },

  // Dismiss all toasts
  dismiss: () => {
    toast.dismiss();
  },

  // Dismiss specific toast
  dismissToast: (toastId: string) => {
    toast.dismiss(toastId);
  }
};

export default showToast;