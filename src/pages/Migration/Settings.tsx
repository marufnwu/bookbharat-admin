import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CogIcon,
  ServerIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  FunnelIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import api, { type MigrationSettings as MigrationSettingsType } from '../../api';
import { LoadingSpinner, Badge } from '../../components';
import { toast } from 'react-hot-toast';

const MigrationSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'connection' | 'sync' | 'images' | 'advanced'>('connection');
  const isInitialized = useRef(false);

  // Fetch current settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['migration', 'settings'],
    queryFn: () => api.migration.getSettings(),
  });

  const currentSettings = settingsResponse?.data || {};

  // Form state
  const [formData, setFormData] = useState<Partial<MigrationSettingsType>>({
    legacy_system_url: '',
    legacy_system_token: '',
    auto_sync_enabled: false,
    auto_sync_interval: 15,
    image_optimization_enabled: true,
    image_quality: 85,
    conflict_resolution: 'old_system_priority',
    max_batch_size: 100,
    syncable_entity_types: ['categories', 'products', 'product_images'],
  });

  // Update form when settings are loaded (only on initial load)
  React.useEffect(() => {
    if (currentSettings && Object.keys(currentSettings).length > 0 && !isInitialized.current) {
      setFormData(currentSettings);
      isInitialized.current = true;
    }
  }, [currentSettings]);

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: { settings: Partial<MigrationSettingsType> }) => api.migration.updateSettings(settings),
    onSuccess: () => {
      toast.success('Migration settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['migration', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['migration', 'dashboard'] });
    },
    onError: () => {
      toast.error('Failed to save migration settings');
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => api.migration.testConnection(),
  });

  const handleInputChange = (field: keyof MigrationSettingsType, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEntityTypeToggle = (entityType: string) => {
    setFormData((prev: any) => ({
      ...prev,
      syncable_entity_types: prev.syncable_entity_types?.includes(entityType)
        ? prev.syncable_entity_types.filter((type: string) => type !== entityType)
        : [...(prev.syncable_entity_types || []), entityType],
    }));
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({ settings: formData });
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const tabs = [
    { id: 'connection', label: 'Connection', icon: ServerIcon },
    { id: 'sync', label: 'Sync Settings', icon: ClockIcon },
    { id: 'images', label: 'Images', icon: PhotoIcon },
    { id: 'advanced', label: 'Advanced', icon: CogIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Migration Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure migration parameters and system integration
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {testConnectionMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Testing...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connection Test Result */}
      {testConnectionMutation.data && (
        <div className={`rounded-lg p-4 ${
          (testConnectionMutation.data as any).data?.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {(testConnectionMutation.data as any).data?.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                (testConnectionMutation.data as any).data?.success ? 'text-green-800' : 'text-red-800'
              }`}>
                Connection Test {(testConnectionMutation.data as any).data?.success ? 'Successful' : 'Failed'}
              </h3>
              <div className={`mt-1 text-sm ${
                (testConnectionMutation.data as any).data?.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {(testConnectionMutation.data as any).data?.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Connection Settings */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Legacy System Connection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legacy System URL
                    </label>
                    <input
                      type="url"
                      value={formData.legacy_system_url || ''}
                      onChange={(e) => handleInputChange('legacy_system_url', e.target.value)}
                      placeholder="https://legacy-system.com"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Base URL of the legacy system API
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Token
                    </label>
                    <input
                      type="password"
                      value={formData.legacy_system_token || ''}
                      onChange={(e) => handleInputChange('legacy_system_token', e.target.value)}
                      placeholder="Enter secure API token"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Secure token for API authentication
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Security Information</h4>
                    <p className="text-sm text-gray-600">
                      Ensure the legacy system API endpoint is properly secured and the token is kept confidential.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Settings */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Synchronization Configuration</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Auto Sync Enabled</label>
                      <p className="text-sm text-gray-500">Automatically sync data at regular intervals</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('auto_sync_enabled', !formData.auto_sync_enabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        formData.auto_sync_enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.auto_sync_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={formData.auto_sync_interval || 15}
                      onChange={(e) => handleInputChange('auto_sync_interval', parseInt(e.target.value))}
                      disabled={!formData.auto_sync_enabled}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      How often to run automatic sync (5-1440 minutes)
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Entity Types to Sync</h4>
                <div className="space-y-3">
                  {['categories', 'products', 'product_images'].map((entityType) => (
                    <div key={entityType} className="flex items-center">
                      <input
                        type="checkbox"
                        id={entityType}
                        checked={formData.syncable_entity_types?.includes(entityType) || false}
                        onChange={() => handleEntityTypeToggle(entityType)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={entityType} className="ml-3 text-sm font-medium text-gray-700 capitalize">
                        {entityType.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conflict Resolution Strategy
                  </label>
                  <select
                    value={formData.conflict_resolution || 'old_system_priority'}
                    onChange={(e) => handleInputChange('conflict_resolution', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
                  >
                    <option value="old_system_priority">Old System Priority</option>
                    <option value="new_system_priority">New System Priority</option>
                    <option value="manual_review">Manual Review Required</option>
                    <option value="merge_data">Merge Data</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    How to handle conflicts when data exists in both systems
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image Settings */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Image Processing</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Image Optimization</label>
                      <p className="text-sm text-gray-500">Optimize images during migration</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('image_optimization_enabled', !formData.image_optimization_enabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        formData.image_optimization_enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.image_optimization_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Quality (%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={formData.image_quality || 85}
                      onChange={(e) => handleInputChange('image_quality', parseInt(e.target.value))}
                      disabled={!formData.image_optimization_enabled}
                      className="mt-1 block w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Lower quality (smaller files)</span>
                      <span className="font-medium">{formData.image_quality}%</span>
                      <span>Higher quality (larger files)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center">
                  <PhotoIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Image Migration Info</h4>
                    <p className="text-sm text-gray-600">
                      Images will be copied from the legacy system to the new storage location.
                      Original images are preserved regardless of optimization settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Configuration</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Batch Size
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={formData.max_batch_size || 100}
                    onChange={(e) => handleInputChange('max_batch_size', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Number of records to process in each batch (10-1000)
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center">
                  <CogIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Performance Considerations</h4>
                    <p className="text-sm text-gray-600">
                      Larger batch sizes process faster but use more memory and may cause timeouts.
                      Adjust based on your server capabilities and data volume.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationSettings;