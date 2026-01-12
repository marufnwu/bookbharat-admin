/**
 * Abandoned Cart API
 * Centralized API calls for abandoned cart admin
 */

import { api } from '../../api/axios';
import type {
  Cart,
  CartFilters,
  RecoveryStats,
  FilterOptions,
  PaginatedResponse,
  CartDetailResponse,
  RecoveryHistoryResponse,
  SendRecoveryForm,
  GenerateDiscountForm,
  AddNoteForm,
} from './types';

const BASE_URL = '/abandoned-carts';

// List & Statistics
export const fetchCarts = async (
  filters: Partial<CartFilters>,
  page: number = 1,
  perPage: number = 20
): Promise<PaginatedResponse<Cart>> => {
  const params = {
    page,
    per_page: perPage,
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined)
    ),
  };
  const response = await api.get(BASE_URL, { params });
  return response.data;
};

export const fetchStatistics = async (): Promise<{ data: RecoveryStats }> => {
  const response = await api.get(`${BASE_URL}/statistics`);
  return response.data;
};

export const fetchFilterOptions = async (): Promise<{ data: FilterOptions }> => {
  const response = await api.get(`${BASE_URL}/filter-options`);
  return response.data;
};

// Single Cart
export const fetchCartDetail = async (id: number): Promise<CartDetailResponse> => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const fetchRecoveryHistory = async (id: number): Promise<RecoveryHistoryResponse> => {
  const response = await api.get(`${BASE_URL}/${id}/recovery-history`);
  return response.data;
};

export const fetchCartInsights = async (id: number): Promise<{ data: any }> => {
  const response = await api.get(`${BASE_URL}/${id}/insights`);
  return response.data;
};

// Actions
export const sendRecoveryMessage = async (
  cartId: number,
  data: SendRecoveryForm
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`${BASE_URL}/${cartId}/send-recovery-email`, data);
  return response.data;
};

export const generateDiscount = async (
  cartId: number,
  data: GenerateDiscountForm
): Promise<{ success: boolean; data: any }> => {
  // Clean empty values
  const cleanData: Record<string, any> = {
    discount_type: data.discount_type,
    discount_value: data.discount_value,
  };
  if (data.valid_days) cleanData.valid_days = data.valid_days;
  if (data.min_purchase_amount) cleanData.min_purchase_amount = data.min_purchase_amount;

  const response = await api.post(`${BASE_URL}/${cartId}/generate-discount`, cleanData);
  return response.data;
};

export const addNote = async (
  cartId: number,
  data: AddNoteForm
): Promise<{ success: boolean }> => {
  const response = await api.post(`${BASE_URL}/${cartId}/add-notes`, data);
  return response.data;
};

export const markAsRecovered = async (
  cartId: number,
  notes?: string
): Promise<{ success: boolean }> => {
  const response = await api.post(`${BASE_URL}/${cartId}/mark-as-recovered`, {
    notes: notes || 'Manually marked as recovered',
  });
  return response.data;
};

export const deleteCart = async (cartId: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`${BASE_URL}/${cartId}`);
  return response.data;
};

// Bulk Actions
export const bulkSendEmails = async (
  cartIds: number[],
  emailType?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`${BASE_URL}/bulk-send-emails`, {
    cart_ids: cartIds,
    email_type: emailType,
  });
  return response.data;
};

export const bulkDelete = async (cartIds: number[]): Promise<{ success: boolean }> => {
  const response = await api.post(`${BASE_URL}/bulk-delete`, { cart_ids: cartIds });
  return response.data;
};

export const bulkUpdateSegments = async (
  cartIds: number[],
  segment: string
): Promise<{ success: boolean }> => {
  const response = await api.post(`${BASE_URL}/bulk-update-segments`, {
    cart_ids: cartIds,
    segment,
  });
  return response.data;
};

// Templates
export const fetchRecoveryTemplates = async (): Promise<{ data: any[] }> => {
  const response = await api.get(`${BASE_URL}/recovery-templates`);
  return response.data;
};

export const applyTemplate = async (
  cartId: number,
  templateName: string,
  sendImmediately: boolean = false
): Promise<{ success: boolean }> => {
  const response = await api.post(`${BASE_URL}/${cartId}/apply-template`, {
    template_name: templateName,
    send_immediately: sendImmediately,
  });
  return response.data;
};
// ... existing exports

export const adminApi = {
  getCartDetails: fetchCartDetail,
  
  addCartItem: async (cartId: number, data: { product_id: number; variant_id?: number; quantity: number; unit_price?: number}) => {
      const response = await api.post(`/carts/${cartId}/items`, data);
      return response.data;
  },

  updateCartItem: async (cartId: number, itemId: number, data: { quantity?: number; unit_price?: number }) => {
      const response = await api.put(`/carts/${cartId}/items/${itemId}`, data);
      return response.data;
  },

  removeCartItem: async (cartId: number, itemId: number) => {
      const response = await api.delete(`/carts/${cartId}/items/${itemId}`);
      return response.data;
  },

  applyCoupon: async (cartId: number, code: string) => {
      const response = await api.post(`/carts/${cartId}/coupon`, { coupon_code: code });
      return response.data;
  },

  removeCoupon: async (cartId: number) => {
      const response = await api.delete(`/carts/${cartId}/coupon`);
      return response.data;
  }
};
