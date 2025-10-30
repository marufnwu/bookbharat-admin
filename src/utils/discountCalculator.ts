/**
 * Centralized discount calculation utilities
 * Ensures consistent discount logic across the abandoned carts system
 */

export interface DiscountOptions {
  cartValue?: number;
  customerSegment?: string;
  isVip?: boolean;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  defaultPercentage?: number;
  defaultFixed?: number;
}

export interface DiscountCalculation {
  type: 'percentage' | 'fixed';
  value: number;
  reasoning: string;
}

/**
 * Constants for discount calculations
 */
export const DISCOUNT_THRESHOLDS = {
  HIGH_VALUE_CART: 5000,
  VERY_HIGH_VALUE_CART: 10000,
  MAX_PERCENTAGE: 50,
  MIN_PERCENTAGE: 5,
  MAX_FIXED_AMOUNT: 2000,
  MIN_FIXED_AMOUNT: 50,
} as const;

export const CUSTOMER_SEGMENTS = {
  VIP: 'vip',
  HIGH_VALUE: 'high_value',
  REPEAT: 'repeat',
  REGULAR: 'regular',
  NEW: 'new',
} as const;

export const DEFAULT_DISCOUNTS = {
  [CUSTOMER_SEGMENTS.VIP]: { percentage: 20, fixed: 500 },
  [CUSTOMER_SEGMENTS.HIGH_VALUE]: { percentage: 15, fixed: 300 },
  [CUSTOMER_SEGMENTS.REPEAT]: { percentage: 12, fixed: 200 },
  [CUSTOMER_SEGMENTS.REGULAR]: { percentage: 10, fixed: 100 },
  [CUSTOMER_SEGMENTS.NEW]: { percentage: 15, fixed: 250 },
} as const;

/**
 * Calculate appropriate discount based on cart and customer data
 */
export function calculateDiscount(options: DiscountOptions = {}): DiscountCalculation {
  const {
    cartValue = 0,
    customerSegment = CUSTOMER_SEGMENTS.REGULAR,
    isVip = false,
    urgency = 'medium',
    defaultPercentage = 10,
    defaultFixed = 100,
  } = options;

  // Determine if this is a high-value cart
  const isHighValue = cartValue >= DISCOUNT_THRESHOLDS.HIGH_VALUE_CART;
  const isVeryHighValue = cartValue >= DISCOUNT_THRESHOLDS.VERY_HIGH_VALUE_CART;

  // Get base discount from customer segment or VIP status
  let basePercentage = defaultPercentage;
  let baseFixed = defaultFixed;

  if (isVip) {
    basePercentage = DEFAULT_DISCOUNTS[CUSTOMER_SEGMENTS.VIP].percentage;
    baseFixed = DEFAULT_DISCOUNTS[CUSTOMER_SEGMENTS.VIP].fixed;
  } else if (customerSegment in DEFAULT_DISCOUNTS) {
    basePercentage = DEFAULT_DISCOUNTS[customerSegment as keyof typeof DEFAULT_DISCOUNTS].percentage;
    baseFixed = DEFAULT_DISCOUNTS[customerSegment as keyof typeof DEFAULT_DISCOUNTS].fixed;
  }

  // Adjust for cart value
  if (isVeryHighValue) {
    basePercentage = Math.min(basePercentage + 10, DISCOUNT_THRESHOLDS.MAX_PERCENTAGE);
    baseFixed = Math.min(baseFixed + 200, DISCOUNT_THRESHOLDS.MAX_FIXED_AMOUNT);
  } else if (isHighValue) {
    basePercentage = Math.min(basePercentage + 5, DISCOUNT_THRESHOLDS.MAX_PERCENTAGE);
    baseFixed = Math.min(baseFixed + 100, DISCOUNT_THRESHOLDS.MAX_FIXED_AMOUNT);
  }

  // Adjust for urgency
  switch (urgency) {
    case 'critical':
      basePercentage = Math.min(basePercentage + 10, DISCOUNT_THRESHOLDS.MAX_PERCENTAGE);
      break;
    case 'high':
      basePercentage = Math.min(basePercentage + 5, DISCOUNT_THRESHOLDS.MAX_PERCENTAGE);
      break;
    case 'low':
      basePercentage = Math.max(basePercentage - 3, DISCOUNT_THRESHOLDS.MIN_PERCENTAGE);
      break;
  }

  // Decide between percentage and fixed based on cart value
  const usePercentage = cartValue < 1000 || (basePercentage / 100) * cartValue > baseFixed;

  const reasoning = generateReasoning({
    cartValue,
    customerSegment,
    isVip,
    urgency,
    usePercentage,
    finalValue: usePercentage ? basePercentage : baseFixed,
  });

  return {
    type: usePercentage ? 'percentage' : 'fixed',
    value: usePercentage ? basePercentage : baseFixed,
    reasoning,
  };
}

/**
 * Generate human-readable reasoning for discount calculation
 */
function generateReasoning(params: {
  cartValue: number;
  customerSegment: string;
  isVip: boolean;
  urgency: string;
  usePercentage: boolean;
  finalValue: number;
}): string {
  const reasons = [];

  if (params.isVip) {
    reasons.push('VIP customer');
  }

  if (params.cartValue >= DISCOUNT_THRESHOLDS.VERY_HIGH_VALUE_CART) {
    reasons.push('very high-value cart');
  } else if (params.cartValue >= DISCOUNT_THRESHOLDS.HIGH_VALUE_CART) {
    reasons.push('high-value cart');
  }

  if (params.urgency === 'critical') {
    reasons.push('critical urgency');
  } else if (params.urgency === 'high') {
    reasons.push('high urgency');
  }

  if (params.customerSegment !== CUSTOMER_SEGMENTS.REGULAR) {
    reasons.push(`${params.customerSegment} segment`);
  }

  const discountType = params.usePercentage ? 'percentage' : 'fixed amount';
  const valueText = params.usePercentage ? `${params.finalValue}%` : `₹${params.finalValue}`;

  return `${valueText} discount for ${reasons.join(', ')}`;
}

/**
 * Validate discount parameters
 */
export function validateDiscountParams(type: 'percentage' | 'fixed', value: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors = [];

  if (type === 'percentage') {
    if (value < DISCOUNT_THRESHOLDS.MIN_PERCENTAGE || value > DISCOUNT_THRESHOLDS.MAX_PERCENTAGE) {
      errors.push(`Percentage must be between ${DISCOUNT_THRESHOLDS.MIN_PERCENTAGE}% and ${DISCOUNT_THRESHOLDS.MAX_PERCENTAGE}%`);
    }
  } else {
    if (value < DISCOUNT_THRESHOLDS.MIN_FIXED_AMOUNT || value > DISCOUNT_THRESHOLDS.MAX_FIXED_AMOUNT) {
      errors.push(`Fixed amount must be between ₹${DISCOUNT_THRESHOLDS.MIN_FIXED_AMOUNT} and ₹${DISCOUNT_THRESHOLDS.MAX_FIXED_AMOUNT}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate discount amount for a given cart total
 */
export function calculateDiscountAmount(
  cartTotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number {
  if (discountType === 'percentage') {
    return Math.round((cartTotal * discountValue) / 100);
  } else {
    return Math.min(discountValue, cartTotal); // Don't exceed cart total
  }
}

/**
 * Format discount for display
 */
export function formatDiscount(type: 'percentage' | 'fixed', value: number): string {
  return type === 'percentage' ? `${value}%` : `₹${value.toLocaleString()}`;
}