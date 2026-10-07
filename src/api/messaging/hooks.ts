/**
 * React Query hooks for the messaging system. Query keys are rooted under
 * ['messaging', …]; mutations toast + invalidate related keys.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from './api';
import type { LogFilters, MessageChannel } from './types';

export const MESSAGING_QUERY_KEYS = {
  dashboard: (days: number) => ['messaging', 'dashboard', days] as const,
  logs: (filters: Partial<LogFilters>, page: number, perPage: number) =>
    ['messaging', 'logs', filters, page, perPage] as const,
  log: (id: number) => ['messaging', 'log', id] as const,
  statistics: (days: number) => ['messaging', 'statistics', days] as const,
  events: () => ['messaging', 'events'] as const,
  smsTemplates: () => ['messaging', 'sms-templates'] as const,
  smsPreview: (event: string) => ['messaging', 'sms-preview', event] as const,
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export const useMessagingDashboard = (days = 7) =>
  useQuery({
    queryKey: MESSAGING_QUERY_KEYS.dashboard(days),
    queryFn: () => api.fetchDashboard(days),
  });

// ── Message logs ─────────────────────────────────────────────────────────────

export const useMessageLogs = (
  filters: Partial<LogFilters>,
  page: number,
  perPage: number,
) =>
  useQuery({
    queryKey: MESSAGING_QUERY_KEYS.logs(filters, page, perPage),
    queryFn: () => api.fetchLogs(filters, page, perPage),
  });

export const useLogStatistics = (days = 7) =>
  useQuery({
    queryKey: MESSAGING_QUERY_KEYS.statistics(days),
    queryFn: () => api.fetchLogStatistics(days),
  });

export const useRetryLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.retryLog(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ['messaging'] });
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error('Retry request failed'),
  });
};

// ── Notification events ──────────────────────────────────────────────────────

export const useMessageEvents = () =>
  useQuery({
    queryKey: MESSAGING_QUERY_KEYS.events(),
    queryFn: api.fetchEvents,
  });

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      event,
      payload,
    }: {
      event: string;
      payload: { channels: Record<MessageChannel, boolean>; quiet_hours_exempt: boolean };
    }) => api.updateEvent(event, payload),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: MESSAGING_QUERY_KEYS.events() });
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error('Failed to update event'),
  });
};

export const useTestEvent = () =>
  useMutation({
    mutationFn: (payload: { event: string; channel: MessageChannel; recipient: string }) =>
      api.testEvent(payload),
    onSuccess: (result) =>
      result.success ? toast.success(result.message) : toast.error(result.message),
    onError: () => toast.error('Test send request failed'),
  });

// ── SMS templates ────────────────────────────────────────────────────────────

export const useSmsTemplates = () =>
  useQuery({
    queryKey: MESSAGING_QUERY_KEYS.smsTemplates(),
    queryFn: api.fetchSmsTemplates,
  });

export const useSmsTemplatePreview = (event: string) =>
  useQuery({
    queryKey: MESSAGING_QUERY_KEYS.smsPreview(event),
    queryFn: () => api.previewSmsTemplate(event),
    enabled: !!event,
  });

const invalidateSmsTemplates = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: MESSAGING_QUERY_KEYS.smsTemplates() });
  queryClient.invalidateQueries({ queryKey: ['messaging', 'sms-preview'] });
};

export const useUpdateSmsTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      event,
      payload,
    }: {
      event: string;
      payload: { body: string; dlt_template_id: string; is_active?: boolean };
    }) => api.updateSmsTemplate(event, payload),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        invalidateSmsTemplates(queryClient);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error('Failed to save SMS template'),
  });
};

export const useResetSmsTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: string) => api.resetSmsTemplate(event),
    onSuccess: (result) => {
      toast.success(result.message);
      invalidateSmsTemplates(queryClient);
    },
    onError: () => toast.error('Failed to reset SMS template'),
  });
};

export const useTestSmsTemplate = () =>
  useMutation({
    mutationFn: ({ event, recipient }: { event: string; recipient: string }) =>
      api.testSmsTemplate(event, recipient),
    onSuccess: (result) =>
      result.success ? toast.success(result.message) : toast.error(result.message),
    onError: () => toast.error('Test send request failed'),
  });
