import api from './axios';

export const notificationSettingsApi = {
  // Get all notification settings
  getSettings: () => api.get('/notification-settings').then(res => res.data),

  // Update notification settings
  updateSettings: (data: any) => api.put('/notification-settings', data).then(res => res.data),

  // Get available channels
  getChannels: () => api.get('/notification-settings/channels').then(res => res.data),

  // Test notification
  sendTestNotification: (data: { channel: string; recipient: string; event_type?: string }) =>
    api.post('/notification-settings/test', data).then(res => res.data),

  // Test SMS connection
  testSMSConnection: (data: {
    gateway_url: string;
    api_key: string;
    test_number: string;
    request_format: string;
  }) => api.post('/notification-settings/sms/test-connection', data).then(res => res.data),

  // Test WhatsApp connection
  testWhatsAppConnection: (data: {
    api_url: string;
    access_token: string;
    phone_number_id: string;
    test_number: string;
  }) => api.post('/notification-settings/whatsapp/test-connection', data).then(res => res.data),

  // Sync WhatsApp templates
  syncWhatsAppTemplates: (data: {
    api_url?: string;
    access_token?: string;
    business_account_id?: string;
  }) => api.post('/notification-settings/whatsapp/sync-templates', data).then(res => res.data),

  // Get email configuration
  getEmailConfig: () => api.get('/notification-settings/email/config').then(res => res.data),

  // Update email configuration
  updateEmailConfig: (data: {
    host: string;
    port: number;
    encryption: string;
    username: string;
    password: string;
    from_address: string;
    from_name: string;
  }) => api.put('/notification-settings/email/config', data).then(res => res.data),
};

export default notificationSettingsApi;

