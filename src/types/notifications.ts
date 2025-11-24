// Notification System Types
export interface NotificationPreference {
  id: number;
  event_type: string;
  channels: string[];
  enabled: boolean;
  description?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'inactive';
  success_rate: number | null;
  last_24h_sent?: number;
  last_24h_delivered?: number;
  last_error?: string;
}

export interface ChannelStatus {
  name: string;
  icon: string;
  configured: boolean;
  active: boolean;
  provider: string | null;
  providerLink?: string;
  health?: ChannelHealth;
}

export interface ChannelStatusData {
  [channel: string]: ChannelStatus;
}

export interface EventStatistics {
  total?: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    success_rate: number;
  };
  last_7_days?: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    success_rate: number;
  };
  last_30_days?: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    success_rate: number;
  };
  channels?: {
    [channel: string]: {
      sent: number;
      delivered: number;
      failed: number;
      success_rate: number;
    };
  };
}

export interface EventType {
  name: string;
  description: string;
  category?: string;
  importance?: number;
  recommended_channels?: string[];
}

export interface TestNotificationData {
  event_type: string;
  recipient: string;
  channels: string[];
  sample_data?: {
    order_id?: string;
    customer_name?: string;
    amount?: string;
    [key: string]: any;
  };
}

export interface NotificationPreferencesResponse {
  data: NotificationPreference[];
  event_types: { [key: string]: EventType };
  available_channels: string[];
  channel_icons: { [key: string]: string };
  event_statistics: { [key: string]: EventStatistics };
}

export interface ChannelStatusResponse {
  data: ChannelStatusData;
}
