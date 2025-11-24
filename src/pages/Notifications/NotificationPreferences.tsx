import React, { useState } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Settings as SettingsIcon,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationPreferencesApi } from '../../api/notificationSettings';
import { showToast } from '../../utils/toast';

// Import new components
import ChannelCard from '../../components/Notifications/ChannelCard';
import SetupProgressIndicator from '../../components/Notifications/SetupProgressIndicator';
import NotificationSummary from '../../components/Notifications/NotificationSummary';
import EnhancedTestNotification from '../../components/Notifications/EnhancedTestNotification';

// Import types
import type {
  NotificationPreference,
  ChannelStatusData,
  EventStatistics
} from '../../types/notifications';
import {
  getChannelIcon,
  formatEventName,
  isChannelAvailable,
  getInsightsFromStats
} from '../../utils/notificationHelpers';

const NotificationPreferencesImproved: React.FC = () => {
  const queryClient = useQueryClient();
  const [showChannelSelection, setShowChannelSelection] = useState<{
    [key: number]: boolean;
  }>({});
  const [tempChannels, setTempChannels] = useState<{ [key: number]: string[] }>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Fetch notification preferences
  const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: notificationPreferencesApi.getAll
  });

  // Fetch channel status
  const { data: channelStatusData } = useQuery({
    queryKey: ['notification-channel-status'],
    queryFn: notificationPreferencesApi.getChannelStatus
  });

  // Toggle preference mutation
  const togglePreferenceMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      notificationPreferencesApi.toggleStatus(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      showToast.success('Notification preference updated successfully');
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Failed to update preference');
    }
  });

  const preferences: NotificationPreference[] = preferencesData?.data || [];
  const channelStatus: ChannelStatusData = channelStatusData?.data || {};
  const eventTypes = preferencesData?.event_types || {};
  const eventStatistics = preferencesData?.event_statistics || {};

  const validateChannelBeforeEnable = (channel: string): boolean => {
    const status = channelStatus[channel];
    if (!status) {
      showToast.error(`${channel.toUpperCase()} channel is not available`);
      return false;
    }
    if (!status.configured) {
      showToast.error(
        `Please configure ${status.name} provider first before enabling this channel`
      );
      return false;
    }
    if (!status.active) {
      showToast.error(
        `${status.name} provider is configured but inactive. Please activate it first.`
      );
      return false;
    }
    return true;
  };

  const handleTogglePreference = (preference: NotificationPreference) => {
    togglePreferenceMutation.mutate({
      id: preference.id,
      enabled: !preference.enabled
    });
  };

  const handleToggleChannelSelection = (preference: NotificationPreference) => {
    setShowChannelSelection(prev => ({
      ...prev,
      [preference.id]: !prev[preference.id]
    }));

    if (!showChannelSelection[preference.id]) {
      setTempChannels(prev => ({
        ...prev,
        [preference.id]: [...preference.channels]
      }));
    }
  };

  const handleChannelToggle = (preference: NotificationPreference, channel: string) => {
    const currentChannels = tempChannels[preference.id] || preference.channels;
    const isCurrentlySelected = currentChannels.includes(channel);

    // Validate channel before enabling
    if (!isCurrentlySelected) {
      if (!validateChannelBeforeEnable(channel)) {
        return;
      }
    }

    setTempChannels(prev => {
      const updatedChannels = isCurrentlySelected
        ? currentChannels.filter(c => c !== channel)
        : [...currentChannels, channel];

      return {
        ...prev,
        [preference.id]: updatedChannels
      };
    });
  };

  const handleSaveChannelChanges = async (preference: NotificationPreference) => {
    setIsUpdating(true);
    try {
      await notificationPreferencesApi.update(preference.id, {
        channels: tempChannels[preference.id] || preference.channels
      });

      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });

      setShowChannelSelection(prev => ({
        ...prev,
        [preference.id]: false
      }));

      showToast.success('Channel preferences updated successfully');
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to update channel preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderEventCard = (preference: NotificationPreference) => {
    const eventInfo = eventTypes[preference.event_type] || {};
    const isEnabled = preference.enabled;
    const stats: EventStatistics = eventStatistics[preference.event_type] || {};
    const isEditMode = showChannelSelection[preference.id];
    const currentChannels = isEditMode
      ? tempChannels[preference.id] || preference.channels
      : preference.channels;

    const insights = getInsightsFromStats(preference.event_type, stats, channelStatus);

    return (
      <div
        key={preference.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                {eventInfo.name || formatEventName(preference.event_type)}
              </h3>
              <button
                onClick={() => handleTogglePreference(preference)}
                disabled={togglePreferenceMutation.isPending}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors"
              >
                {isEnabled ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-green-600" />
                    <span className="text-green-600">Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400">Inactive</span>
                  </>
                )}
              </button>
            </div>

            {eventInfo.description && (
              <p className="text-gray-600 text-sm mb-3">{eventInfo.description}</p>
            )}

            {isEnabled && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                <SettingsIcon className="w-4 h-4" />
                When this event is active, notifications will be sent through the channels you
                select below.
              </div>
            )}

            {!isEnabled && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                This notification is currently disabled. Enable it to start sending notifications.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4" />

        {/* Channel Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Delivery Channels</h4>
            {isEnabled && (
              <button
                onClick={() => handleToggleChannelSelection(preference)}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isEditMode ? 'Done Editing' : 'Edit Channels'}
              </button>
            )}
          </div>

          {isEditMode ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                Select how customers receive this notification:
              </p>

              {['email', 'sms', 'whatsapp', 'in_app'].map(channel => (
                <ChannelCard
                  key={channel}
                  channel={channel as any}
                  isSelected={currentChannels.includes(channel)}
                  channelStatus={channelStatus[channel] || { configured: false, active: false }}
                  onToggle={() => handleChannelToggle(preference, channel)}
                  disabled={!isEnabled}
                />
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleToggleChannelSelection(preference)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveChannelChanges(preference)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {preference.channels.map(channel => {
                const Icon = getChannelIcon(channel);
                const isAvailable = isChannelAvailable(channel, channelStatus);
                const status = channelStatus[channel];

                return (
                  <div
                    key={channel}
                    className={`p-3 rounded-lg border ${
                      isAvailable
                        ? 'border-green-200 bg-green-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium capitalize">
                        {channel === 'in_app' ? 'In-App' : channel}
                      </span>
                    </div>
                    {status?.provider && (
                      <p className="text-xs text-gray-600">{status.provider}</p>
                    )}
                    <p className={`text-xs mt-1 ${isAvailable ? 'text-green-700' : 'text-yellow-700'}`}>
                      {isAvailable ? '✓ Active' : '⚠ Not configured'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        {!isEditMode && (
          <NotificationSummary
            eventType={preference.event_type}
            selectedChannels={preference.channels}
            channelStatus={channelStatus}
            isEnabled={isEnabled}
          />
        )}

        {/* Statistics */}
        {stats?.total && stats.total.total > 0 && !isEditMode && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">Performance Statistics</h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total.sent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                <div className="flex items-center gap-1">
                  <p
                    className={`text-2xl font-bold ${
                      stats.total.success_rate >= 95
                        ? 'text-green-600'
                        : stats.total.success_rate >= 80
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {stats.total.success_rate}%
                  </p>
                  {stats.total.success_rate >= 95 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : stats.total.success_rate < 80 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Last 7 Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.last_7_days?.total || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Last 30 Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.last_30_days?.total || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-900 mb-2">
                  Insights & Recommendations
                </h5>
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      insight.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : insight.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : insight.type === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        insight.type === 'success'
                          ? 'text-green-800'
                          : insight.type === 'warning'
                          ? 'text-yellow-800'
                          : insight.type === 'error'
                          ? 'text-red-800'
                          : 'text-blue-800'
                      }`}
                    >
                      {insight.message}
                    </p>
                    {insight.action && (
                      <a
                        href={insight.action.link}
                        className={`text-xs font-medium mt-2 inline-block underline ${
                          insight.type === 'success'
                            ? 'text-green-700'
                            : insight.type === 'warning'
                            ? 'text-yellow-700'
                            : insight.type === 'error'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {insight.action.label} →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-gray-600 mt-2">
          Configure which events trigger notifications and through which channels
        </p>
      </div>

      {/* Setup Progress Indicator */}
      <SetupProgressIndicator channelStatus={channelStatus} preferences={preferences} />

      {/* Enhanced Test Notification */}
      <EnhancedTestNotification
        preferences={preferences}
        channelStatus={channelStatus}
        eventTypes={eventTypes}
      />

      {/* Event Notification Preferences List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Event Notification Preferences</h2>
        {preferencesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {preferences
              .sort((a, b) => a.priority - b.priority)
              .map(preference => renderEventCard(preference))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPreferencesImproved;
