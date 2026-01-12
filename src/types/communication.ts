export interface CommunicationLog {
  id: number;
  user_id: number;
  event_type: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  recipient: string;
  status: 'sent' | 'delivered' | 'failed' | 'read' | 'clicked' | 'opened' | 'queued';
  provider: string;
  subject?: string;
  message_preview?: string;
  error_message?: string;
  cost?: number;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CommunicationTemplate {
  id: number;
  name: string;
  slug: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  type: 'transactional' | 'promotional' | 'other';
  subject?: string;
  content_body?: string;
  html_body?: string;
  metadata?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunicationSetting {
  id: number;
  channel: 'email' | 'sms' | 'whatsapp' | 'push';
  provider: string;
  credentials: any;
  is_active: boolean;
  notes?: string;
}

export interface CommunicationStats {
  total: number;
  successful: number;
  failed: number;
  by_channel: {
    channel: string;
    count: number;
    success_count: number;
  }[];
}
