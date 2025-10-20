import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationSettingsApi from '../../api/notificationSettings';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone,
  Check,
  X,
  RefreshCw,
  Send,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface NotificationSetting {
  id?: number;
  event_type: string;
  channels: string[];
  enabled: boolean;
  sms_gateway_url?: string;
  sms_api_key?: string;
  sms_sender_id?: string;
  sms_request_format?: string;
  whatsapp_api_url?: string;
  whatsapp_access_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_templates?: any[];
  email_from?: string;
  email_from_name?: string;
}

const NotificationSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'events' | 'sms' | 'whatsapp' | 'email'>('events');
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [testChannel, setTestChannel] = useState<string>('');
  const [testRecipient, setTestRecipient] = useState<string>('');

  // SMS Configuration State
  const [smsConfig, setSmsConfig] = useState({
    gateway_url: '',
    api_key: '',
    sender_id: 'BKBHRT',
    request_format: 'json' as 'json' | 'form',
  });

  // WhatsApp Configuration State
  const [whatsappConfig, setWhatsappConfig] = useState({
    api_url: 'https://graph.facebook.com/v18.0',
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
  });

  // Email Configuration State
  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: 587,
    encryption: 'tls' as 'tls' | 'ssl',
    username: '',
    password: '',
    from_address: '',
    from_name: '',
  });

  // Fetch notification settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => notificationSettingsApi.getSettings(),
  });

  // Fetch email configuration
  const { data: emailConfigData } = useQuery({
    queryKey: ['email-config'],
    queryFn: () => notificationSettingsApi.getEmailConfig(),
  });

  // Update email config state when data loads
  React.useEffect(() => {
    if (emailConfigData?.success && emailConfigData?.config) {
      setEmailConfig({
        host: emailConfigData.config.host || '',
        port: emailConfigData.config.port || 587,
        encryption: emailConfigData.config.encryption || 'tls',
        username: '',
        password: '',
        from_address: emailConfigData.config.from_address || '',
        from_name: emailConfigData.config.from_name || '',
      });
    }
  }, [emailConfigData]);

  const settings: Record<string, NotificationSetting> = settingsData?.data?.settings || {};
  const eventTypes: Record<string, string> = settingsData?.data?.event_types || {};
  const availableChannels: string[] = settingsData?.data?.available_channels || [];

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: NotificationSetting) => notificationSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      alert('Settings updated successfully');
      setEditingEvent(null);
    },
    onError: (error: any) => {
      alert('Failed to update settings: ' + (error.response?.data?.message || error.message));
    },
  });

  // Test SMS mutation
  const testSMSMutation = useMutation({
    mutationFn: (data: any) => notificationSettingsApi.testSMSConnection(data),
    onSuccess: (response) => {
      if (response.data.success) {
        alert('✅ SMS test successful! Message sent.');
      } else {
        alert('❌ SMS test failed: ' + response.data.message);
      }
    },
    onError: (error: any) => {
      alert('❌ SMS test failed: ' + (error.response?.data?.message || error.message));
    },
  });

  // Test WhatsApp mutation
  const testWhatsAppMutation = useMutation({
    mutationFn: (data: any) => notificationSettingsApi.testWhatsAppConnection(data),
    onSuccess: (response) => {
      if (response.data.success) {
        alert('✅ WhatsApp test successful! Message sent.');
      } else {
        alert('❌ WhatsApp test failed: ' + response.data.message);
      }
    },
    onError: (error: any) => {
      alert('❌ WhatsApp test failed: ' + (error.response?.data?.message || error.message));
    },
  });

  // Sync WhatsApp templates mutation
  const syncTemplatesMutation = useMutation({
    mutationFn: (data: any) => notificationSettingsApi.syncWhatsAppTemplates(data),
    onSuccess: (response) => {
      if (response.data.success) {
        alert(`✅ Synced ${response.data.templates.length} WhatsApp templates`);
        queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      } else {
        alert('❌ Template sync failed: ' + response.data.message);
      }
    },
    onError: (error: any) => {
      alert('❌ Template sync failed: ' + (error.response?.data?.message || error.message));
    },
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: (data: any) => notificationSettingsApi.sendTestNotification(data),
    onSuccess: (response) => {
      if (response.success) {
        alert(`✅ Test ${testChannel} notification sent successfully!`);
        setTestRecipient('');
      } else {
        alert('❌ Test failed: ' + response.message);
      }
    },
    onError: (error: any) => {
      alert('❌ Test failed: ' + (error.response?.data?.message || error.message));
    },
  });

  // Update email config mutation
  const updateEmailMutation = useMutation({
    mutationFn: (data: any) => notificationSettingsApi.updateEmailConfig(data),
    onSuccess: (response) => {
      if (response.success) {
        alert('✅ Email configuration updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['email-config'] });
      } else {
        alert('❌ Update failed: ' + response.message);
      }
    },
    onError: (error: any) => {
      alert('❌ Update failed: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleChannelToggle = (eventType: string, channel: string) => {
    const setting = settings[eventType] || {
      event_type: eventType,
      channels: [],
      enabled: true,
    };

    const channels = setting.channels || [];
    const newChannels = channels.includes(channel)
      ? channels.filter((c: string) => c !== channel)
      : [...channels, channel];

    updateMutation.mutate({
      ...setting,
      channels: newChannels,
    });
  };

  const handleEventToggle = (eventType: string) => {
    const setting = settings[eventType] || {
      event_type: eventType,
      channels: ['email'],
      enabled: true,
    };

    updateMutation.mutate({
      ...setting,
      enabled: !setting.enabled,
    });
  };

  const handleSMSTest = () => {
    if (!smsConfig.gateway_url || !smsConfig.api_key || !testRecipient) {
      alert('Please fill in all SMS configuration fields and test number');
      return;
    }

    testSMSMutation.mutate({
      ...smsConfig,
      test_number: testRecipient,
    });
  };

  const handleWhatsAppTest = () => {
    if (!whatsappConfig.api_url || !whatsappConfig.access_token || !whatsappConfig.phone_number_id || !testRecipient) {
      alert('Please fill in all WhatsApp configuration fields and test number');
      return;
    }

    testWhatsAppMutation.mutate({
      ...whatsappConfig,
      test_number: testRecipient,
    });
  };

  const handleSyncTemplates = () => {
    if (!whatsappConfig.access_token || !whatsappConfig.business_account_id) {
      alert('Please provide WhatsApp access token and business account ID');
      return;
    }

    syncTemplatesMutation.mutate(whatsappConfig);
  };

  const handleTestNotification = () => {
    if (!testChannel || !testRecipient) {
      alert('Please select a channel and enter recipient');
      return;
    }

    testNotificationMutation.mutate({
      channel: testChannel,
      recipient: testRecipient,
      event_type: 'test_notification',
    });
  };

  const saveSMSConfig = () => {
    // Save SMS config to all events (global config)
    const firstEventType = Object.keys(eventTypes)[0];
    if (!firstEventType) return;

    const setting = settings[firstEventType] || {
      event_type: firstEventType,
      channels: ['email'],
      enabled: true,
    };

    updateMutation.mutate({
      ...setting,
      ...smsConfig,
    });
  };

  const saveWhatsAppConfig = () => {
    // Save WhatsApp config to all events (global config)
    const firstEventType = Object.keys(eventTypes)[0];
    if (!firstEventType) return;

    const setting = settings[firstEventType] || {
      event_type: firstEventType,
      channels: ['email'],
      enabled: true,
    };

    updateMutation.mutate({
      ...setting,
      ...whatsappConfig,
    });
  };

  const saveEmailConfig = () => {
    if (!emailConfig.host || !emailConfig.username || !emailConfig.password) {
      alert('Please fill in all required email configuration fields');
      return;
    }

    updateEmailMutation.mutate(emailConfig);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Configure email, SMS, and WhatsApp notifications for different events
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {[
            { id: 'events', label: 'Event Channels', icon: Settings },
            { id: 'sms', label: 'SMS Gateway', icon: Phone },
            { id: 'whatsapp', label: 'WhatsApp API', icon: MessageSquare },
            { id: 'email', label: 'Email Config', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Event Channels Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enabled
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Mail className="h-4 w-4 inline" /> Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Phone className="h-4 w-4 inline" /> SMS
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4 inline" /> WhatsApp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(eventTypes).map(([key, label]) => {
                  const setting = settings[key] || { event_type: key, channels: ['email'], enabled: true };
                  const channels = setting.channels || [];

                  return (
                    <tr key={key} className={!setting.enabled ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500">{key}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEventToggle(key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              setting.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleChannelToggle(key, 'email')}
                          disabled={!setting.enabled}
                          className={`p-2 rounded-lg transition-colors ${
                            channels.includes('email')
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {channels.includes('email') ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleChannelToggle(key, 'sms')}
                          disabled={!setting.enabled}
                          className={`p-2 rounded-lg transition-colors ${
                            channels.includes('sms')
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {channels.includes('sms') ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleChannelToggle(key, 'whatsapp')}
                          disabled={!setting.enabled}
                          className={`p-2 rounded-lg transition-colors ${
                            channels.includes('whatsapp')
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-gray-100 text-gray-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {channels.includes('whatsapp') ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SMS Gateway Tab */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              SMS Gateway Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway API Endpoint
                </label>
                <input
                  type="url"
                  value={smsConfig.gateway_url}
                  onChange={(e) => setSmsConfig({ ...smsConfig, gateway_url: e.target.value })}
                  placeholder="https://api.sms-gateway.com/send"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={smsConfig.api_key}
                  onChange={(e) => setSmsConfig({ ...smsConfig, api_key: e.target.value })}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender ID
                </label>
                <input
                  type="text"
                  value={smsConfig.sender_id}
                  onChange={(e) => setSmsConfig({ ...smsConfig, sender_id: e.target.value })}
                  placeholder="BKBHRT"
                  maxLength={11}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 11 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Format
                </label>
                <select
                  value={smsConfig.request_format}
                  onChange={(e) => setSmsConfig({ ...smsConfig, request_format: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="json">JSON</option>
                  <option value="form">Form-Encoded</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveSMSConfig}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Configuration
                </button>

                <button
                  onClick={handleSMSTest}
                  disabled={testSMSMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testSMSMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Test SMS
                </button>
              </div>
            </div>
          </div>

          {/* Test SMS Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Test SMS Configuration</h3>
            <div className="space-y-3">
              <input
                type="tel"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Enter test phone number (10 digits)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-600">
                A test SMS will be sent to this number using the configured gateway.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Business API Tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp Business API Configuration
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You need a WhatsApp Business Account approved by Meta</li>
                    <li>Templates must be pre-approved before sending</li>
                    <li>Get credentials from Meta Business Manager</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp API URL
                </label>
                <input
                  type="url"
                  value={whatsappConfig.api_url}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_url: e.target.value })}
                  placeholder="https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={whatsappConfig.access_token}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, access_token: e.target.value })}
                  placeholder="Enter WhatsApp Business API access token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={whatsappConfig.phone_number_id}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID
                </label>
                <input
                  type="text"
                  value={whatsappConfig.business_account_id}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, business_account_id: e.target.value })}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveWhatsAppConfig}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Configuration
                </button>

                <button
                  onClick={handleSyncTemplates}
                  disabled={syncTemplatesMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {syncTemplatesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync Templates
                </button>

                <button
                  onClick={handleWhatsAppTest}
                  disabled={testWhatsAppMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testWhatsAppMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Test WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* Test WhatsApp Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Test WhatsApp Configuration</h3>
            <div className="space-y-3">
              <input
                type="tel"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Enter test phone number (10 digits)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-600">
                A test WhatsApp message will be sent to this number.
              </p>
            </div>
          </div>

          {/* WhatsApp Templates */}
          {(() => {
            const firstSetting = settings[Object.keys(settings)[0]];
            const templates = firstSetting?.whatsapp_templates;
            
            if (!templates || !Array.isArray(templates) || templates.length === 0) {
              return null;
            }

            return (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">WhatsApp Templates</h3>
                <div className="space-y-3">
                  {templates.map((template: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500">
                            Status: <span className={template.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}>
                              {template.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {template.language?.code || 'en'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Email Configuration Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email (SMTP) Configuration
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">SMTP Email Configuration</p>
                  <p>Configure your SMTP server details to send transactional emails. Common providers: Gmail, SendGrid, Mailgun, Amazon SES.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  value={emailConfig.host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port *
                </label>
                <input
                  type="number"
                  value={emailConfig.port}
                  onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value) })}
                  placeholder="587"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encryption *
                </label>
                <select
                  value={emailConfig.encryption}
                  onChange={(e) => setEmailConfig({ ...emailConfig, encryption: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tls">TLS (Port 587)</option>
                  <option value="ssl">SSL (Port 465)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username *
                </label>
                <input
                  type="text"
                  value={emailConfig.username}
                  onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password *
                </label>
                <input
                  type="password"
                  value={emailConfig.password}
                  onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                  placeholder="Enter password or app password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email Address *
                </label>
                <input
                  type="email"
                  value={emailConfig.from_address}
                  onChange={(e) => setEmailConfig({ ...emailConfig, from_address: e.target.value })}
                  placeholder="noreply@bookbharat.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Name *
                </label>
                <input
                  type="text"
                  value={emailConfig.from_name}
                  onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                  placeholder="BookBharat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveEmailConfig}
                disabled={updateEmailMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Email Configuration
              </button>
            </div>
          </div>

          {/* Common SMTP Providers Help */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Common SMTP Providers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">Gmail</div>
                <div className="text-gray-600 space-y-1">
                  <p>Host: smtp.gmail.com</p>
                  <p>Port: 587 (TLS)</p>
                  <p>Note: Use App Password, not regular password</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">SendGrid</div>
                <div className="text-gray-600 space-y-1">
                  <p>Host: smtp.sendgrid.net</p>
                  <p>Port: 587 (TLS)</p>
                  <p>Username: apikey</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">Mailgun</div>
                <div className="text-gray-600 space-y-1">
                  <p>Host: smtp.mailgun.org</p>
                  <p>Port: 587 (TLS)</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">Amazon SES</div>
                <div className="text-gray-600 space-y-1">
                  <p>Host: email-smtp.region.amazonaws.com</p>
                  <p>Port: 587 (TLS)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Email Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Test Email Configuration</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Enter test email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => {
                  setTestChannel('email');
                  handleTestNotification();
                }}
                disabled={testNotificationMutation.isPending || !testRecipient}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testNotificationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Test Email
              </button>
              <p className="text-sm text-gray-600">
                A test email will be sent to this address using the configured SMTP server.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;

