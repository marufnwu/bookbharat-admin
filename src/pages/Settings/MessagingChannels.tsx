import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Phone, AlertCircle, Loader2, Settings, FileText, Save } from 'lucide-react';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';

interface ChannelConfig {
  provider: string;
  credentials: any;
  is_active: boolean;
  sensitive_keys?: string[];
  test_recipient?: string;
}

/**
 * Provider connections: credentials (editable, saved to DB overrides on the
 * backend; sensitive values masked server-side) and a test button per
 * channel. Delivery statistics live on the Messaging Dashboard; template
 * content on Message Templates; event routing on Notification Events.
 */
const MessagingChannels: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('email');
  const [testingChannel, setTestingChannel] = useState('');
  const [savingChannel, setSavingChannel] = useState('');

  const [emailConfig, setEmailConfig] = useState<ChannelConfig | null>(null);
  const [smsConfig, setSmsConfig] = useState<ChannelConfig | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<ChannelConfig | null>(null);

  // Draft edits per channel: key = field name; sensitive fields store only
  // newly typed values (empty = keep existing)
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await api.get('/settings/messaging/channels');
      const channels = response.data.channels;

      if (channels.email?.[0]) setEmailConfig(channels.email[0]);
      if (channels.sms?.[0]) setSmsConfig(channels.sms[0]);
      if (channels.whatsapp?.[0]) setWhatsappConfig(channels.whatsapp[0]);
      setDrafts({});
    } catch (error) {
      console.error('Failed to load channels:', error);
      toast.error('Failed to load channel configurations');
    }
  };

  const draftFor = (channel: string) => drafts[channel] || {};

  const setDraftField = (channel: string, field: string, value: any) => {
    setDrafts((prev) => ({ ...prev, [channel]: { ...(prev[channel] || {}), [field]: value } }));
  };

  const saveChannel = async (channel: string, config: ChannelConfig | null) => {
    if (!config) return;
    const draft = draftFor(channel);

    const payload: any = {};
    if (typeof draft.is_active === 'boolean') payload.is_active = draft.is_active;
    if (draft.credentials && Object.keys(draft.credentials).length > 0) payload.credentials = draft.credentials;
    if (channel === 'whatsapp' && draft.test_recipient !== undefined) payload.test_recipient = draft.test_recipient;

    if (Object.keys(payload).length === 0) {
      toast('No changes to save');
      return;
    }

    setSavingChannel(channel);
    try {
      const response = await api.put(`/settings/messaging/channels/${channel}`, payload);
      if (response.data.success) {
        toast.success(response.data.message);
        await loadChannels();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSavingChannel('');
    }
  };

  const testChannel = async (channel: string) => {
    setTestingChannel(channel);
    try {
      const response = await api.post(`/settings/messaging/channels/${channel}/test`);
      if (response.data.success) {
        toast.success(`${channel.toUpperCase()} connection successful!`);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Connection test failed');
    } finally {
      setTestingChannel('');
    }
  };

  const isSensitive = (channel: string, config: ChannelConfig | null, field: string) =>
    (config?.sensitive_keys || ['password', 'api_key', 'access_token']).includes(field);

  const renderConfigField = (channel: string, config: ChannelConfig | null, fieldKey: string, label: string) => {
    const draft = draftFor(channel);
    const sensitive = isSensitive(channel, config, fieldKey);
    const existing = config?.credentials?.[fieldKey];
    const value = draft.credentials?.[fieldKey] ?? '';

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {sensitive && existing ? (
            <span className="ml-2 text-xs text-green-600">(set)</span>
          ) : sensitive && !existing ? (
            <span className="ml-2 text-xs text-gray-400">(not set)</span>
          ) : null}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setDraftField(channel, 'credentials', { ...(draft.credentials || {}), [fieldKey]: e.target.value })}
          placeholder={sensitive ? (existing ? '•••••••• (enter new value to replace)' : 'Not configured') : (existing || 'Not configured')}
          className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            draft.credentials?.[fieldKey] !== undefined && draft.credentials?.[fieldKey] !== ''
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        />
      </div>
    );
  };

  const renderTabButton = (id: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setSelectedTab(id)}
      className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
        selectedTab === id
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );

  const renderEnvNotice = () => (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">Editable Configuration</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Values shown pre-fill from <code className="bg-blue-100 px-1.5 py-0.5 rounded">.env</code> defaults; edits are saved as database overrides (no deploy needed) and take effect immediately.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Sensitive fields (password, API key, access token) are masked — leave blank to keep the current value, or type a new one to replace it</li>
              <li>Use the Test Connection button to verify after saving</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveToggle = (channel: string, config: ChannelConfig | null) => {
    const active = draftFor(channel).is_active ?? config?.is_active ?? false;
    return (
      <label className="flex items-center cursor-pointer">
        <span className="text-sm text-gray-600 mr-2">Active</span>
        <button
          type="button"
          onClick={() => setDraftField(channel, 'is_active', !active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </label>
    );
  };

  const renderSaveButton = (channel: string, config: ChannelConfig | null) => (
    <div className="mt-6 flex gap-3">
      <button
        onClick={() => saveChannel(channel, config)}
        disabled={savingChannel === channel}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {savingChannel === channel ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Save className="-ml-1 mr-2 h-4 w-4" />}
        Save Changes
      </button>
      <button
        onClick={() => testChannel(channel)}
        disabled={testingChannel === channel}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {testingChannel === channel && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
        Test Connection
      </button>
    </div>
  );

  const renderEmailConfig = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-900">Email Channel</h2>
          {(draftFor('email').is_active ?? emailConfig?.is_active) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        {renderActiveToggle('email', emailConfig)}
      </div>

      {renderEnvNotice()}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderConfigField('email', emailConfig, 'host', 'SMTP Host')}
          {renderConfigField('email', emailConfig, 'port', 'SMTP Port')}
          {renderConfigField('email', emailConfig, 'encryption', 'Encryption')}
          {renderConfigField('email', emailConfig, 'username', 'Username')}
          {renderConfigField('email', emailConfig, 'password', 'Password')}
          {renderConfigField('email', emailConfig, 'from_email', 'From Email')}
          {renderConfigField('email', emailConfig, 'from_name', 'From Name')}
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Settings className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            ENV Variables: <code className="bg-white px-2 py-1 rounded text-xs">MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_ENABLED</code>
          </span>
        </div>
      </div>

      {renderSaveButton('email', emailConfig)}
    </div>
  );

  const renderSMSConfig = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-900">SMS Channel (TextLocal)</h2>
          {(draftFor('sms').is_active ?? smsConfig?.is_active) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        {renderActiveToggle('sms', smsConfig)}
      </div>

      {renderEnvNotice()}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {renderConfigField('sms', smsConfig, 'api_key', 'TextLocal API Key')}
          {renderConfigField('sms', smsConfig, 'sender_id', 'Sender ID')}
          {renderConfigField('sms', smsConfig, 'template_id', 'Template ID')}
          {renderConfigField('sms', smsConfig, 'api_url', 'API URL')}
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Settings className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            ENV Variables: <code className="bg-white px-2 py-1 rounded text-xs">SMS_API_KEY, SMS_SENDER_ID, SMS_TEMPLATE_ID, SMS_API_URL, SMS_ENABLED</code>
          </span>
        </div>
      </div>

      {renderSaveButton('sms', smsConfig)}
    </div>
  );

  const renderWhatsAppConfig = () => {
    const draftTestRecipient = draftFor('whatsapp').test_recipient;
    const testRecipient = draftTestRecipient !== undefined ? draftTestRecipient : (whatsappConfig?.test_recipient || '');
    return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Phone className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-900">WhatsApp Channel (Meta API)</h2>
          {(draftFor('whatsapp').is_active ?? whatsappConfig?.is_active) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        {renderActiveToggle('whatsapp', whatsappConfig)}
      </div>

      {renderEnvNotice()}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {renderConfigField('whatsapp', whatsappConfig, 'access_token', 'Access Token')}
          {renderConfigField('whatsapp', whatsappConfig, 'phone_number_id', 'Phone Number ID')}
          {renderConfigField('whatsapp', whatsappConfig, 'business_account_id', 'Business Account ID')}
          {renderConfigField('whatsapp', whatsappConfig, 'api_version', 'API Version')}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Recipient</label>
            <input
              type="text"
              value={testRecipient}
              onChange={(e) => setDraftField('whatsapp', 'test_recipient', e.target.value)}
              placeholder="e.g. +919999999999 (redirects all non-OTP sends)"
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 focus:bg-blue-50"
            />
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Settings className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            ENV Variables: <code className="bg-white px-2 py-1 rounded text-xs">WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ENABLED</code>
          </span>
        </div>

        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <FileText className="h-5 w-5 text-yellow-600 mr-2" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Template Management</p>
            <p className="mt-1">Manage WhatsApp templates in <a href="/settings/message-templates" className="underline font-medium">Message Templates</a></p>
          </div>
        </div>
      </div>

      {renderSaveButton('whatsapp', whatsappConfig)}
    </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messaging Channels</h1>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {renderTabButton('email', 'Email', <Mail className="w-5 h-5" />)}
          {renderTabButton('sms', 'SMS', <MessageSquare className="w-5 h-5" />)}
          {renderTabButton('whatsapp', 'WhatsApp', <Phone className="w-5 h-5" />)}
        </nav>
      </div>

      {selectedTab === 'email' && renderEmailConfig()}
      {selectedTab === 'sms' && renderSMSConfig()}
      {selectedTab === 'whatsapp' && renderWhatsAppConfig()}
    </div>
  );
};

export default MessagingChannels;
