import reactHotToast from 'react-hot-toast';

// Stable ID from message string — ensures the same message replaces rather than stacks
const toId = (msg: string): string => {
  let hash = 0;
  for (let i = 0; i < msg.length; i++) {
    const ch = msg.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return `t-${Math.abs(hash).toString(36)}`;
};

// Drop-in replacement for react-hot-toast's toast object.
// Auto-adds a message-based `id` so the same message replaces
// instead of stacking a new visible toast.
// If the caller already supplies an `id`, it is preserved.
const toast = Object.assign(
  (message: string, options?: any) => {
    return reactHotToast(message, {
      id: toId(message),
      ...options,
    });
  },
  {
    success: (message: string, options?: any) => {
      return reactHotToast.success(message, {
        id: toId(message),
        ...options,
      });
    },
    error: (message: string, options?: any) => {
      return reactHotToast.error(message, {
        id: toId(message),
        duration: 6000,
        ...options,
      });
    },
    loading: (message: string, options?: any) => {
      return reactHotToast.loading(message, options);
    },
    dismiss: (id?: string) => {
      reactHotToast.dismiss(id);
    },
    remove: (id?: string) => {
      (reactHotToast as any).remove?.(id);
    },
    promise: reactHotToast.promise,
  }
);

export { toast };

// Named convenience helpers (unchanged API)
export const showToast = {
  success: (message: string, options?: any) =>
    toast.success(message, { duration: 4000, position: 'top-right', ...options }),

  error: (message: string, options?: any) =>
    toast.error(message, { duration: 6000, position: 'top-right', ...options }),

  loading: (message: string, options?: any) =>
    toast.loading(message, { position: 'top-right', ...options }),

  info: (message: string, options?: any) =>
    toast(message, { icon: 'ℹ️', duration: 4000, position: 'top-right', ...options }),

  warning: (message: string, options?: any) =>
    toast(message, { icon: '⚠️', duration: 5000, position: 'top-right', ...options }),

  dismiss: () => toast.dismiss(),
  dismissToast: (toastId: string) => toast.dismiss(toastId),
};

export default showToast;
