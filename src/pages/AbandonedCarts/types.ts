/**
 * Abandoned Cart Types
 * Centralized type definitions for the entire abandoned cart admin system
 */

// Core Cart Types
export interface Cart {
  id: number;
  session_id: string;
  user_id?: number;
  user?: {
    email: string;
    name?: string;
    phone?: string;
  };
  total: number;
  subtotal?: number;
  tax_total?: number;
  discount_amount?: number;
  coupon_code?: string | null;
  total_items: number;
  currency: string;
  is_abandoned: boolean;
  status: 'new' | 'abandoned' | 'recovered' | 'expired' | 'pending';
  customer_segment: 'vip' | 'high_value' | 'repeat' | 'regular' | 'new';
  device_type?: 'mobile' | 'desktop' | 'tablet';
  source?: string;
  recovery_probability: number;
  abandoned_at?: string;
  recovered_at?: string;
  recovery_token?: string;
  recovery_email_count: number;
  last_recovery_email_sent?: string;
  last_activity?: string;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number | null;
  bundle_variant_id?: number | null;
  quantity: number;
  unit_price: number | string;
  total: number;
  // Relationships
  product?: {
    id: number;
    name: string;
    sku: string;
    price: number;
    image_url?: string;
  };
  variant?: {
    id: number;
    sku: string;
    price: number;
    attribute_values?: Record<string, string>;
  };
}

export interface CartNote {
  id: number;
  message_content: string;
  admin_notes?: string;
  contact_type: string;
  note_type?: string; 
  admin_user?: { name: string };
  created_at: string;
}

export interface CartDiscount {
  id: number;
  discount_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_until: string;
  is_active: boolean;
  times_used: number;
}

export interface RecoveryAttempt {
  id: number;
  channel: 'email' | 'sms' | 'whatsapp';
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
}

// Statistics Types
export interface RecoveryStats {
  total_abandoned: number;
  total_recovered: number;
  total_expired: number;
  recovery_rate: number;
  abandoned_value: number;
  recovered_value: number;
  value_recovery_rate: number;
  emails_sent: number;
  avg_recovery_time?: { hours: number; formatted: string };
  week_abandoned: number;
  week_recovered: number;
  week_expired: number;
  by_segment: Record<string, { count: number; value: number }>;
  by_device: Record<string, { count: number; value: number }>;
  by_status: Record<string, number>;
}

// Filter Types
export interface CartFilters {
  search: string;
  status: string;
  segment: string;
  device_type: string;
  date_from: string;
  date_to: string;
  min_value: string;
  max_value: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export interface FilterOptions {
  customer_segments: Array<{ value: string; label: string }>;
  device_types: Array<{ value: string; label: string }>;
  sources: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  probability_ranges: Array<{ value: number; label: string }>;
  value_ranges: Array<{ value: string; label: string }>;
  sort_options: Array<{ value: string; label: string }>;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CartDetailResponse {
  data: Cart;
  success: boolean;
}

export interface RecoveryHistoryResponse {
  data: {
    recovery_attempts: RecoveryAttempt[];
    active_discounts: CartDiscount[];
    contact_history: CartNote[];
    timeline?: Array<{
      action: string;
      created_at: string;
      details?: string;
    }>;
  };
  success: boolean;
}

// Form Types
export interface SendRecoveryForm {
  channel: 'email' | 'sms' | 'whatsapp';
  email_type: 'first_reminder' | 'second_reminder' | 'final_reminder';
}

export interface GenerateDiscountForm {
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  valid_days: string;
  min_purchase_amount?: string;
}

export interface AddNoteForm {
  notes: string;
  note_type: 'internal' | 'customer_communication' | 'recovery_attempt';
}

// Constants
export const SEGMENT_COLORS: Record<string, string> = {
  vip: 'bg-purple-100 text-purple-800',
  high_value: 'bg-blue-100 text-blue-800',
  repeat: 'bg-green-100 text-green-800',
  regular: 'bg-gray-100 text-gray-800',
  new: 'bg-yellow-100 text-yellow-800',
};

export const STATUS_COLORS: Record<string, string> = {
  abandoned: 'bg-red-100 text-red-800',
  recovered: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  new: 'bg-blue-100 text-blue-800',
};

export const DEVICE_ICONS = {
  mobile: 'Smartphone',
  desktop: 'Monitor',
  tablet: 'Tablet',
} as const;
