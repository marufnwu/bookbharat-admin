import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Phone, AlertCircle, Loader2, Settings, FileText } from 'lucide-react';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';

interface ChannelConfig {
  provider: string;
  credentials: any;
  is_active: boolean;
}

interface ChannelStats {
  total: number;
  success_rate: number;
}

const MessagingChannels: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('email');
  const [testingChannel, setTestingChannel] = useState('');
  
  const [emailConfig, setEmailConfig] = useState<ChannelConfig | null>(null);
  const [smsConfig, setSmsConfig] = useState<ChannelConfig | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<ChannelConfig | null>(null);
  const [stats, setStats] = useState<{ email?: ChannelStats; sms?: ChannelStats; whatsapp?: ChannelStats }>({});

  useEffect(() => {
    loadChannels();
    loadStats();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await api.get('/settings/messaging/channels');
      const channels = response.data.channels;
      
      if (channels.email?.[0]) setEmailConfig(channels.email[0]);
      if (channels.sms?.[0]) setSmsConfig(channels.sms[0]);
      if (channels.whatsapp?.[0]) setWhatsappConfig(channels.whatsapp[0]);
    } catch (error) {
      console.error('Failed to load channels:', error);
      toast.error('Failed to load channel configurations');
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/settings/messaging/statistics');
      setStats(response.data.statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
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

  const renderConfigField = (label: string, value: string | undefined, isSensitive: boolean = false) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-600 font-mono">
        {isSensitive && value ? '••••••••••••••••' : (value || <span className="text-gray-400 italic">Not configured</span>)}
      </div>
    </div>
  );

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
          <h3 className="text-sm font-medium text-blue-800">Configuration Managed via Environment Variables</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Channel credentials are configured in your <code className="bg-blue-100 px-1.5 py-0.5 rounded">.env</code> file for security and deployment flexibility. To update credentials:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Update the corresponding environment variables in <code className="bg-blue-100 px-1.5 py-0.5 rounded">.env</code></li>
              <li>Restart the backend server</li>
              <li>Test the connection on this page</li>
            </ol>
            <p className="mt-2">
              <a href="#" className="font-medium underline" onClick={(e) => { e.preventDefault(); toast('Check config/messaging.php for ENV variable names'); }}>
                View ENV variable reference
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailConfig = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-900">Email Channel</h2>
          {emailConfig?.is_active && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        {stats.email && (
          <div className="text-sm text-gray-500">
            Success Rate: <span className="font-medium text-gray-900">{stats.email.success_rate.toFixed(1)}%</span> 
            <span className="mx-1">({stats.email.total} sent)</span>
          </div>
        )}
      </div>

      {renderEnvNotice()}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderConfigField('SMTP Host', emailConfig?.credentials.host)}
          {renderConfigField('SMTP Port', emailConfig?.credentials.port)}
          {renderConfigField('Encryption', emailConfig?.credentials.encryption)}
          {renderConfigField('Username', emailConfig?.credentials.username)}
          {renderConfigField('Password', emailConfig?.credentials.password, true)}
          {renderConfigField('From Email', emailConfig?.credentials.from_email)}
          {renderConfigField('From Name', emailConfig?.credentials.from_name)}
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Settings className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            ENV Variables: <code className="bg-white px-2 py-1 rounded text-xs">MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_ENABLED</code>
          </span>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => testChannel('email')}
          disabled={testingChannel === 'email' || !emailConfig?.is_active}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {testingChannel === 'email' && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
          Test Connection
        </button>
      </div>
    </div>
  );

  const renderSMSConfig = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-900">SMS Channel (TextLocal)</h2>
          {smsConfig?.is_active && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        {stats.sms && (
          <div className="text-sm text-gray-500">
            Success Rate: <span className="font-medium text-gray-900">{stats.sms.success_rate.toFixed(1)}%</span>
            <span className="mx-1">({stats.sms.total} sent)</span>
          </div>
        )}
      </div>

      {renderEnvNotice()}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {renderConfigField('TextLocal API Key', smsConfig?.credentials.api_key, true)}
          {renderConfigField('Sender ID', smsConfig?.credentials.sender_id)}
          {renderConfigField('API URL', smsConfig?.credentials.api_url)}
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Settings className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">
            ENV Variables: <code className="bg-white px-2 py-1 rounded text-xs">SMS_API_KEY, SMS_SENDER_ID, SMS_ENABLED</code>
          </span>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => testChannel('sms')}
          disabled={testingChannel === 'sms' || !smsConfig?.is_active}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {testingChannel === 'sms' && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
          Test Connection
        </button>
      </div>
    </div>
  );

  const renderWhatsAppConfig = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Phone className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-900">WhatsApp Channel (Meta API)</h2>
          {whatsappConfig?.is_active && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
        {stats.whatsapp && (
          <div className="text-sm text-gray-500">
            Success Rate: <span className="font-medium text-gray-900">{stats.whatsapp.success_rate.toFixed(1)}%</span>
            <span className="mx-1">({stats.whatsapp.total} sent)</span>
          </div>
        )}
      </div>

      {renderEnvNotice()}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {renderConfigField('Access Token', whatsappConfig?.credentials.access_token, true)}
          {renderConfigField('Phone Number ID', whatsappConfig?.credentials.phone_number_id)}
          {renderConfigField('Business Account ID', whatsappConfig?.credentials.business_account_id)}
          {renderConfigField('API Version', whatsappConfig?.credentials.api_version)}
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
            <p className="mt-1">Manage WhatsApp templates in <a href="/settings/whatsapp-templates" className="underline font-medium">WhatsApp Templates</a> page</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => testChannel('whatsapp')}
          disabled={testingChannel === 'whatsapp' || !whatsappConfig?.is_active}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {testingChannel === 'whatsapp' && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
          Test Connection
        </button>
      </div>
    </div>
  );

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
