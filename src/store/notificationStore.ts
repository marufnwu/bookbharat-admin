import { create } from 'zustand';
import { toast } from 'react-hot-toast';

interface NotificationStore {
  notifications: never[];
  addNotification: () => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
}

// Stub notification store - notifications system has been removed
// Redirecting to react-hot-toast for backwards compatibility
export const useNotificationStore = create<NotificationStore>(() => ({
  notifications: [],
  addNotification: () => {
    console.warn('Notification system has been removed');
  },
  showSuccess: (title: string, message?: string) => {
    toast.success(`${title}${message ? `: ${message}` : ''}`);
  },
  showError: (title: string, message?: string) => {
    toast.error(`${title}${message ? `: ${message}` : ''}`);
  },
}));
