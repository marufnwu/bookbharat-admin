export type AffiliateStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'blocked';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed' | 'on_hold';
export type PayoutStatus = 'requested' | 'under_review' | 'processing' | 'paid' | 'failed' | 'rejected' | 'cancelled';
export type PayoutMethod = 'bank' | 'upi';
export type EntityType = 'individual' | 'huf' | 'company' | 'firm';

export interface AffiliateCoupon {
  id: number;
  code: string;
  discount_value: number;
  is_active: boolean;
  expires_at: string | null;
  starts_at: string | null;
  minimum_order_amount: number;
  maximum_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  usage_count: number;
  first_order_only: boolean;
  applicable_categories: number[];
  excluded_categories: number[];
}

export interface Affiliate {
  id: number;
  code: string;
  status: AffiliateStatus;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  how_promote?: string | null;
  payout_method: PayoutMethod;
  payment_details?: {
    bank?: { account_number: string; ifsc: string; holder_name: string; bank_name: string };
    upi?: { id: string };
  };
  pan?: string | null;
  entity_type?: EntityType | null;
  gstin?: string | null;
  coupon?: AffiliateCoupon | null;
  approved_at?: string | null;
  approved_by?: number | null;
  admin_note?: string | null;
  rejection_reason?: string | null;
  suspended_reason?: string | null;
  suspended_at?: string | null;
  blocked_at?: string | null;
  terms_accepted_at?: string | null;
  created_at: string;
  updated_at?: string;
}

/** Admin payout-processing view of payment details (contract §3.3).
 *  PAN is masked as "ABCDE****F"; GSTIN/bank full. */
export interface AdminPaymentDetails {
  pan?: string | null;
  entity_type?: EntityType | null;
  gstin?: string | null;
  payment_details: {
    method: PayoutMethod;
    bank?: {
      holder_name: string;
      ifsc: string;
      account_number: string;
    };
    upi?: {
      id: string;
    };
  };
}

export interface AffiliateCommission {
  id: number;
  affiliate_id: number;
  affiliate_name?: string;
  order_id: number;
  order_number: string;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  reason?: string | null;
  approved_at?: string | null;
  reversed_at?: string | null;
  created_at: string;
}

export interface AffiliatePayout {
  id: number;
  affiliate_id: number;
  affiliate_name?: string;
  request_number: string;
  amount_requested: number;
  amount_paid?: number | null;
  tds_amount?: number | null;
  amount_net?: number | null;
  method: PayoutMethod;
  payment_details?: {
    bank?: { account_number: string; ifsc: string; holder_name: string; bank_name: string };
    upi?: { id: string };
  };
  status: PayoutStatus;
  transaction_reference?: string | null;
  rejection_reason?: string | null;
  requested_at: string;
  processed_at?: string | null;
  commission_count?: number;
}

export type CommissionRuleType = 'default' | 'category' | 'product';

export interface CommissionRule {
  id: number;
  rule_type: CommissionRuleType;
  category_id?: number | null;
  product_id?: number | null;
  rate: number;
  is_active: boolean;
  description?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at?: string;
  product?: { id: number; name: string; slug?: string } | null;
  category?: { id: number; name: string } | null;
}

export interface AffiliateLiability {
  outstanding_liability: number;
  pending: number;
  paid: number;
  total: number;
}

export interface AffiliatePerformanceRow {
  id: number;
  full_name: string;
  code: string;
  commission_earned: number;
  commission_paid: number;
  orders_count: number;
  sales_total: number;
  clicks_count: number;
}
