import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  // Initial state
  notifications: [],

  // Actions
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  showSuccess: (title, message = '') => {
    get().addNotification({
      type: 'success',
      title,
      message,
    });
  },

  showError: (title, message = '') => {
    get().addNotification({
      type: 'error',
      title,
      message,
      duration: 0, // Don't auto-dismiss errors
    });
  },

  showWarning: (title, message = '') => {
    get().addNotification({
      type: 'warning',
      title,
      message,
    });
  },

  showInfo: (title, message = '') => {
    get().addNotification({
      type: 'info',
      title,
      message,
    });
  },
}));