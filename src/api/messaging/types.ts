/**
 * Messaging system shared types (dashboard, logs, notification events,
 * SMS templates). One module for all six messaging screens.
 */

export type MessageChannel = 'whatsapp' | 'sms' | 'email';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardWarning {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface ChannelHealth {
  total: number;
  successful: number;
  success_rate: number | null;
  last_error: { message: string; at: string; template: string } | null;
}

export interface VolumeDay {
  date: string;
  channels: { channel: MessageChannel; total: number; successful: number }[];
}

export interface MessagingDashboard {
  period_days: number;
  summary: { total: number; sent: number; delivered: number; failed: number; queued: number };
  volume_by_day: VolumeDay[];
  per_channel: Record<MessageChannel, ChannelHealth>;
  failure_reasons: { error_message: string | null; total: number }[];
  by_event: { template_code: string | null; total: number; failed: number }[];
  queue: { pending_jobs: number; failed_jobs: number };
  warnings: DashboardWarning[];
}

// ── Message logs ─────────────────────────────────────────────────────────────

export interface MessageLog {
  id: number;
  user_id: number | null;
  template_code: string | null;
  channel: MessageChannel;
  recipient: string;
  status: MessageStatus;
  subject_type: string | null;
  subject_id: number | null;
  provider: string | null;
  provider_message_id: string | null;
  attempts: number;
  error_message: string | null;
  error_code: string | null;
  payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string } | null;
}

export interface LogFilters {
  channel?: string;
  status?: string;
  template_code?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface LogStatistics {
  total: number;
  by_channel: Record<MessageChannel, number>;
  by_status: Record<string, number>;
  success_rates: Record<MessageChannel, number>;
}

// ── Notification events ──────────────────────────────────────────────────────

export interface MessageEvent {
  label: string;
  category: 'transactional' | 'marketing';
  channels: Record<MessageChannel, boolean>;
  quiet_hours_exempt: boolean;
  enabled: boolean;
  locked?: boolean;
  is_customised: boolean;
  variables: string[];
  sample: Record<string, string>;
}

export type MessageEventMap = Record<string, MessageEvent>;

// ── SMS templates ────────────────────────────────────────────────────────────

export interface SmsTemplate {
  event_code: string;
  label: string;
  body: string;
  dlt_template_id: string | null;
  is_active: boolean;
  is_customised: boolean;
  variables: string[];
}
