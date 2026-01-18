import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CogIcon,
  ServerIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import api, { type MigrationSettings as MigrationSettingsType } from '../../api';
import { LoadingSpinner } from '../../components';
import { toast } from 'react-hot-toast';

const MigrationSettings: React.FC = () => {
  const queryClient = useQueryClient();
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

  // Update form when settings are loaded
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Migration Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure how your new store talks to the legacy system.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {updateSettingsMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Connection (Critical) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <ServerIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Legacy Connection</h3>
                  <p className="text-sm text-gray-500">API credentials for the old system</p>
                </div>
              </div>
              <button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                 className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            
            <div className="p-6 space-y-6">
               {/* Connection Status Feedback */}
              {testConnectionMutation.data && (
                <div className={`rounded-md p-4 mb-4 flex items-center gap-3 ${
                  (testConnectionMutation.data as any).data?.success 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {(testConnectionMutation.data as any).data?.success 
                    ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                    : <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                  }
                  <p className="text-sm font-medium">
                    {(testConnectionMutation.data as any).data?.message}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legacy System URL</label>
                <input
                  type="url"
                  value={formData.legacy_system_url || ''}
                  onChange={(e) => handleInputChange('legacy_system_url', e.target.value)}
                  placeholder="https://old-store.com"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.legacy_system_token || ''}
                    onChange={(e) => handleInputChange('legacy_system_token', e.target.value)}
                    placeholder="••••••••••••••••"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Synchronization</h3>
                <p className="text-sm text-gray-500">Automated background updates</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">Data Auto-Sync</div>
                  <div className="text-sm text-gray-500">Automatically pull changes every interval</div>
                </div>
                <button
                    type="button"
                    onClick={() => handleInputChange('auto_sync_enabled', !formData.auto_sync_enabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.auto_sync_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.auto_sync_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interval (Minutes)</label>
                    <input
                      type="number"
                      min="5"
                      value={formData.auto_sync_interval || 15}
                      onChange={(e) => handleInputChange('auto_sync_interval', parseInt(e.target.value))}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conflict Resolution</label>
                    <select
                      value={formData.conflict_resolution || 'old_system_priority'}
                      onChange={(e) => handleInputChange('conflict_resolution', e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                    >
                      <option value="old_system_priority">Old System Priority (Safer)</option>
                      <option value="new_system_priority">New System Priority</option>
                      <option value="manual_review">Manual Review Required</option>
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sync Entities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['categories', 'products', 'product_images'].map((entityType) => (
                    <label key={entityType} className={`
                      relative flex items-center p-3 rounded-lg border cursor-pointer border-gray-200 hover:border-blue-300 transition-colors
                      ${formData.syncable_entity_types?.includes(entityType) ? 'bg-blue-50 border-blue-200' : 'bg-white'}
                    `}>
                      <input
                        type="checkbox"
                        checked={formData.syncable_entity_types?.includes(entityType) || false}
                        onChange={() => handleEntityTypeToggle(entityType)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                      />
                      <span className="text-sm font-medium text-gray-900 capitalize">{entityType.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Optimization & Advanced */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <PhotoIcon className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Image Optimization</h3>
             </div>
             <div className="p-4 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Optimize Images</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('image_optimization_enabled', !formData.image_optimization_enabled)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.image_optimization_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.image_optimization_enabled ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
               </div>
               
               {formData.image_optimization_enabled && (
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Compression Quality</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={formData.image_quality || 85}
                        onChange={(e) => handleInputChange('image_quality', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium text-blue-600 w-8">{formData.image_quality}%</span>
                    </div>
                 </div>
               )}
               <p className="text-xs text-gray-500">
                  Reduces file size during import. Original URLs are preserved in the legacy mapping.
               </p>
             </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <CogIcon className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Performance</h3>
             </div>
             <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                  <input
                    type="number"
                    value={formData.max_batch_size || 100}
                    onChange={(e) => handleInputChange('max_batch_size', parseInt(e.target.value))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Records per request. Lower this if you experience timeouts.
                  </p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MigrationSettings;