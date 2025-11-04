import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  TestTube,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Bell,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { Button, Input, Badge } from '../../components';
import toast from 'react-hot-toast';

interface CommunicationSetting {
  id: string;
  channel: string;
  provider: string;
  is_active: boolean;
  credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ProviderStructure {
  fields: Array<{
    name?: string;
    key?: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    placeholder?: string;
    default?: any;
    options?: Array<{ value: string; label: string }>;
  }>;
}

interface Provider {
  name: string;
  display_name: string;
  description: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: any[];
}

export default function CommunicationConfig() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL
  const getTabFromPath = (pathname: string): string => {
    if (pathname.includes('/whatsapp')) return 'whatsapp';
    if (pathname.includes('/sms')) return 'sms';
    if (pathname.includes('/email')) return 'email';
    if (pathname.includes('/status')) return 'overview';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [settings, setSettings] = useState<Record<string, CommunicationSetting[]>>({});
  const [providers, setProviders] = useState<Record<string, Provider[]>>({});
  const [providerStructures, setProviderStructures] = useState<Record<string, Record<string, ProviderStructure>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const [providerStats, setProviderStats] = useState<Record<string, any>>({});
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedSetting, setSelectedSetting] = useState<CommunicationSetting | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Sync tab with URL changes
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    if (tab !== activeTab) {
      setActiveTab(tab);
      // Also set selectedChannel for the tab
      if (tab !== 'overview') {
        setSelectedChannel(tab);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    fetchAllData();
    fetchProviderStatistics();
  }, []);

  const fetchProviderStatistics = async () => {
    try {
      const response = await api.get('/communication/statistics');
      if (response.data.success && response.data.data) {
        const statsMap: Record<string, any> = {};
        response.data.data.forEach((stat: any) => {
          statsMap[String(stat.provider_id)] = stat;
        });
        setProviderStats(statsMap);
      }
    } catch (error) {
      console.error('Failed to fetch provider statistics:', error);
      // Don't show error toast for stats - it's not critical
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchProviderStructures(),
      ]);
    } catch (error) {
      toast.error('Failed to load communication data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/communication');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to fetch communication settings');
    }
  };

  const fetchProviders = async (channelType: string) => {
    try {
      const response = await api.get(`/communication/providers/${channelType}`);
      setProviders(prev => ({ ...prev, [channelType]: response.data.data }));
    } catch (error) {
      console.error(`Failed to fetch ${channelType} providers:`, error);
      toast.error(`Failed to fetch ${channelType} providers`);
    }
  };

  const fetchProviderStructures = async () => {
    try {
      const response = await api.get('/communication/provider-structures');
      setProviderStructures(response.data.data);
    } catch (error) {
      console.error('Failed to fetch provider structures:', error);
      toast.error('Failed to fetch provider structures');
    }
  };

  const fetchWhatsappTemplates = async () => {
    try {
      const response = await api.get('/communication/whatsapp/templates');
      if (response.data.success) {
        setWhatsappTemplates(response.data.templates || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch WhatsApp templates:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch WhatsApp templates');
    }
  };

  const handleSyncTemplates = async () => {
    setIsSyncingTemplates(true);
    try {
      const response = await api.post('/communication/whatsapp/templates/sync');
      if (response.data.success) {
        const syncedCount = response.data.synced_count || 0;
        const totalTemplates = response.data.total_templates || 0;
        toast.success(
          `Synced ${syncedCount} out of ${totalTemplates} templates successfully`,
          { duration: 5000 }
        );
        // Refresh templates list after sync
        await fetchWhatsappTemplates();
      } else {
        toast.error(response.data.error || 'Failed to sync templates');
      }
    } catch (error: any) {
      console.error('Failed to sync templates:', error);
      let errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Failed to sync templates';
      
      // Provide helpful hints for common errors
      if (error.response?.data?.hint) {
        errorMessage += '. ' + error.response.data.hint;
      }
      
      if (errorMessage.includes('Business Account ID') || errorMessage.includes('business_account_id')) {
        toast.error(errorMessage, { duration: 8000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSyncingTemplates(false);
    }
  };

  const handleChannelTabChange = (channel: string) => {
    setActiveTab(channel);
    // Update URL when tab changes
    if (channel === 'overview') {
      navigate('/communication');
      setSelectedChannel(''); // Clear selected channel for overview
    } else {
      navigate(`/communication/${channel}`);
      setSelectedChannel(channel);
      // Fetch providers if not already loaded
      if (!providers[channel]) {
        fetchProviders(channel);
      }
    }
  };

  const handleAddSetting = (channel?: string) => {
    const channelToUse = channel || selectedChannel;
    if (!channelToUse) {
      toast.error('Please select a channel first');
      return;
    }
    setSelectedChannel(channelToUse);
    setSelectedProvider('');
    setFormData({});
    setSelectedSetting(null);
    setIsAddDialogOpen(true);
    // Fetch providers if not already loaded
    if (!providers[channelToUse]) {
      fetchProviders(channelToUse);
    }
    // Ensure provider structures are loaded
    if (!providerStructures[channelToUse]) {
      fetchProviderStructures();
    }
  };

  // Helper to detect if a value is masked (contains only asterisks and a few trailing chars)
  const isMaskedValue = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    // Masked values typically look like: "********ZDZD" or "*****************"
    return /^\*{4,}/.test(value) || (value.length > 8 && value.replace(/\*/g, '').length <= 4);
  };

  const handleEditSetting = async (setting: CommunicationSetting) => {
    try {
      // Validate setting has required fields
      if (!setting.channel || !setting.provider) {
        toast.error('Invalid configuration: missing channel or provider');
        console.error('Invalid setting:', setting);
        return;
      }
      
      setSelectedSetting(setting);
      setSelectedChannel(setting.channel);
      setSelectedProvider(setting.provider);
      
      // Get provider structure - check state first, then fetch if needed
      let structure = providerStructures[setting.channel]?.[setting.provider];
      
      if (!structure) {
        // Try fetching all provider structures first
        try {
          const response = await api.get('/communication/provider-structures');
          if (response.data.success && response.data.data) {
            const allStructures = response.data.data;
            structure = allStructures[setting.channel]?.[setting.provider];
            
            // Update state for future use
            setProviderStructures(allStructures);
          }
        } catch (error) {
          console.error('Failed to fetch all provider structures:', error);
        }
        
        // If still not available, try fetching specific provider structure
        if (!structure && setting.channel && setting.provider) {
          try {
            const response = await api.get(`/communication/providers/${setting.channel}/${setting.provider}`);
            if (response.data.success && response.data.data) {
              structure = response.data.data;
              
              // Update state
              setProviderStructures(prev => ({
                ...prev,
                [setting.channel]: {
                  ...(prev[setting.channel] || {}),
                  [setting.provider]: structure
                }
              }));
            }
          } catch (error: any) {
            console.error('Failed to fetch provider structure:', error);
            toast.error(`Failed to load provider structure: ${error.response?.data?.error || error.message}`);
          }
        }
      }
      
      // Load existing credentials (now plain values, no masking)
      const existingCredentials = setting.credentials || {};
      
      if (structure && structure.fields && Array.isArray(structure.fields)) {
        const fullFormData: Record<string, any> = {};
        structure.fields.forEach((field: any) => {
          const fieldKey = field.name || field.key;
          if (!fieldKey) return; // Skip invalid fields
          
          const existingValue = existingCredentials[fieldKey];
          
          // Load real values directly (no masking check needed)
          if (existingValue !== undefined && existingValue !== null) {
            fullFormData[fieldKey] = existingValue;
          } else {
            // Use default or empty string for missing fields
            fullFormData[fieldKey] = field.default || '';
          }
        });
        setFormData(fullFormData);
      } else {
        // Use credentials directly if structure not available
        setFormData(existingCredentials);
      }
      
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error loading edit form:', error);
      toast.error('Failed to load edit form. Please try again.');
    }
  };

  const handleSaveSetting = async (isEdit = false) => {
    // Validation
    if (!selectedChannel) {
      toast.error('Please select a channel');
      return;
    }

    if (!selectedProvider && !isEdit) {
      toast.error('Please select a provider');
      return;
    }

    // Validate required fields
    const providerStructure = providerStructures[selectedChannel]?.[selectedProvider];
    if (providerStructure) {
      const requiredFields = providerStructure.fields.filter((f: any) => f.required);
      const missingFields = requiredFields.filter((field: any) => {
        const fieldKey = field.name || field.key;
        const formValue = formData[fieldKey];
        const defaultValue = field.default;
        // Field is valid if it has a value in formData OR has a default value
        const value = formValue !== undefined && formValue !== '' ? formValue : defaultValue;
        // For number fields, 0 is valid
        if (field.type === 'number') {
          return value === undefined || value === null || value === '';
        }
        return !value || (typeof value === 'string' && value.trim() === '');
      });

      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.map((f: any) => f.label).join(', ')}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      // Prepare credentials for saving
      // IMPORTANT: For edit mode, don't send unchanged sensitive fields (they're masked in the response)
      const providerStructure = providerStructures[selectedChannel]?.[selectedProvider];
      let cleanedFormData: Record<string, any> = {};
      
      // Get original credentials if editing to check what was masked
      const originalCredentials = isEdit && selectedSetting ? (selectedSetting.credentials || {}) : {};
      
      if (providerStructure) {
        providerStructure.fields.forEach((field: any) => {
          const fieldKey = field.name || field.key;
          // Get value from formData, or use default if available and not in formData
          const formValue = formData[fieldKey];
          const defaultValue = field.default !== undefined ? field.default : null;
          const value = formValue !== undefined && formValue !== '' ? formValue : (defaultValue !== null ? defaultValue : formValue);
          
          const originalValue = originalCredentials[fieldKey];
          // Note: No longer masking, so wasMasked will always be false
          const wasMasked = false;
          
          // Check if this is a sensitive field (password/token)
          const isSensitiveField = field.type === 'password' || 
                                   fieldKey.toLowerCase().includes('token') ||
                                   fieldKey.toLowerCase().includes('password') ||
                                   fieldKey.toLowerCase().includes('secret');
          
          // Strategy (backend now merges credentials, so we only send changed fields):
          // 1. Required fields: always include (with value, default, or empty for validation)
          // 2. Optional non-sensitive: include if has value
          // 3. Sensitive in edit mode: 
          //    - If was masked and value is empty -> skip (backend keeps original via merge)
          //    - If has new value -> include (will override)
          
          // For sensitive fields in edit mode: if user didn't change, keep original
          // Since we show plain values now, we check if the value matches original
          if (isSensitiveField && isEdit && originalValue && 
              (!value || (typeof value === 'string' && value.trim() === ''))) {
            // User didn't enter new value, skip to preserve original via merge
          } else if (field.required) {
            // Required fields: always include
            // For new settings: send value, default, or empty (backend validates)
            // For edit: only skip if was masked and empty (backend keeps original)
            if (!isEdit) {
              // New setting: always send required fields
              // Use form value if present, otherwise default, otherwise empty string
              if (formValue !== undefined && formValue !== null && formValue !== '') {
                cleanedFormData[fieldKey] = formValue;
              } else if (defaultValue !== null && defaultValue !== undefined) {
                cleanedFormData[fieldKey] = defaultValue;
              } else {
                cleanedFormData[fieldKey] = '';
              }
            } else {
              // Edit mode: send if has value
              if (value !== undefined && value !== null && value !== '') {
                cleanedFormData[fieldKey] = value;
              } else if (originalValue === undefined || originalValue === null) {
                // If original was empty, send empty for validation
                cleanedFormData[fieldKey] = '';
              }
              // If original had a value and user didn't change it, skip - backend keeps original via merge
            }
          } else if (value !== undefined && value !== null && value !== '') {
            // Optional field with value: always include
            cleanedFormData[fieldKey] = value;
          }
          // Skip optional empty fields
        });
      } else {
        // Fallback: filter out empty optional fields
        Object.keys(formData).forEach(key => {
          const value = formData[key];
          if (value !== undefined && value !== null && value !== '') {
            cleanedFormData[key] = value;
          }
        });
      }
      
      const payload = {
        channel: selectedChannel,
        provider: selectedProvider,
        credentials: cleanedFormData,
        is_active: true,
      };

      const response = isEdit && selectedSetting
        ? await api.put(`/communication/${selectedSetting.id}`, payload)
        : await api.post('/communication', payload);

      if (response.data.success) {
        toast.success(isEdit ? 'Setting updated successfully' : 'Setting created successfully');
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedProvider('');
        setFormData({});
        setSelectedSetting(null);
        await fetchSettings();
      } else {
        toast.error(response.data.error || 'Failed to save setting');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.response?.data?.details 
        || 'Failed to save setting';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    if (!window.confirm('Are you sure you want to delete this communication setting?')) {
      return;
    }

    try {
      const response = await api.delete(`/communication/${settingId}`);
      if (response.data.success) {
        toast.success('Setting deleted successfully');
        await fetchSettings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete setting');
    }
  };

  const handleTestConnection = async (channel: string, testTo?: string) => {
    setIsTesting({ ...isTesting, [channel]: true });
    try {
      const payload: any = {};
      if (testTo) {
        if (channel === 'whatsapp') {
          payload.test_to = testPhone;
        } else if (channel === 'sms') {
          payload.test_to = testPhone;
        } else if (channel === 'email') {
          payload.test_to = testEmail;
        }
      }

      const response = await api.post(`/communication/test/${channel}`, payload);
      setTestResults({ ...testResults, [channel]: response.data });

      toast(response.data.success ? 'Connection test successful' : response.data.error || 'Test failed');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Test failed';
      setTestResults({ ...testResults, [channel]: { success: false, error: errorMsg } });
      toast.error(errorMsg);
    } finally {
      setIsTesting({ ...isTesting, [channel]: false });
    }
  };

  const renderFormField = (field: any) => {
    // Support both 'name' and 'key' for field identifier
    const fieldKey = field.name || field.key;
    const value = formData[fieldKey] || field.default || '';

    switch (field.type) {
      case 'password':
        return (
          <Input
            type="password"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            placeholder={field.placeholder || field.description}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            placeholder={field.placeholder || field.description}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                setFormData({ ...formData, [fieldKey]: '' });
              } else {
                const numValue = Number(inputValue);
                setFormData({ ...formData, [fieldKey]: isNaN(numValue) ? value : numValue });
              }
            }}
            placeholder={field.placeholder || field.description}
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            placeholder={field.description}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            placeholder={field.placeholder || field.description}
          />
        );
    }
  };

  const renderChannelSettings = (channel: string) => {
    const channelSettings = settings[channel] || [];
    const channelIcon = channel === 'email' ? Mail : channel === 'sms' ? Phone : MessageSquare;
    const Icon = channelIcon;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <h3 className="text-lg font-semibold capitalize">{channel} Settings</h3>
          </div>
          <Button onClick={() => handleAddSetting(channel)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Configuration
          </Button>
        </div>

        {channelSettings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No {channel} configurations found</p>
            <p className="text-sm text-gray-500">Add a configuration to start sending {channel} messages</p>
          </div>
        ) : (
          <div className="space-y-4">
            {channelSettings.map((setting) => (
              <div key={setting.id} className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                        {setting.provider}
                      </Badge>
                      {setting.is_active && (
                        <Badge variant="success" className="text-green-600 bg-green-100">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(channel)}
                        disabled={isTesting[channel]}
                      >
                        {isTesting[channel] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleEditSetting(setting).catch(err => {
                            toast.error('Failed to load edit form');
                            console.error(err);
                          });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {/* Events Using This Provider Section */}
                  {providerStats[setting.id]?.events_configured && providerStats[setting.id].events_configured.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Events Configured ({providerStats[setting.id].events_configured_count})
                          </span>
                        </div>
                        <Link
                          to="/notifications"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                        >
                          Configure Events
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {providerStats[setting.id].events_configured.map((event: any, idx: number) => (
                          <Link
                            key={idx}
                            to="/notifications"
                            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            {event.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!providerStats[setting.id] || !providerStats[setting.id].events_configured || providerStats[setting.id].events_configured.length === 0) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">No Events Configured</span>
                        </div>
                        <Link
                          to="/notifications"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                        >
                          Configure Events
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        This provider is not currently used by any notification events. 
                        Enable this channel for events in the Notification Preferences.
                      </p>
                    </div>
                  )}
                  
                  {/* Provider Statistics */}
                  {providerStats[setting.id] && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Usage Statistics</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Sent</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {providerStats[setting.id].total.sent.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                          <p className={`text-lg font-semibold ${
                            providerStats[setting.id].total.success_rate >= 95 
                              ? 'text-green-600' 
                              : providerStats[setting.id].total.success_rate >= 80 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                          }`}>
                            {providerStats[setting.id].total.success_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last 7 Days</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {providerStats[setting.id].last_7_days.total.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Events Using</p>
                          {providerStats[setting.id].events_count > 0 ? (
                            <Link
                              to="/notifications"
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              {providerStats[setting.id].events_count}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <p className="text-lg font-semibold text-gray-900">0</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Configuration Details */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Configuration Details
                    </h4>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(setting.credentials).map(([key, value]) => {
                          const isSensitive = key.toLowerCase().includes('password') || 
                                            key.toLowerCase().includes('token') || 
                                            key.toLowerCase().includes('secret') || 
                                            key.toLowerCase().includes('key') ||
                                            key.toLowerCase().includes('api_key') ||
                                            key.toLowerCase().includes('access_token');
                          
                          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          const displayValue = value !== null && value !== undefined ? String(value) : 'Not set';
                          
                          return (
                            <div 
                              key={key} 
                              className="bg-white rounded-md border border-gray-200 p-3 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    {displayKey}
                                  </p>
                                  {isSensitive ? (
                                    <div className="flex items-center space-x-2">
                                      <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                                        {displayValue}
                                      </code>
                                      <span className="px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-100 rounded">
                                        Sensitive
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900 break-all">
                                      {displayValue}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {testResults[channel] && (
                    <div className={`mt-4 p-3 rounded-lg ${testResults[channel].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center">
                        {testResults[channel].success ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        <span className={testResults[channel].success ? 'text-green-800' : 'text-red-800'}>
                          {testResults[channel].message || testResults[channel].error}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication Configuration</h1>
          <p className="text-gray-600">Manage email, SMS, and WhatsApp communication settings</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'email', 'sms', 'whatsapp'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleChannelTabChange(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => handleChannelTabChange('email')}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left w-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-2xl font-bold">{settings.email?.length || 0}</p>
                    <p className="text-xs text-gray-500">configurations</p>
                  </div>
                  <Mail className="h-8 w-8 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => handleChannelTabChange('sms')}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left w-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SMS</p>
                    <p className="text-2xl font-bold">{settings.sms?.length || 0}</p>
                    <p className="text-xs text-gray-500">configurations</p>
                  </div>
                  <Phone className="h-8 w-8 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => handleChannelTabChange('whatsapp')}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left w-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">WhatsApp</p>
                    <p className="text-2xl font-bold">{settings.whatsapp?.length || 0}</p>
                    <p className="text-xs text-gray-500">configurations</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setIsTestDialogOpen(true)}
                  >
                    <TestTube className="h-6 w-6" />
                    <span>Test Connections</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setIsTemplateDialogOpen(true)}
                  >
                    <Settings className="h-6 w-6" />
                    <span>WhatsApp Templates</span>
                  </Button>
                  <Link
                    to="/notifications"
                    className="h-auto p-4 flex flex-col items-center space-y-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="h-6 w-6 text-gray-600" />
                    <span className="text-gray-700">Event Preferences</span>
                  </Link>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-6 w-6" />
                    <span>Refresh Data</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && renderChannelSettings('email')}
        {activeTab === 'sms' && renderChannelSettings('sms')}
        {activeTab === 'whatsapp' && renderChannelSettings('whatsapp')}
      </div>

      {/* Add/Edit Setting Dialog */}
      {(isAddDialogOpen || isEditDialogOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {isEditDialogOpen ? 'Edit Configuration' : 'Add Configuration'}
              </h2>
              <p className="text-sm text-gray-600">
                Configure your {selectedChannel} settings for {selectedProvider}
              </p>
            </div>
            <div className="p-6 space-y-6">
              {!isEditDialogOpen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
                      const newProvider = e.target.value;
                      setSelectedProvider(newProvider);
                      
                      // Initialize form data with default values when provider is selected
                      if (newProvider) {
                        // Ensure provider structures are loaded
                        if (!providerStructures[selectedChannel]?.[newProvider]) {
                          await fetchProviderStructures();
                        }
                        
                        const structure = providerStructures[selectedChannel]?.[newProvider];
                        if (structure && structure.fields) {
                          const defaultFormData: Record<string, any> = {};
                          structure.fields.forEach((field: any) => {
                            const fieldKey = field.name || field.key;
                            if (field.default !== undefined) {
                              defaultFormData[fieldKey] = field.default;
                            }
                          });
                          setFormData(defaultFormData);
                        } else {
                          setFormData({});
                        }
                      } else {
                        setFormData({});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select provider</option>
                    {providers[selectedChannel]?.map((provider) => (
                      <option key={provider.name} value={provider.name}>
                        {provider.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isEditDialogOpen && selectedSetting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    {providers[selectedChannel]?.find(p => p.name === selectedSetting.provider)?.display_name || selectedSetting.provider}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Provider cannot be changed when editing</p>
                </div>
              )}

              {selectedProvider ? (
                (() => {
                  const structure = providerStructures[selectedChannel]?.[selectedProvider];
                  if (structure && structure.fields && Array.isArray(structure.fields) && structure.fields.length > 0) {
                    return (
                      <div className="space-y-4">
                        <h4 className="font-medium">Configuration Fields</h4>
                        {structure.fields.map((field: any) => {
                          const fieldKey = field.name || field.key;
                          if (!fieldKey) {
                            console.warn('Field missing key/name:', field);
                            return null;
                          }
                          // Show all fields, including optional ones like business_account_id
                          return (
                            <div key={fieldKey} className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                {!field.required && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                              </label>
                              {renderFormField(field)}
                              {field.description && (
                                <p className="text-sm text-gray-500">{field.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else if (isEditDialogOpen && selectedSetting) {
                    // In edit mode, show loading or fallback to showing form fields from existing credentials
                    return (
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">Loading provider configuration...</p>
                        </div>
                        {/* Fallback: Show fields from existing credentials if structure not loaded */}
                        {Object.keys(selectedSetting.credentials || {}).length > 0 && (
                          <div className="space-y-2 border-t pt-4">
                            <p className="text-xs text-gray-500">Loading all fields...</p>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Loading provider configuration...</p>
                      </div>
                    );
                  }
                })()
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    {isEditDialogOpen ? 'Select a provider to view configuration fields' : 'Please select a provider'}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setFormData({});
                  setSelectedProvider('');
                  setSelectedSetting(null);
                  setSelectedChannel('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => handleSaveSetting(isEditDialogOpen)} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isEditDialogOpen ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Dialog */}
      {isTestDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Test Connections</h2>
              <p className="text-sm text-gray-600">
                Test your communication channel connections
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Phone Number
                </label>
                <Input
                  value={testPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestPhone(e.target.value)}
                  placeholder="919876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => handleTestConnection('email', testEmail)}
                  disabled={isTesting.email || !testEmail}
                >
                  {isTesting.email ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Test Email
                </Button>
                <Button
                  onClick={() => handleTestConnection('sms', testPhone)}
                  disabled={isTesting.sms || !testPhone}
                >
                  {isTesting.sms ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  Test SMS
                </Button>
                <Button
                  onClick={() => handleTestConnection('whatsapp', testPhone)}
                  disabled={isTesting.whatsapp || !testPhone}
                >
                  {isTesting.whatsapp ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Test WhatsApp
                </Button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button onClick={() => setIsTestDialogOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Templates Dialog */}
      {isTemplateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">WhatsApp Templates</h2>
              <p className="text-sm text-gray-600">
                View and manage your WhatsApp message templates
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={fetchWhatsappTemplates}
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh Templates
                  </Button>
                  <Button
                    onClick={handleSyncTemplates}
                    disabled={isSyncingTemplates || isLoading}
                  >
                    {isSyncingTemplates ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Templates from Meta
                  </Button>
                </div>
                <Link
                  to="/notifications"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View Approved Templates
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <strong>Sync Templates:</strong> Fetches templates from WhatsApp Meta API and stores them in the database. 
                This allows you to assign templates to notification events. Templates are automatically synced when approved.
              </p>
              {whatsappTemplates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Language
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Components
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {whatsappTemplates.map((template) => (
                        <tr key={template.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {template.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge variant={template.status === 'APPROVED' ? 'default' : 'secondary'}>
                              {template.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {template.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {template.language}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {template.components.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No WhatsApp templates found</p>
                  <p className="text-sm text-gray-500">Create templates in your WhatsApp Business Manager</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button onClick={() => setIsTemplateDialogOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}