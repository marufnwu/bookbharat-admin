import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { api } from '../../api/axios';
import DynamicSettings from '../../components/settings/DynamicSettings';

interface SettingsGroup {
  label: string;
  description: string;
  icon: string;
  sort_order: number;
  field_count: number;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('');

  // Fetch available settings groups from backend
  const { data: groupsData, isLoading, error } = useQuery({
    queryKey: ['settings', 'groups'],
    queryFn: async () => {
      const response = await api.get('/settings/groups');
      return response.data.data as Record<string, SettingsGroup>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-500">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Failed to load settings</h4>
            <p className="text-sm text-red-700 mt-1">
              Please ensure the backend is running and /settings/groups endpoint is available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!groupsData || Object.keys(groupsData).length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">No settings groups found</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Add config files in backend: config/settings/{'{group}'}.php
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sort groups by sort_order
  const sortedGroups = Object.entries(groupsData)
    .sort(([, a], [, b]) => a.sort_order - b.sort_order);

  // Set first group as active on initial load
  if (!activeTab && sortedGroups.length > 0) {
    setActiveTab(sortedGroups[0][0]);
  }

  const currentGroup = groupsData[activeTab];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your application settings and configuration
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {sortedGroups.map(([key, group]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {group.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab && currentGroup && (
        <DynamicSettings
          group={activeTab}
          title={currentGroup.label}
          description={currentGroup.description}
        />
      )}
    </div>
  );
};

export default Settings;
