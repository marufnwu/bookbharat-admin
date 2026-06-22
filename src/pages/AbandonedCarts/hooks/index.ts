/**
 * Abandoned Cart Hooks
 * Centralized React Query hooks for data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../../utils/toast';
import type { CartFilters, SendRecoveryForm, GenerateDiscountForm, AddNoteForm } from '../types';
import * as api from '../api';

// Query Keys
export const QUERY_KEYS = {
  carts: 'abandoned-carts',
  cart: (id: number) => ['abandoned-cart', id],
  stats: 'abandoned-cart-stats',
  history: (id: number) => ['cart-history', id],
  insights: (id: number) => ['cart-insights', id],
  filterOptions: 'cart-filter-options',
  templates: 'recovery-templates',
} as const;

// ============ QUERIES ============

export const useAbandonedCarts = (filters: Partial<CartFilters>, page: number = 1) => {
  return useQuery({
    queryKey: [QUERY_KEYS.carts, filters, page],
    queryFn: () => api.fetchCarts(filters, page),
  });
};

export const useRecoveryStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: api.fetchStatistics,
  });
};

export const useFilterOptions = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.filterOptions],
    queryFn: api.fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCartDetail = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.cart(id),
    queryFn: () => api.fetchCartDetail(id),
    enabled: !!id,
  });
};

export const useRecoveryHistory = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.history(id),
    queryFn: () => api.fetchRecoveryHistory(id),
    enabled: !!id,
  });
};

export const useCartInsights = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.insights(id),
    queryFn: () => api.fetchCartInsights(id),
    enabled: !!id,
  });
};

export const useRecoveryTemplates = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.templates],
    queryFn: api.fetchRecoveryTemplates,
  });
};

// ============ MUTATIONS ============

export const useSendRecovery = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, data }: { cartId: number; data: SendRecoveryForm }) =>
      api.sendRecoveryMessage(cartId, data),
    onSuccess: (result, { cartId }) => {
      toast.success(result.message || 'Recovery message sent');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart(cartId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(cartId) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.carts] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });
};

export const useGenerateDiscount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, data }: { cartId: number; data: GenerateDiscountForm }) =>
      api.generateDiscount(cartId, data),
    onSuccess: (_, { cartId }) => {
      toast.success('Discount code generated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart(cartId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(cartId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate discount');
    },
  });
};

export const useAddNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, data }: { cartId: number; data: AddNoteForm }) =>
      api.addNote(cartId, data),
    onSuccess: (_, { cartId }) => {
      toast.success('Note added');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history(cartId) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add note');
    },
  });
};

export const useMarkRecovered = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, notes }: { cartId: number; notes?: string }) =>
      api.markAsRecovered(cartId, notes),
    onSuccess: (_, { cartId }) => {
      toast.success('Cart marked as recovered');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart(cartId) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.carts] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as recovered');
    },
  });
};

export const useDeleteCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cartId: number) => api.deleteCart(cartId),
    onSuccess: () => {
      toast.success('Cart deleted');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.carts] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete cart');
    },
  });
};

// Bulk Actions
export const useBulkSendEmails = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartIds, emailType }: { cartIds: number[]; emailType?: string }) =>
      api.bulkSendEmails(cartIds, emailType),
    onSuccess: (result) => {
      toast.success(result.message || 'Emails sent');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.carts] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send emails');
    },
  });
};

export const useBulkDelete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cartIds: number[]) => api.bulkDelete(cartIds),
    onSuccess: () => {
      toast.success('Carts deleted');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.carts] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete carts');
    },
  });
};

export const useApplyTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartId, templateName, sendImmediately }: {
      cartId: number;
      templateName: string;
      sendImmediately?: boolean;
    }) => api.applyTemplate(cartId, templateName, sendImmediately),
    onSuccess: (_, { cartId }) => {
      toast.success('Template applied');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart(cartId) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.carts] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to apply template');
    },
  });
};
