import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle, ChevronRightIcon, Settings as SettingsIcon } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState<string>('');

  // Fetch available settings groups from backend
  const { data: groupsData, isLoading, error } = useQuery({
    queryKey: ['settings', 'groups'],
    queryFn: async () => {
      const response = await api.get('/settings/groups');
      return response.data.data as Record<string, SettingsGroup>;
    },
  });

  // Set initial active section from URL path
  const sortedGroups = groupsData
    ? Object.entries(groupsData).sort(([, a], [, b]) => a.sort_order - b.sort_order)
    : [];

  useEffect(() => {
    if (groupsData && !activeSection) {
      const pathParts = window.location.pathname.split('/');
      const settingsType = pathParts[pathParts.length - 1];
      if (settingsType && settingsType in groupsData) {
        setActiveSection(settingsType);
      } else if (sortedGroups.length > 0) {
        setActiveSection(sortedGroups[0][0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsData]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    window.history.replaceState(null, '', `/settings/${sectionId}`);
  };

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

  const currentGroup = groupsData[activeSection];

  return (
    <div className="flex gap-6">
      {/* Left Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
          <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</h2>
          </div>
          <nav className="p-1.5">
            {sortedGroups.map(([key, group]) => {
              const isActive = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSectionChange(key)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all text-sm
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <SettingsIcon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className={`flex-1 font-medium truncate ${isActive ? 'text-blue-700' : ''}`}>
                    {group.label}
                  </span>
                  <ChevronRightIcon className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-300'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-5 w-5 text-blue-500" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentGroup?.label || activeSection}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentGroup?.description || `Manage ${activeSection} settings`}
                </p>
              </div>
            </div>
          </div>

          {/* Section Content */}
          <div className="p-6">
            {activeSection && currentGroup && (
              <DynamicSettings
                group={activeSection}
                title={currentGroup.label}
                description={currentGroup.description}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
