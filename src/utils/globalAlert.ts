/**
 * Global alert replacement using react-hot-toast
 * This utility can be imported anywhere to replace native alert() calls
 *
 * Usage:
 * import { showAlert } from '../utils/globalAlert';
 *
 * // Replaces alert('Error message')
 * showAlert.error('Error message');
 *
 * // Replaces alert('Success message')
 * showAlert.success('Success message');
 */

import { showToast } from './toast';

// Global alert object that mimics alert() behavior but uses toast
export const showAlert = {
  // Replaces alert('message') - default to error type for critical alerts
  error: (message: string) => {
    console.warn('Alert replaced with toast:', message);
    showToast.error(message);
  },

  // Replaces alert() for success messages
  success: (message: string) => {
    console.info('Alert replaced with toast:', message);
    showToast.success(message);
  },

  // Replaces alert() for warning messages
  warning: (message: string) => {
    console.warn('Alert replaced with toast:', message);
    showToast.warning(message);
  },

  // Replaces alert() for info messages
  info: (message: string) => {
    console.info('Alert replaced with toast:', message);
    showToast.info(message);
  }
};

// Override the global alert function (optional - use with caution)
export const overrideGlobalAlert = () => {
  // Store original alert
  const originalAlert = window.alert;

  // Override alert function
  window.alert = (message: any) => {
    console.warn('Native alert() called, showing as toast instead:', message);
    showAlert.error(String(message));
  };

  // Return function to restore original alert
  return () => {
    window.alert = originalAlert;
  };
};

export default showAlert;