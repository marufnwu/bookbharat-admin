import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  BarChart3,
  Save,
  AlertCircle,
  Loader2,
  Eye,
  Globe,
  Users,
  Shield,
  Activity,
  Settings,
  Tag,
  Share2,
  Search,
  ShoppingCart,
  ShoppingBag,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  ChevronDown,
  ChevronRight,
  Info,
  Plus,
  X,
  Music,
  Camera,
  Rss,
  Mail,
  FileText,
  Zap,
  Package,
  CheckCircle
} from 'lucide-react';

// API service
import { adminApi } from '../../services/adminApi';

const MarketingSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('analytics');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Fetch marketing settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['marketing-settings'],
    queryFn: async () => {
      const response = await adminApi.getMarketingSettings();
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateMarketingSettings(data),
    onSuccess: () => {
      toast.success('Marketing settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['marketing-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  const handleSave = () => {
    if (!settings) return;
    updateSettingsMutation.mutate(settings);
  };

  const handleFieldChange = (path: string, value: any) => {
    if (!settings) return;

    // Update local state for immediate UI feedback
    const keys = path.split('.');
    const updatedSettings = JSON.parse(JSON.stringify(settings)); // Deep clone
    let current: any = updatedSettings;

    // Navigate to the parent of the target property
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    // Set the final property
    current[keys[keys.length - 1]] = value;

    queryClient.setQueryData(['marketing-settings'], updatedSettings);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'pixels', label: 'Pixels', icon: Eye },
    { id: 'feeds', label: 'Feeds', icon: Globe },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'seo', label: 'SEO', icon: Shield },
    { id: 'tracking', label: 'Tracking', icon: Activity },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Failed to load settings</h3>
            <p className="mt-1 text-sm text-red-600">
              There was an error loading the marketing settings. Please try again.
            </p>
          </div>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['marketing-settings'] })}
          className="mt-4 inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Marketing Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your marketing integrations and settings
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending || !settings}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Google Analytics */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Google Analytics 4</h3>
                  </div>
                </div>
                <button
                  onClick={() => handleFieldChange('analytics.google_analytics.enabled', !settings?.analytics?.google_analytics?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.analytics?.google_analytics?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.analytics?.google_analytics?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.analytics?.google_analytics?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Measurement ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings?.analytics?.google_analytics?.measurement_id || ''}
                      onChange={(e) => handleFieldChange('analytics.google_analytics.measurement_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Format: G-XXXXXXXXXX
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      API Secret
                    </label>
                    <input
                      type="password"
                      value={settings?.analytics?.google_analytics?.api_secret || ''}
                      onChange={(e) => handleFieldChange('analytics.google_analytics.api_secret', e.target.value)}
                      placeholder="Your API secret"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      For server-side tracking
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cookie Flags
                    </label>
                    <input
                      type="text"
                      value={settings?.analytics?.google_analytics?.cookie_flags || ''}
                      onChange={(e) => handleFieldChange('analytics.google_analytics.cookie_flags', e.target.value)}
                      placeholder="SameSite=Lax;Secure"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Debug Mode</label>
                        <p className="text-xs text-gray-500">Enable for development</p>
                      </div>
                      <button
                        onClick={() => handleFieldChange('analytics.google_analytics.debug_mode', !settings?.analytics?.google_analytics?.debug_mode)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings?.analytics?.google_analytics?.debug_mode ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings?.analytics?.google_analytics?.debug_mode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Anonymize IP</label>
                        <p className="text-xs text-gray-500">Mask IP addresses</p>
                      </div>
                      <button
                        onClick={() => handleFieldChange('analytics.google_analytics.anonymize_ip', !settings?.analytics?.google_analytics?.anonymize_ip)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings?.analytics?.google_analytics?.anonymize_ip ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings?.analytics?.google_analytics?.anonymize_ip ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Allow Google Signals</label>
                        <p className="text-xs text-gray-500">Cross-device tracking</p>
                      </div>
                      <button
                        onClick={() => handleFieldChange('analytics.google_analytics.allow_google_signals', !settings?.analytics?.google_analytics?.allow_google_signals)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings?.analytics?.google_analytics?.allow_google_signals ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings?.analytics?.google_analytics?.allow_google_signals ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Dimensions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Custom Dimensions</label>
                    <button
                      onClick={() => {
                        const current = settings?.analytics?.google_analytics?.custom_dimensions || [];
                        handleFieldChange('analytics.google_analytics.custom_dimensions', [...current, { name: '', index: '' }]);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Add Dimension
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(settings?.analytics?.google_analytics?.custom_dimensions || []).map((dim: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={dim.name || ''}
                          onChange={(e) => {
                            const dims = [...(settings?.analytics?.google_analytics?.custom_dimensions || [])];
                            dims[index] = { ...dim, name: e.target.value };
                            handleFieldChange('analytics.google_analytics.custom_dimensions', dims);
                          }}
                          placeholder="Dimension name"
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <input
                          type="text"
                          value={dim.index || ''}
                          onChange={(e) => {
                            const dims = [...(settings?.analytics?.google_analytics?.custom_dimensions || [])];
                            dims[index] = { ...dim, index: e.target.value };
                            handleFieldChange('analytics.google_analytics.custom_dimensions', dims);
                          }}
                          placeholder="Index (e.g., 1)"
                          className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => {
                            const dims = [...(settings?.analytics?.google_analytics?.custom_dimensions || [])];
                            dims.splice(index, 1);
                            handleFieldChange('analytics.google_analytics.custom_dimensions', dims);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hotjar */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Hotjar</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('analytics.hotjar.enabled', !settings?.analytics?.hotjar?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.analytics?.hotjar?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.analytics?.hotjar?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.analytics?.hotjar?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Site ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings?.analytics?.hotjar?.site_id || ''}
                      onChange={(e) => handleFieldChange('analytics.hotjar.site_id', e.target.value)}
                      placeholder="1234567"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Snippet Version
                    </label>
                    <select
                      value={settings?.analytics?.hotjar?.snippet_version || 6}
                      onChange={(e) => handleFieldChange('analytics.hotjar.snippet_version', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="6">Version 6 (Latest)</option>
                      <option value="5">Version 5</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mixpanel */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Mixpanel</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('analytics.mixpanel.enabled', !settings?.analytics?.mixpanel?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.analytics?.mixpanel?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.analytics?.mixpanel?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.analytics?.mixpanel?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Token <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={settings?.analytics?.mixpanel?.token || ''}
                      onChange={(e) => handleFieldChange('analytics.mixpanel.token', e.target.value)}
                      placeholder="Your Mixpanel token"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <label className="text-sm font-medium text-gray-700">Debug Mode</label>
                      <p className="text-xs text-gray-500">Enable for development</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('analytics.mixpanel.debug_mode', !settings?.analytics?.mixpanel?.debug_mode)}
                      className={`ml-3 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.analytics?.mixpanel?.debug_mode ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.analytics?.mixpanel?.debug_mode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Microsoft Clarity */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Microsoft Clarity</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('analytics.clarity.enabled', !settings?.analytics?.clarity?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.analytics?.clarity?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.analytics?.clarity?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.analytics?.clarity?.enabled && (
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings?.analytics?.clarity?.project_id || ''}
                    onChange={(e) => handleFieldChange('analytics.clarity.project_id', e.target.value)}
                    placeholder="your-project-id"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Found in your Clarity project settings
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pixels Tab */}
      {activeTab === 'pixels' && (
        <div className="space-y-6">
          {/* Meta Pixel */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Meta Pixel (Facebook/Instagram)</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('pixels.meta.enabled', !settings?.pixels?.meta?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.pixels?.meta?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.pixels?.meta?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.pixels?.meta?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pixel ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings?.pixels?.meta?.pixel_id || ''}
                      onChange={(e) => handleFieldChange('pixels.meta.pixel_id', e.target.value)}
                      placeholder="123456789012345"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={settings?.pixels?.meta?.access_token || ''}
                      onChange={(e) => handleFieldChange('pixels.meta.access_token', e.target.value)}
                      placeholder="EAAC..."
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      For server-side tracking
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Test Event Code
                    </label>
                    <input
                      type="text"
                      value={settings?.pixels?.meta?.test_event_code || ''}
                      onChange={(e) => handleFieldChange('pixels.meta.test_event_code', e.target.value)}
                      placeholder="TEST12345"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      For testing conversions
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Advanced Matching</label>
                      <p className="text-xs text-gray-500">Send customer data for better matching</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('pixels.meta.advanced_matching', !settings?.pixels?.meta?.advanced_matching)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.pixels?.meta?.advanced_matching ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.pixels?.meta?.advanced_matching ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto Config</label>
                      <p className="text-xs text-gray-500">Automatic event tracking</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('pixels.meta.auto_config', !settings?.pixels?.meta?.auto_config)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.pixels?.meta?.auto_config ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.pixels?.meta?.auto_config ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Wait for Attach</label>
                      <p className="text-xs text-gray-500">Delay tracking until consent</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('pixels.meta.wait_for_attach', !settings?.pixels?.meta?.wait_for_attach)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.pixels?.meta?.wait_for_attach ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.pixels?.meta?.wait_for_attach ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TikTok Pixel */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Music className="h-5 w-5 text-black mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">TikTok Pixel</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('pixels.tiktok.enabled', !settings?.pixels?.tiktok?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.pixels?.tiktok?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.pixels?.tiktok?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.pixels?.tiktok?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pixel ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings?.pixels?.tiktok?.pixel_id || ''}
                      onChange={(e) => handleFieldChange('pixels.tiktok.pixel_id', e.target.value)}
                      placeholder="1234567890123456789"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={settings?.pixels?.tiktok?.access_token || ''}
                      onChange={(e) => handleFieldChange('pixels.tiktok.access_token', e.target.value)}
                      placeholder="ttoken..."
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Test Mode</label>
                    <p className="text-xs text-gray-500">Enable for testing</p>
                  </div>
                  <button
                    onClick={() => handleFieldChange('pixels.tiktok.test_mode', !settings?.pixels?.tiktok?.test_mode)}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                      settings?.pixels?.tiktok?.test_mode ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        settings?.pixels?.tiktok?.test_mode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pinterest Pixel */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Pinterest Tag</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('pixels.pinterest.enabled', !settings?.pixels?.pinterest?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.pixels?.pinterest?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.pixels?.pinterest?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.pixels?.pinterest?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tag ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings?.pixels?.pinterest?.tag_id || ''}
                      onChange={(e) => handleFieldChange('pixels.pinterest.tag_id', e.target.value)}
                      placeholder="1234567890123"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <label className="text-sm font-medium text-gray-700">Enhanced Match</label>
                      <p className="text-xs text-gray-500">Improve conversion tracking</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('pixels.pinterest.enhanced_match', !settings?.pixels?.pinterest?.enhanced_match)}
                      className={`ml-3 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.pixels?.pinterest?.enhanced_match ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.pixels?.pinterest?.enhanced_match ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Snapchat Pixel */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Camera className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Snapchat Pixel</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('pixels.snapchat.enabled', !settings?.pixels?.snapchat?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.pixels?.snapchat?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.pixels?.snapchat?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.pixels?.snapchat?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pixel ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings?.pixels?.snapchat?.pixel_id || ''}
                      onChange={(e) => handleFieldChange('pixels.snapchat.pixel_id', e.target.value)}
                      placeholder="12345678-1234-1234-1234-123456789012"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <label className="text-sm font-medium text-gray-700">Test Mode</label>
                      <p className="text-xs text-gray-500">Enable for testing</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('pixels.snapchat.test_mode', !settings?.pixels?.snapchat?.test_mode)}
                      className={`ml-3 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.pixels?.snapchat?.test_mode ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.pixels?.snapchat?.test_mode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LinkedIn Insight Tag */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Linkedin className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">LinkedIn Insight Tag</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('pixels.linkedin.enabled', !settings?.pixels?.linkedin?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.pixels?.linkedin?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.pixels?.linkedin?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.pixels?.linkedin?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Partner ID
                    </label>
                    <input
                      type="text"
                      value={settings?.pixels?.linkedin?.partner_id || ''}
                      onChange={(e) => handleFieldChange('pixels.linkedin.partner_id', e.target.value)}
                      placeholder="123456"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Conversion ID
                    </label>
                    <input
                      type="text"
                      value={settings?.pixels?.linkedin?.conversion_id || ''}
                      onChange={(e) => handleFieldChange('pixels.linkedin.conversion_id', e.target.value)}
                      placeholder="789012"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feeds Tab */}
      {activeTab === 'feeds' && (
        <div className="space-y-6">
          {/* Google Shopping Feed */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Google Shopping Feed</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('feeds.google_shopping.enabled', !settings?.feeds?.google_shopping?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.feeds?.google_shopping?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.feeds?.google_shopping?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.feeds?.google_shopping?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Format</label>
                    <select
                      value={settings?.feeds?.google_shopping?.format || 'xml'}
                      onChange={(e) => handleFieldChange('feeds.google_shopping.format', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="xml">XML</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cache TTL (seconds)</label>
                    <input
                      type="number"
                      value={settings?.feeds?.google_shopping?.cache_ttl || 3600}
                      onChange={(e) => handleFieldChange('feeds.google_shopping.cache_ttl', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={settings?.feeds?.google_shopping?.currency || 'INR'}
                      onChange={(e) => handleFieldChange('feeds.google_shopping.currency', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base URL</label>
                    <input
                      type="url"
                      value={settings?.feeds?.google_shopping?.base_url || ''}
                      onChange={(e) => handleFieldChange('feeds.google_shopping.base_url', e.target.value)}
                      placeholder="https://yourstore.com"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brand Name</label>
                    <input
                      type="text"
                      value={settings?.feeds?.google_shopping?.brand_name || ''}
                      onChange={(e) => handleFieldChange('feeds.google_shopping.brand_name', e.target.value)}
                      placeholder="Your Brand"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Availability</label>
                    <select
                      value={settings?.feeds?.google_shopping?.default_availability || 'in stock'}
                      onChange={(e) => handleFieldChange('feeds.google_shopping.default_availability', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="in stock">In Stock</option>
                      <option value="out of stock">Out of Stock</option>
                      <option value="preorder">Preorder</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Include Out of Stock</label>
                      <p className="text-xs text-gray-500">Include unavailable products</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('feeds.google_shopping.include_out_of_stock', !settings?.feeds?.google_shopping?.include_out_of_stock)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.feeds?.google_shopping?.include_out_of_stock ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.feeds?.google_shopping?.include_out_of_stock ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Shipping Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Free Shipping Threshold</label>
                      <input
                        type="number"
                        value={settings?.feeds?.google_shopping?.free_shipping_threshold || 500}
                        onChange={(e) => handleFieldChange('feeds.google_shopping.free_shipping_threshold', parseFloat(e.target.value))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Default Shipping Cost</label>
                      <input
                        type="number"
                        value={settings?.feeds?.google_shopping?.default_shipping_cost || 40}
                        onChange={(e) => handleFieldChange('feeds.google_shopping.default_shipping_cost', parseFloat(e.target.value))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Shipping Country</label>
                      <input
                        type="text"
                        value={settings?.feeds?.google_shopping?.shipping_country || 'IN'}
                        onChange={(e) => handleFieldChange('feeds.google_shopping.shipping_country', e.target.value)}
                        maxLength={2}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Facebook Catalog Feed */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Facebook Catalog Feed</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('feeds.facebook_catalog.enabled', !settings?.feeds?.facebook_catalog?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.feeds?.facebook_catalog?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.feeds?.facebook_catalog?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.feeds?.facebook_catalog?.enabled && (
              <div className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto Sync</label>
                      <p className="text-xs text-gray-500">Automatically sync with Facebook</p>
                    </div>
                    <button
                      onClick={() => handleFieldChange('feeds.facebook_catalog.sync_settings.auto_sync', !settings?.feeds?.facebook_catalog?.sync_settings?.auto_sync)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.feeds?.facebook_catalog?.sync_settings?.auto_sync ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.feeds?.facebook_catalog?.sync_settings?.auto_sync ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings?.feeds?.facebook_catalog?.sync_settings?.auto_sync && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Catalog ID</label>
                        <input
                          type="text"
                          value={settings?.feeds?.facebook_catalog?.sync_settings?.catalog_id || ''}
                          onChange={(e) => handleFieldChange('feeds.facebook_catalog.sync_settings.catalog_id', e.target.value)}
                          placeholder="Your Catalog ID"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Access Token</label>
                        <input
                          type="password"
                          value={settings?.feeds?.facebook_catalog?.sync_settings?.access_token || ''}
                          onChange={(e) => handleFieldChange('feeds.facebook_catalog.sync_settings.access_token', e.target.value)}
                          placeholder="EAAC..."
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RSS Feed */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Rss className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">RSS Feeds</h3>
                </div>
                <button
                  onClick={() => handleFieldChange('feeds.rss.enabled', !settings?.feeds?.rss?.enabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.feeds?.rss?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.feeds?.rss?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings?.feeds?.rss?.enabled && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site Title</label>
                    <input
                      type="text"
                      value={settings?.feeds?.rss?.site_title || ''}
                      onChange={(e) => handleFieldChange('feeds.rss.site_title', e.target.value)}
                      placeholder="Your Store Name"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site Language</label>
                    <input
                      type="text"
                      value={settings?.feeds?.rss?.site_language || 'en-us'}
                      onChange={(e) => handleFieldChange('feeds.rss.site_language', e.target.value)}
                      placeholder="en-us"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Description</label>
                  <textarea
                    value={settings?.feeds?.rss?.site_description || ''}
                    onChange={(e) => handleFieldChange('feeds.rss.site_description', e.target.value)}
                    placeholder="Latest products from our store"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Feed Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Items per Feed</label>
                      <input
                        type="number"
                        value={settings?.feeds?.rss?.feed_settings?.max_items_per_feed || 50}
                        onChange={(e) => handleFieldChange('feeds.rss.feed_settings.max_items_per_feed', parseInt(e.target.value))}
                        min="1"
                        max="1000"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description Length</label>
                      <input
                        type="number"
                        value={settings?.feeds?.rss?.feed_settings?.description_length || 500}
                        onChange={(e) => handleFieldChange('feeds.rss.feed_settings.description_length', parseInt(e.target.value))}
                        min="50"
                        max="2000"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Include Images</label>
                      </div>
                      <button
                        onClick={() => handleFieldChange('feeds.rss.feed_settings.include_images', !settings?.feeds?.rss?.feed_settings?.include_images)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings?.feeds?.rss?.feed_settings?.include_images ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings?.feeds?.rss?.feed_settings?.include_images ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Include Prices</label>
                      </div>
                      <button
                        onClick={() => handleFieldChange('feeds.rss.feed_settings.include_prices', !settings?.feeds?.rss?.feed_settings?.include_prices)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings?.feeds?.rss?.feed_settings?.include_prices ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings?.feeds?.rss?.feed_settings?.include_prices ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Feed Types</h4>
                  <div className="space-y-3">
                    {['products', 'categories', 'deals', 'new'].map((feedType) => (
                      <div key={feedType} className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 capitalize">
                            {feedType} Feed
                          </label>
                        </div>
                        <button
                          onClick={() => handleFieldChange(`feeds.rss.feeds.${feedType}.enabled`, !settings?.feeds?.rss?.feeds?.[feedType]?.enabled)}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                            settings?.feeds?.rss?.feeds?.[feedType]?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                              settings?.feeds?.rss?.feeds?.[feedType]?.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Social Media Platforms</h3>

              <div className="space-y-6">
                {/* Facebook */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Facebook className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Facebook</h4>
                    </div>
                    <button
                      onClick={() => handleFieldChange('social.platforms.facebook.enabled', !settings?.social?.platforms?.facebook?.enabled)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.social?.platforms?.facebook?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.social?.platforms?.facebook?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {settings?.social?.platforms?.facebook?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Page URL</label>
                        <input
                          type="url"
                          value={settings?.social?.platforms?.facebook?.url || ''}
                          onChange={(e) => handleFieldChange('social.platforms.facebook.url', e.target.value)}
                          placeholder="https://facebook.com/yourpage"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Page ID</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.facebook?.page_id || ''}
                          onChange={(e) => handleFieldChange('social.platforms.facebook.page_id', e.target.value)}
                          placeholder="123456789012345"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">App ID</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.facebook?.app_id || ''}
                          onChange={(e) => handleFieldChange('social.platforms.facebook.app_id', e.target.value)}
                          placeholder="987654321098765"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Locale</label>
                        <select
                          value={settings?.social?.platforms?.facebook?.locale || 'en_IN'}
                          onChange={(e) => handleFieldChange('social.platforms.facebook.locale', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="en_IN">English (India)</option>
                          <option value="en_US">English (US)</option>
                          <option value="hi_IN">Hindi (India)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Sharing Template</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.facebook?.sharing_template || ''}
                          onChange={(e) => handleFieldChange('social.platforms.facebook.sharing_template', e.target.value)}
                          placeholder="Check out {title} at BookBharat - {price}"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <p className="mt-1 text-sm text-gray-500">Use {'{title}'}, {'{price}'}, {'{description}'}, {'{url}'} as placeholders</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Twitter */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Twitter className="h-5 w-5 text-black mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Twitter/X</h4>
                    </div>
                    <button
                      onClick={() => handleFieldChange('social.platforms.twitter.enabled', !settings?.social?.platforms?.twitter?.enabled)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.social?.platforms?.twitter?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.social?.platforms?.twitter?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {settings?.social?.platforms?.twitter?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Profile URL</label>
                        <input
                          type="url"
                          value={settings?.social?.platforms?.twitter?.url || ''}
                          onChange={(e) => handleFieldChange('social.platforms.twitter.url', e.target.value)}
                          placeholder="https://twitter.com/yourhandle"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Handle</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.twitter?.handle || ''}
                          onChange={(e) => handleFieldChange('social.platforms.twitter.handle', e.target.value)}
                          placeholder="@yourhandle"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Card Type</label>
                        <select
                          value={settings?.social?.platforms?.twitter?.card_type || 'summary_large_image'}
                          onChange={(e) => handleFieldChange('social.platforms.twitter.card_type', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="summary">Summary</option>
                          <option value="summary_large_image">Summary with Large Image</option>
                          <option value="app">App</option>
                          <option value="player">Player</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Site Handle</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.twitter?.site || ''}
                          onChange={(e) => handleFieldChange('social.platforms.twitter.site', e.target.value)}
                          placeholder="@yoursite"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Instagram */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 text-pink-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Instagram</h4>
                    </div>
                    <button
                      onClick={() => handleFieldChange('social.platforms.instagram.enabled', !settings?.social?.platforms?.instagram?.enabled)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.social?.platforms?.instagram?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.social?.platforms?.instagram?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {settings?.social?.platforms?.instagram?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Profile URL</label>
                        <input
                          type="url"
                          value={settings?.social?.platforms?.instagram?.url || ''}
                          onChange={(e) => handleFieldChange('social.platforms.instagram.url', e.target.value)}
                          placeholder="https://instagram.com/yourprofile"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Handle</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.instagram?.handle || ''}
                          onChange={(e) => handleFieldChange('social.platforms.instagram.handle', e.target.value)}
                          placeholder="@yourprofile"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Instagram Shopping</label>
                            <p className="text-xs text-gray-500">Enable product tagging</p>
                          </div>
                          <button
                            onClick={() => handleFieldChange('social.platforms.instagram.shopping_enabled', !settings?.social?.platforms?.instagram?.shopping_enabled)}
                            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                              settings?.social?.platforms?.instagram?.shopping_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                settings?.social?.platforms?.instagram?.shopping_enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* YouTube */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Youtube className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">YouTube</h4>
                    </div>
                    <button
                      onClick={() => handleFieldChange('social.platforms.youtube.enabled', !settings?.social?.platforms?.youtube?.enabled)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.social?.platforms?.youtube?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.social?.platforms?.youtube?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {settings?.social?.platforms?.youtube?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Channel URL</label>
                        <input
                          type="url"
                          value={settings?.social?.platforms?.youtube?.url || ''}
                          onChange={(e) => handleFieldChange('social.platforms.youtube.url', e.target.value)}
                          placeholder="https://youtube.com/@yourchannel"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Channel ID</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.youtube?.channel_id || ''}
                          onChange={(e) => handleFieldChange('social.platforms.youtube.channel_id', e.target.value)}
                          placeholder="UC123456789012345678"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Linkedin className="h-5 w-5 text-blue-700 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">LinkedIn</h4>
                    </div>
                    <button
                      onClick={() => handleFieldChange('social.platforms.linkedin.enabled', !settings?.social?.platforms?.linkedin?.enabled)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.social?.platforms?.linkedin?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.social?.platforms?.linkedin?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {settings?.social?.platforms?.linkedin?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Page URL</label>
                        <input
                          type="url"
                          value={settings?.social?.platforms?.linkedin?.url || ''}
                          onChange={(e) => handleFieldChange('social.platforms.linkedin.url', e.target.value)}
                          placeholder="https://linkedin.com/company/yourcompany"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company ID</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.linkedin?.company_id || ''}
                          onChange={(e) => handleFieldChange('social.platforms.linkedin.company_id', e.target.value)}
                          placeholder="12345678"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pinterest */}
                <div className="pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Pinterest</h4>
                    </div>
                    <button
                      onClick={() => handleFieldChange('social.platforms.pinterest.enabled', !settings?.social?.platforms?.pinterest?.enabled)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        settings?.social?.platforms?.pinterest?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings?.social?.platforms?.pinterest?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {settings?.social?.platforms?.pinterest?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Profile URL</label>
                        <input
                          type="url"
                          value={settings?.social?.platforms?.pinterest?.url || ''}
                          onChange={(e) => handleFieldChange('social.platforms.pinterest.url', e.target.value)}
                          placeholder="https://pinterest.com/yourprofile"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Board ID</label>
                        <input
                          type="text"
                          value={settings?.social?.platforms?.pinterest?.board_id || ''}
                          onChange={(e) => handleFieldChange('social.platforms.pinterest.board_id', e.target.value)}
                          placeholder="987654321234567890"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sharing Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Global Sharing Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Sharing Template</label>
                  <input
                    type="text"
                    value={settings?.social?.sharing?.default_template || ''}
                    onChange={(e) => handleFieldChange('social.sharing.default_template', e.target.value)}
                    placeholder="Check out this product: {title} - {price}"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Available placeholders: {'{title}'}, {'{price}'}, {'{description}'}, {'{url}'}, {'{image}'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">UTM Tracking</label>
                    <p className="text-xs text-gray-500">Add UTM parameters to shared links</p>
                  </div>
                  <button
                    onClick={() => handleFieldChange('social.sharing.utm_tracking', !settings?.social?.sharing?.utm_tracking)}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                      settings?.social?.sharing?.utm_tracking ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        settings?.social?.sharing?.utm_tracking ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {settings?.social?.sharing?.utm_tracking && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">UTM Source Mapping</h4>
                    <div className="space-y-2">
                      {Object.entries(settings?.social?.sharing?.utm_source_mapping || {}).map(([platform, source]) => (
                        <div key={platform} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 capitalize w-24">{platform}:</span>
                          <input
                            type="text"
                            value={String(source)}
                            onChange={(e) => {
                              const mapping = { ...(settings?.social?.sharing?.utm_source_mapping || {}) as Record<string, string> };
                              mapping[platform] = e.target.value;
                              handleFieldChange('social.sharing.utm_source_mapping', mapping);
                            }}
                            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          {/* Meta Tags */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Meta Tags</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Title</label>
                  <input
                    type="text"
                    value={settings?.seo?.meta_tags?.default_title || ''}
                    onChange={(e) => handleFieldChange('seo.meta_tags.default_title', e.target.value)}
                    maxLength={60}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">Max 60 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title Separator</label>
                  <input
                    type="text"
                    value={settings?.seo?.meta_tags?.title_separator || '|'}
                    onChange={(e) => handleFieldChange('seo.meta_tags.title_separator', e.target.value)}
                    maxLength={10}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Default Description</label>
                  <textarea
                    value={settings?.seo?.meta_tags?.default_description || ''}
                    onChange={(e) => handleFieldChange('seo.meta_tags.default_description', e.target.value)}
                    maxLength={160}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">Max 160 characters</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Default Keywords</label>
                  <input
                    type="text"
                    value={settings?.seo?.meta_tags?.default_keywords || ''}
                    onChange={(e) => handleFieldChange('seo.meta_tags.default_keywords', e.target.value)}
                    maxLength={255}
                    placeholder="comma, separated, keywords"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">Comma-separated keywords</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meta Robots</label>
                  <select
                    value={settings?.seo?.meta_tags?.meta_robots || 'index,follow'}
                    onChange={(e) => handleFieldChange('seo.meta_tags.meta_robots', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="index,follow">Index, Follow</option>
                    <option value="noindex,nofollow">No Index, No Follow</option>
                    <option value="index,nofollow">Index, No Follow</option>
                    <option value="noindex,follow">No Index, Follow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Canonical URL</label>
                  <input
                    type="url"
                    value={settings?.seo?.meta_tags?.canonical_url || ''}
                    onChange={(e) => handleFieldChange('seo.meta_tags.canonical_url', e.target.value)}
                    placeholder="https://yoursite.com"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <input
                    type="text"
                    value={settings?.seo?.meta_tags?.author || ''}
                    onChange={(e) => handleFieldChange('seo.meta_tags.author', e.target.value)}
                    maxLength={100}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Publisher</label>
                  <input
                    type="text"
                    value={settings?.seo?.meta_tags?.publisher || ''}
                    onChange={(e) => handleFieldChange('seo.meta_tags.publisher', e.target.value)}
                    maxLength={100}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Open Graph */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Open Graph (Facebook/Social)</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">OG Type</label>
                  <select
                    value={settings?.seo?.open_graph?.type || 'website'}
                    onChange={(e) => handleFieldChange('seo.open_graph.type', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="website">Website</option>
                    <option value="product">Product</option>
                    <option value="article">Article</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Name</label>
                  <input
                    type="text"
                    value={settings?.seo?.open_graph?.site_name || ''}
                    onChange={(e) => handleFieldChange('seo.open_graph.site_name', e.target.value)}
                    maxLength={100}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Locale</label>
                  <select
                    value={settings?.seo?.open_graph?.locale || 'en_IN'}
                    onChange={(e) => handleFieldChange('seo.open_graph.locale', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="en_IN">English (India)</option>
                    <option value="en_US">English (US)</option>
                    <option value="hi_IN">Hindi (India)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default OG Image</label>
                  <input
                    type="url"
                    value={settings?.seo?.open_graph?.image?.default || ''}
                    onChange={(e) => handleFieldChange('seo.open_graph.image.default', e.target.value)}
                    placeholder="https://yoursite.com/images/og-default.jpg"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image Width</label>
                  <input
                    type="number"
                    value={settings?.seo?.open_graph?.image?.width || 1200}
                    onChange={(e) => handleFieldChange('seo.open_graph.image.width', parseInt(e.target.value))}
                    min={100}
                    max={5000}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image Height</label>
                  <input
                    type="number"
                    value={settings?.seo?.open_graph?.image?.height || 630}
                    onChange={(e) => handleFieldChange('seo.open_graph.image.height', parseInt(e.target.value))}
                    min={100}
                    max={5000}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image Type</label>
                  <select
                    value={settings?.seo?.open_graph?.image?.type || 'image/jpeg'}
                    onChange={(e) => handleFieldChange('seo.open_graph.image.type', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Twitter Cards */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Twitter className="h-5 w-5 text-black mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Twitter Cards</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Type</label>
                  <select
                    value={settings?.seo?.twitter?.card || 'summary_large_image'}
                    onChange={(e) => handleFieldChange('seo.twitter.card', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary with Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Handle</label>
                  <input
                    type="text"
                    value={settings?.seo?.twitter?.site || ''}
                    onChange={(e) => handleFieldChange('seo.twitter.site', e.target.value)}
                    placeholder="@yoursite"
                    maxLength={15}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Creator Handle</label>
                  <input
                    type="text"
                    value={settings?.seo?.twitter?.creator || ''}
                    onChange={(e) => handleFieldChange('seo.twitter.creator', e.target.value)}
                    placeholder="@creator"
                    maxLength={15}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Twitter Image</label>
                  <input
                    type="url"
                    value={settings?.seo?.twitter?.image || ''}
                    onChange={(e) => handleFieldChange('seo.twitter.image', e.target.value)}
                    placeholder="https://yoursite.com/images/twitter-default.jpg"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sitemap */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Sitemap Settings</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable Sitemap</label>
                    <p className="text-xs text-gray-500">Generate XML sitemap</p>
                  </div>
                  <button
                    onClick={() => handleFieldChange('seo.sitemap.enabled', !settings?.seo?.sitemap?.enabled)}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                      settings?.seo?.sitemap?.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        settings?.seo?.sitemap?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {settings?.seo?.sitemap?.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Include Images</label>
                        <p className="text-xs text-gray-500">Add images to sitemap</p>
                      </div>
                      <button
                        onClick={() => handleFieldChange('seo.sitemap.include_images', !settings?.seo?.sitemap?.include_images)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings?.seo?.sitemap?.include_images ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings?.seo?.sitemap?.include_images ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cache TTL (seconds)</label>
                        <input
                          type="number"
                          value={settings?.seo?.sitemap?.cache_ttl || 86400}
                          onChange={(e) => handleFieldChange('seo.sitemap.cache_ttl', parseInt(e.target.value))}
                          min={60}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <p className="mt-1 text-sm text-gray-500">How often to regenerate sitemap</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* Event Tracking */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Event Tracking</h3>
              <p className="text-sm text-gray-600">
                Select which user actions you want to track for analytics and reporting
              </p>
            </div>

            <div className="p-6 space-y-3">
              {[
                { key: 'page_view', label: 'Page Views', desc: 'Track when users view pages' },
                { key: 'product_view', label: 'Product Views', desc: 'Track when users view product details' },
                { key: 'add_to_cart', label: 'Add to Cart', desc: 'Track when users add products to cart' },
                { key: 'begin_checkout', label: 'Begin Checkout', desc: 'Track when users start checkout process' },
                { key: 'purchase', label: 'Purchase', desc: 'Track completed purchases' },
                { key: 'search', label: 'Search', desc: 'Track user search queries' },
                { key: 'share', label: 'Share', desc: 'Track content sharing' },
                { key: 'newsletter_signup', label: 'Newsletter Signup', desc: 'Track newsletter subscriptions' },
                { key: 'contact_form', label: 'Contact Form', desc: 'Track contact form submissions' }
              ].map((event) => (
                <div key={event.key} className="flex items-center justify-between py-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{event.label}</label>
                    <p className="text-xs text-gray-500">{event.desc}</p>
                  </div>
                  <button
                    onClick={() => handleFieldChange(`tracking.events.${event.key}`, !settings?.tracking?.events?.[event.key as keyof typeof settings.tracking.events])}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                      settings?.tracking?.events?.[event.key as keyof typeof settings.tracking.events] ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        settings?.tracking?.events?.[event.key as keyof typeof settings.tracking.events] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Event Parameters */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Event Parameters</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={settings?.tracking?.event_parameters?.currency || 'INR'}
                    onChange={(e) => handleFieldChange('tracking.event_parameters.currency', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content Type</label>
                  <input
                    type="text"
                    value={settings?.tracking?.event_parameters?.content_type || 'product'}
                    onChange={(e) => handleFieldChange('tracking.event_parameters.content_type', e.target.value)}
                    maxLength={50}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Category</label>
                  <input
                    type="text"
                    value={settings?.tracking?.event_parameters?.event_category || 'ecommerce'}
                    onChange={(e) => handleFieldChange('tracking.event_parameters.event_category', e.target.value)}
                    maxLength={50}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Layer Configuration */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Data Layer Configuration</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data Layer Version</label>
                  <select
                    value={settings?.tracking?.data_layer?.version || 2}
                    onChange={(e) => handleFieldChange('tracking.data_layer.version', parseInt(e.target.value))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="1">Version 1</option>
                    <option value="2">Version 2</option>
                  </select>
                </div>
                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <label className="text-sm font-medium text-gray-700">Ecommerce</label>
                    <p className="text-xs text-gray-500">Enable ecommerce tracking</p>
                  </div>
                  <button
                    onClick={() => handleFieldChange('tracking.data_layer.ecommerce', !settings?.tracking?.data_layer?.ecommerce)}
                    className={`ml-3 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                      settings?.tracking?.data_layer?.ecommerce ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        settings?.tracking?.data_layer?.ecommerce ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <label className="text-sm font-medium text-gray-700">User Properties</label>
                    <p className="text-xs text-gray-500">Track user properties</p>
                  </div>
                  <button
                    onClick={() => handleFieldChange('tracking.data_layer.user_properties', !settings?.tracking?.data_layer?.user_properties)}
                    className={`ml-3 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                      settings?.tracking?.data_layer?.user_properties ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        settings?.tracking?.data_layer?.user_properties ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Consent Management</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Required Consent</label>
                    <p className="text-xs text-gray-500">Require user consent for tracking</p>
                  </div>
                  <button
                    onClick={() => handleFieldChange('tracking.consent.required', !settings?.tracking?.consent?.required)}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                      settings?.tracking?.consent?.required ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        settings?.tracking?.consent?.required ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {settings?.tracking?.consent?.required && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Cookie Consent</label>
                        <p className="text-xs text-gray-500">Show cookie consent banner</p>
                      </div>
                      <button
                        onClick={() => handleFieldChange('tracking.consent.cookie_consent', !settings?.tracking?.consent?.cookie_consent)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings?.tracking?.consent?.cookie_consent ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings?.tracking?.consent?.cookie_consent ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cookie Duration (days)</label>
                        <input
                          type="number"
                          value={settings?.tracking?.consent?.cookie_duration || 365}
                          onChange={(e) => handleFieldChange('tracking.consent.cookie_duration', parseInt(e.target.value))}
                          min={1}
                          max={3650}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Privacy Policy URL</label>
                        <input
                          type="url"
                          value={settings?.tracking?.consent?.privacy_policy_url || ''}
                          onChange={(e) => handleFieldChange('tracking.consent.privacy_policy_url', e.target.value)}
                          placeholder="/privacy-policy"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cookie Policy URL</label>
                        <input
                          type="url"
                          value={settings?.tracking?.consent?.cookie_policy_url || ''}
                          onChange={(e) => handleFieldChange('tracking.consent.cookie_policy_url', e.target.value)}
                          placeholder="/cookie-policy"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Debug Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Debug Settings</h3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Debug Mode</label>
                  <p className="text-xs text-gray-500">Enable debug logging</p>
                </div>
                <button
                  onClick={() => handleFieldChange('tracking.debug.debug_mode', !settings?.tracking?.debug?.debug_mode)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.tracking?.debug?.debug_mode ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.tracking?.debug?.debug_mode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Console Logging</label>
                  <p className="text-xs text-gray-500">Log events to console</p>
                </div>
                <button
                  onClick={() => handleFieldChange('tracking.debug.console_logging', !settings?.tracking?.debug?.console_logging)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.tracking?.debug?.console_logging ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.tracking?.debug?.console_logging ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Test Mode</label>
                  <p className="text-xs text-gray-500">Send test events only</p>
                </div>
                <button
                  onClick={() => handleFieldChange('tracking.debug.test_mode', !settings?.tracking?.debug?.test_mode)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                    settings?.tracking?.debug?.test_mode ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      settings?.tracking?.debug?.test_mode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingSettings;