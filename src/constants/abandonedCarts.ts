/**
 * Constants for the abandoned carts system
 * Replaces magic numbers with meaningful constants
 */

// Recovery rate thresholds
export const RECOVERY_RATE_THRESHOLDS = {
  EXCELLENT: 50,
  GOOD: 20,
  NEEDS_ATTENTION: 0,
} as const;

// Urgency level thresholds (could be based on probability scores)
export const URGENCY_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 40,
  LOW: 20,
} as const;

// Cart value thresholds
export const CART_VALUE_THRESHOLDS = {
  LOW: 1000,
  MEDIUM: 3000,
  HIGH: 5000,
  VERY_HIGH: 10000,
} as const;

// Pagination
export const PAGINATION = {
  MIN_ITEMS_PER_PAGE: 10,
  DEFAULT_ITEMS_PER_PAGE: 20,
  MAX_ITEMS_PER_PAGE: 100,
  VISIBLE_PAGES: 7,
} as const;

// UI timing
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Discount defaults
export const DISCOUNT_DEFAULTS = {
  VALID_DAYS: 7,
  MIN_PERCENTAGE: 5,
  MAX_PERCENTAGE: 50,
  MIN_FIXED_AMOUNT: 50,
  MAX_FIXED_AMOUNT: 2000,
} as const;

// Color palette
export const COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#8b5cf6',
  PURPLE: '#ec4899',
  CYAN: '#14b8a6',
  ORANGE: '#f97316',
  PINK: '#ec4899',
  INDIGO: '#6366f1',
  GRAY: '#6b7280',
  GREEN: '#22c55e',
  RED: '#ef4444',
  BLUE: '#3b82f6',
  YELLOW: '#eab308',
} as const;

// Device type labels
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  UNKNOWN: 'unknown',
} as const;

// Customer segment labels
export const CUSTOMER_SEGMENTS = {
  VIP: 'vip',
  HIGH_VALUE: 'high_value',
  REPEAT: 'repeat',
  REGULAR: 'regular',
  NEW: 'new',
} as const;

// Recovery status
export const RECOVERY_STATUS = {
  NEW: 'new',
  ABANDONED: 'abandoned',
  RECOVERED: 'recovered',
  EXPIRED: 'expired',
  PENDING: 'pending',
} as const;

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Time periods for analytics
export const TIME_PERIODS = {
  LAST_24_HOURS: '24h',
  LAST_7_DAYS: '7d',
  LAST_30_DAYS: '30d',
  LAST_90_DAYS: '90d',
  LAST_YEAR: '1y',
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  DISCOUNT_GENERATED: 'Discount generated successfully',
  TEMPLATE_APPLIED: 'Template applied successfully',
  EMAIL_SENT: 'Recovery email sent',
  CART_MARKED_RECOVERED: 'Cart marked as recovered',
  BULK_ACTION_SUCCESS: 'Bulk operation completed successfully',
  OPERATION_FAILED: 'Operation failed',
  NETWORK_ERROR: 'Network error occurred',
  VALIDATION_ERROR: 'Please check your input',
  AUTH_ERROR: 'Authentication required',
} as const;

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// Export types for TypeScript
export type RecoveryRateThreshold = typeof RECOVERY_RATE_THRESHOLDS[keyof typeof RECOVERY_RATE_THRESHOLDS];
export type CartValueThreshold = typeof CART_VALUE_THRESHOLDS[keyof typeof CART_VALUE_THRESHOLDS];
export type CustomerSegment = typeof CUSTOMER_SEGMENTS[keyof typeof CUSTOMER_SEGMENTS];
export type RecoveryStatus = typeof RECOVERY_STATUS[keyof typeof RECOVERY_STATUS];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];
export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];