import api from './axios';

// ========================================
// COMMUNICATION CONFIGURATION API
// ========================================
export const communicationConfigApi = {
  // Get all communication settings
  getAll: () => api.get('/communication').then(res => res.data),

  // Get settings for specific channel
  getByChannel: (channel: string) => api.get(`/communication/${channel}`).then(res => res.data),

  // Store communication settings
  store: (data: any) => api.post('/communication', data).then(res => res.data),

  // Update communication settings
  update: (id: number, data: any) => api.put(`/communication/${id}`, data).then(res => res.data),

  // Delete communication settings
  destroy: (id: number) => api.delete(`/communication/${id}`).then(res => res.data),

  // Get providers for channel type
  getProviders: (channelType: string) => api.get(`/communication/providers/${channelType}`).then(res => res.data),

  // Get provider configuration structure from backend
  getProviderStructure: (channelType: string, providerName: string) =>
    api.get(`/communication/providers/${channelType}/${providerName}`).then(res => res.data),

  // Get all provider structures
  getAllProviderStructures: () => api.get('/communication/provider-structures').then(res => res.data),

  // Test SMS connection - now uses existing active configuration from backend
  testSMS: (data: {
    test_number: string;
  }) => api.post('/communication/sms/test', data).then(res => res.data),

  // Test WhatsApp connection - now uses existing active configuration from backend
  testWhatsApp: (data: {
    test_number: string;
  }) => api.post('/communication/whatsapp/test', data).then(res => res.data),

  // Test email configuration
  testEmail: (data: { test_email: string }) =>
    api.post('/communication/email/test', data).then(res => res.data),
};

// ========================================
// NOTIFICATION PREFERENCES API
// ========================================
export const notificationPreferencesApi = {
  // Get all notification preferences
  getAll: () => api.get('/notifications/preferences').then(res => res.data),

  // Get preference for specific event
  getByEvent: (eventType: string) => api.get(`/notifications/preferences/${eventType}`).then(res => res.data),

  // Store notification preference
  store: (data: any) => api.post('/notifications/preferences', data).then(res => res.data),

  // Update notification preference
  update: (id: number, data: any) => api.put(`/notifications/preferences/${id}`, data).then(res => res.data),

  // Delete notification preference
  destroy: (id: number) => api.delete(`/notifications/preferences/${id}`).then(res => res.data),

  // Get enabled preferences for event
  getEnabledForEvent: (eventType: string) => api.get(`/notifications/preferences/${eventType}/enabled`).then(res => res.data),

  // Test notification for event
  test: (data: {
    event_type: string;
    recipient: string;
    channels: string[];
    sample_data?: any;
  }) => api.post('/notifications/test', data).then(res => res.data),

  // Get channel availability status
  getChannelStatus: () => api.get('/notifications/channels/status').then(res => res.data),

  // Toggle preference status
  toggleStatus: (id: number, enabled: boolean) => api.put(`/notifications/preferences/${id}/toggle`, { enabled }).then(res => res.data),

  // Update preferences order
  updateOrder: (data: { preferences: Array<{ id: number; priority: number }> }) =>
    api.put('/notifications/preferences/order', data).then(res => res.data),

  // Get preferences summary
  getSummary: () => api.get('/notifications/preferences/summary').then(res => res.data),
};

// ========================================
// LEGACY API (for backward compatibility)
// ========================================
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

  // Test SMS connection (deprecated - use communicationConfigApi.testSMS)
  testSMSConnection: (data: {
    gateway_url: string;
    api_key: string;
    test_number: string;
    request_format: string;
  }) => api.post('/notification-settings/sms/test-connection', data).then(res => res.data),

  // Test WhatsApp connection (deprecated - use communicationConfigApi.testWhatsApp)
  testWhatsAppConnection: (data: {
    api_url: string;
    access_token: string;
    phone_number_id: string;
    test_number: string;
  }) => api.post('/notification-settings/whatsapp/test-connection', data).then(res => res.data),

  // WhatsApp Template Management API endpoints
  getWhatsAppTemplateDashboard: () => api.get('/whatsapp-templates/dashboard').then(res => res.data),

  syncWhatsAppTemplatesFromConfig: (data: {
    api_url?: string;
    access_token?: string;
    business_account_id?: string;
  }) => api.post('/notification-settings/whatsapp/sync-templates', data).then(res => res.data),

  getWhatsAppTemplateStructures: () => api.get('/whatsapp-templates/structures').then(res => res.data),

  syncWhatsAppTemplates: (data?: { force?: boolean; templates?: string[] }) =>
    api.post('/whatsapp-templates/sync', data).then(res => res.data),

  getWhatsAppTemplateStatus: (templateName: string) =>
    api.get(`/whatsapp-templates/status?template_name=${templateName}`).then(res => res.data),

  testWhatsAppTemplate: (data: {
    template_name: string;
    test_number: string;
    sample_data?: any;
  }) => api.post('/whatsapp-templates/test', data).then(res => res.data),

  getWhatsAppTemplateAnalytics: (period?: string) =>
    api.get(`/whatsapp-templates/analytics${period ? `?period=${period}` : ''}`).then(res => res.data),

  clearWhatsAppTemplateCaches: () =>
    api.post('/whatsapp-templates/clear-caches').then(res => res.data),

  // Get email configuration
  getEmailConfig: () => api.get('/settings/email').then(res => res.data),

  // Update email configuration
  updateEmailConfig: (data: {
    host: string;
    port: number;
    encryption: string;
    username: string;
    password: string;
    from_address: string;
    from_name: string;
  }) => api.put('/settings/email', {
    mail_host: data.host,
    mail_port: data.port,
    mail_encryption: data.encryption,
    mail_username: data.username,
    mail_password: data.password,
    mail_from_address: data.from_address,
    mail_from_name: data.from_name,
  }).then(res => res.data),

  // Test email configuration using stored backend credentials
  testEmailConfig: (data: { test_email: string }) =>
    api.post('/notification-settings/email/test', data).then(res => res.data),
};

export default notificationSettingsApi;

