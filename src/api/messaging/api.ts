/**
 * Messaging system API — single module shared by all messaging screens.
 * Base URL is the admin API root (…/api/v1/admin) from src/api/axios.
 */

import { api } from '../axios';
import type {
  LogFilters,
  LogStatistics,
  MessageChannel,
  MessageEventMap,
  MessagingDashboard,
  MessageLog,
  SmsTemplate,
} from './types';

const MESSAGING = '/settings/messaging';

// ── Dashboard ────────────────────────────────────────────────────────────────

export const fetchDashboard = async (days = 7): Promise<MessagingDashboard> => {
  const response = await api.get(`${MESSAGING}/dashboard`, { params: { days } });
  return response.data.dashboard;
};

// ── Message logs ─────────────────────────────────────────────────────────────

export interface PaginatedLogs {
  data: MessageLog[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export const fetchLogs = async (
  filters: Partial<LogFilters>,
  page = 1,
  perPage = 50,
): Promise<PaginatedLogs> => {
  const params = {
    page,
    per_page: perPage,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null)),
  };
  const response = await api.get(`${MESSAGING}/logs`, { params });
  const body = response.data;
  // Backend returns { success, logs: {data, total, ...} }
  return body.logs ?? body;
};

export const fetchLog = async (id: number): Promise<MessageLog> => {
  const response = await api.get(`${MESSAGING}/logs/${id}`);
  return response.data.log;
};

export const retryLog = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`${MESSAGING}/logs/${id}/retry`);
  return response.data;
};

export const fetchLogStatistics = async (days = 7): Promise<LogStatistics> => {
  const response = await api.get(`${MESSAGING}/logs/statistics`, { params: { days } });
  return response.data.statistics;
};

export const exportLogs = async (filters: Partial<LogFilters>): Promise<Blob> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v != null),
  );
  const response = await api.get(`${MESSAGING}/logs/export`, {
    params,
    responseType: 'blob',
  });
  return response.data as Blob;
};

// ── Notification events ──────────────────────────────────────────────────────

export const fetchEvents = async (): Promise<MessageEventMap> => {
  const response = await api.get(`${MESSAGING}/events`);
  return response.data.events;
};

export const updateEvent = async (
  event: string,
  payload: { channels: Record<MessageChannel, boolean>; quiet_hours_exempt: boolean },
): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`${MESSAGING}/events/${event}`, payload);
  return response.data;
};

export const testEvent = async (payload: {
  event: string;
  channel: MessageChannel;
  recipient: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`${MESSAGING}/events/test`, payload);
  return response.data;
};

// ── SMS templates ────────────────────────────────────────────────────────────

export const fetchSmsTemplates = async (): Promise<SmsTemplate[]> => {
  const response = await api.get(`${MESSAGING}/sms-templates`);
  return response.data.templates;
};

export const fetchSmsTemplate = async (event: string): Promise<SmsTemplate> => {
  const response = await api.get(`${MESSAGING}/sms-templates/${event}`);
  return response.data.template;
};

export const updateSmsTemplate = async (
  event: string,
  payload: { body: string; dlt_template_id: string; is_active?: boolean },
): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`${MESSAGING}/sms-templates/${event}`, payload);
  return response.data;
};

export const resetSmsTemplate = async (
  event: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`${MESSAGING}/sms-templates/${event}`);
  return response.data;
};

export const previewSmsTemplate = async (
  event: string,
): Promise<{ preview: string; unresolved_placeholders: string[] }> => {
  const response = await api.get(`${MESSAGING}/sms-templates/${event}/preview`);
  return response.data;
};

export const testSmsTemplate = async (
  event: string,
  recipient: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`${MESSAGING}/sms-templates/${event}/test`, { recipient });
  return response.data;
};
