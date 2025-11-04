import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Settings,
  Send,
  Info,
  ExternalLink,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationPreferencesApi } from '../../api/notificationSettings';
import { showToast } from '../../utils/toast';

interface NotificationPreference {
  id: number;
  event_type: string;
  channels: string[];
  enabled: boolean;
  description?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface ChannelStatus {
  [channel: string]: {
    name: string;
    icon: string;
    configured: boolean;
    active: boolean;
    provider: string | null;
    providerLink?: string;
  };
}

const NotificationPreferences: React.FC = () => {
  const queryClient = useQueryClient();
  const [testRecipient, setTestRecipient] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [showChannelSelection, setShowChannelSelection] = useState<{[key: number]: boolean}>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [tempChannels, setTempChannels] = useState<{[key: number]: string[]}>({});

  // Fetch notification preferences
  const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: notificationPreferencesApi.getAll,
  });

  // Fetch channel status
  const { data: channelStatusData } = useQuery({
    queryKey: ['notification-channel-status'],
    queryFn: notificationPreferencesApi.getChannelStatus,
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

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: (data: {
      event_type: string;
      recipient: string;
      channels: string[];
      sample_data?: any;
    }) => notificationPreferencesApi.test(data),
    onSuccess: (response: any) => {
      showToast.success(response?.message || 'Test notification sent successfully!');
      setTestRecipient('');
      setSelectedEvent('');
      setIsTesting(false);
    },
    onError: (error: any) => {
      showToast.error((error as any)?.response?.data?.message || 'Failed to send test notification');
      setIsTesting(false);
    }
  });

  const preferences = preferencesData?.data || [];
  const channelStatus = channelStatusData?.data || {};
  const eventTypes = preferencesData?.event_types || {};
  const availableChannels = preferencesData?.available_channels || [];
  const channelIcons = preferencesData?.channel_icons || {};
  const eventStatistics = preferencesData?.event_statistics || {};

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return Smartphone;
      case 'whatsapp': return MessageSquare;
      case 'in_app': return Bell;
      default: return Bell;
    }
  };

  const isChannelAvailable = (channel: string) => {
    return channelStatus[channel]?.configured && channelStatus[channel]?.active;
  };

  const getChannelCommunicationLink = (channel: string) => {
    const channelMap: Record<string, string> = {
      'email': '/communication/email',
      'sms': '/communication/sms',
      'whatsapp': '/communication/whatsapp',
      'in_app': '/communication'
    };
    return channelMap[channel] || '/communication';
  };

  const validateChannelBeforeEnable = (channel: string): boolean => {
    const status = channelStatus[channel];
    if (!status) {
      showToast.error(`${channel.toUpperCase()} channel is not available`);
      return false;
    }
    if (!status.configured) {
      showToast.error(`Please configure ${status.name} provider first before enabling this channel`);
      return false;
    }
    if (!status.active) {
      showToast.error(`${status.name} provider is configured but inactive. Please activate it first.`);
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

  const handleTestNotification = () => {
    if (!selectedEvent || !testRecipient) {
      showToast.error('Please select an event and enter a recipient');
      return;
    }

    const preference = preferences.find((p: NotificationPreference) => p.event_type === selectedEvent);
    if (!preference || !preference.enabled) {
      showToast.error('Selected event is not enabled');
      return;
    }

    const availableChannelsForEvent = preference.channels.filter((channel: string) => isChannelAvailable(channel));
    if (availableChannelsForEvent.length === 0) {
      showToast.error('No available channels for this event. Please configure communication channels first.');
      return;
    }

    setIsTesting(true);
    testNotificationMutation.mutate({
      event_type: selectedEvent,
      recipient: testRecipient,
      channels: availableChannelsForEvent,
      sample_data: {
        order_id: 'TEST-123',
        customer_name: 'Test Customer',
        amount: '99.99'
      }
    });
  };

  const handleToggleChannelSelection = (preference: NotificationPreference) => {
    setShowChannelSelection(prev => ({
      ...prev,
      [preference.id]: !prev[preference.id]
    }));

    // Initialize temp channels when opening
    if (!showChannelSelection[preference.id]) {
      setTempChannels(prev => ({
        ...prev,
        [preference.id]: [...preference.channels]
      }));
    }
  };

  const handleChannelToggle = (preference: NotificationPreference, channel: string) => {
    // Validate channel before enabling
    if (!tempChannels[preference.id]?.includes(channel)) {
      if (!validateChannelBeforeEnable(channel)) {
        return;
      }
    }

    setTempChannels(prev => {
      const currentChannels = prev[preference.id] || [...preference.channels];
      const newChannels = currentChannels.includes(channel)
        ? currentChannels.filter(c => c !== channel)
        : [...currentChannels, channel];

      return {
        ...prev,
        [preference.id]: newChannels
      };
    });
  };

  const handleSaveChannelChanges = async (preference: NotificationPreference) => {
    setIsUpdating(true);
    try {
      await notificationPreferencesApi.update(preference.id, {
        channels: tempChannels[preference.id] || preference.channels
      });

      // Invalidate and refetch preferences
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });

      // Close the edit mode
      setShowChannelSelection(prev => ({
        ...prev,
        [preference.id]: false
      }));

      showToast.success('Channel preferences updated successfully');
    } catch (error: any) {
      showToast.error((error as any)?.response?.data?.message || 'Failed to update channel preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderPreferenceRow = (preference: NotificationPreference) => {
    const eventInfo = eventTypes[preference.event_type] || {};
    const isEnabled = preference.enabled;
    const enabledChannels = preference.channels.filter((channel: string) => isChannelAvailable(channel));
    const stats = eventStatistics[preference.event_type] || null;

    return (
      <div key={preference.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {eventInfo.name || preference.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <button
                onClick={() => handleTogglePreference(preference)}
                disabled={togglePreferenceMutation.isPending}
                className="flex items-center space-x-1 text-sm font-medium"
              >
                {isEnabled ? (
                  <>
                    <ToggleRight className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-400">Disabled</span>
                  </>
                )}
              </button>
            </div>

            {eventInfo.description && (
              <p className="text-gray-600 text-sm mb-3">{eventInfo.description}</p>
            )}

            {/* Channel Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Notification Channels:</span>
                <button
                  onClick={() => handleToggleChannelSelection(preference)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showChannelSelection[preference.id] ? 'Done' : 'Edit Channels'}
                </button>
              </div>

              {showChannelSelection[preference.id] ? (
                <div className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                  <p className="text-xs text-gray-600 mb-2">Select which channels to use for this event:</p>
                  {['email', 'sms', 'whatsapp', 'in_app'].map((channel) => {
                    const Icon = getChannelIcon(channel);
                    const isAvailable = isChannelAvailable(channel);
                    const currentTempChannels = tempChannels[preference.id] || preference.channels;
                    const isSelected = currentTempChannels.includes(channel);
                    const channelStatusData = channelStatus[channel];

                    return (
                      <div key={channel} className="flex items-center justify-between p-2 rounded-md hover:bg-white">
                        <label className={`flex items-center space-x-2 flex-1 cursor-pointer ${
                          !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                        }`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleChannelToggle(preference, channel)}
                            disabled={!isAvailable}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Icon className={`h-4 w-4 ${isAvailable ? 'text-gray-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium capitalize ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                            {channel === 'in_app' ? 'In-App' : channel}
                          </span>
                          {channelStatusData?.provider && (
                            <Link
                              to={channelStatusData.providerLink || getChannelCommunicationLink(channel)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ({channelStatusData.provider})
                            </Link>
                          )}
                        </label>
                        {!isAvailable && (
                          <Link
                            to={getChannelCommunicationLink(channel)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Configure Provider
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 mt-2">
                    <button
                      onClick={() => handleToggleChannelSelection(preference)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveChannelChanges(preference)}
                      disabled={isUpdating}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {preference.channels.length > 0 ? (
                    preference.channels.map((channel: string) => {
                      const Icon = getChannelIcon(channel);
                      const isAvailable = isChannelAvailable(channel);

                      const channelStatusData = channelStatus[channel];
                      return (
                        <div
                          key={channel}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                            isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                          title={channelStatusData?.provider ? `Provider: ${channelStatusData.provider}` : 'Not configured'}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="text-xs font-medium capitalize">{channel === 'in_app' ? 'In-App' : channel}</span>
                          {channelStatusData?.provider && (
                            <Link
                              to={channelStatusData.providerLink || getChannelCommunicationLink(channel)}
                              className="text-xs ml-1 text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ({channelStatusData.provider})
                            </Link>
                          )}
                          {isAvailable ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              <Link
                                to={getChannelCommunicationLink(channel)}
                                className="ml-1 text-xs underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Configure
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-sm text-gray-500">No channels selected</span>
                  )}
                </div>
              )}
            </div>

            {/* Status Message */}
            {!isEnabled && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                <span>This notification is currently disabled</span>
              </div>
            )}

            {isEnabled && enabledChannels.length === 0 && (
              <div className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>No communication channels are configured. Please configure Email, SMS, or WhatsApp first.</span>
              </div>
            )}

            {/* Event Statistics */}
            {stats && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">Notification Statistics</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  {stats.total && stats.total.total > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Sent</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {(stats.total?.sent || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                          <div className="flex items-center space-x-1">
                            <p className={`text-lg font-semibold ${
                              (stats.total?.success_rate || 0) >= 95 
                                ? 'text-green-600' 
                                : (stats.total?.success_rate || 0) >= 80 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                            }`}>
                              {(stats.total?.success_rate || 0)}%
                            </p>
                            {(stats.total?.success_rate || 0) >= 95 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (stats.total?.success_rate || 0) < 80 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last 7 Days</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {(stats.last_7_days?.total || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last 30 Days</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {(stats.last_30_days?.total || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Channel Breakdown */}
                      {stats.channels && Object.keys(stats.channels).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">By Channel:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(stats.channels).map(([channel, channelStat]: [string, any]) => {
                              const Icon = getChannelIcon(channel);
                              return (
                                <div key={channel} className="bg-white rounded-md border border-gray-200 p-2">
                                  <div className="flex items-center space-x-1 mb-1">
                                    <Icon className="h-3 w-3 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-700 capitalize">
                                      {channel === 'in_app' ? 'In-App' : channel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">Sent: {channelStat.sent || 0}</p>
                                  <p className={`text-xs font-medium ${
                                    (channelStat.success_rate || 0) >= 95 ? 'text-green-600' :
                                    (channelStat.success_rate || 0) >= 80 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {(channelStat.success_rate || 0)}% success
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No notification statistics available yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Statistics will appear here once notifications are sent for this event.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-gray-600 mt-1">Configure which events trigger notifications and through which channels</p>
      </div>

      {/* Provider Status Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Status</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure communication providers before enabling channels for events. Each channel requires an active provider.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(channelStatus).map(([channel, status]: [string, any]) => {
            const Icon = getChannelIcon(channel);
            return (
              <div
                key={channel}
                className={`p-4 rounded-lg border ${
                  status.configured && status.active
                    ? 'border-green-200 bg-green-50'
                    : status.configured
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      status.configured && status.active
                        ? 'bg-green-100'
                        : status.configured
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        status.configured && status.active
                          ? 'text-green-600'
                          : status.configured
                          ? 'text-yellow-600'
                          : 'text-red-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{status.name}</p>
                      {status.provider ? (
                        <Link
                          to={status.providerLink || getChannelCommunicationLink(channel)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium mt-1 block"
                        >
                          Provider: {status.provider}
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">No provider configured</p>
                      )}
                      <p className={`text-xs mt-1 ${
                        status.configured && status.active
                          ? 'text-green-700'
                          : status.configured
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
                        {status.configured && status.active
                          ? '✓ Active and ready'
                          : status.configured
                          ? '⚠ Configured but inactive'
                          : '✗ Not configured'}
                      </p>
                      {/* Health Indicator */}
                      {status.health && status.configured && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Health:</span>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${
                                status.health.status === 'healthy' ? 'bg-green-500' :
                                status.health.status === 'degraded' ? 'bg-yellow-500' :
                                status.health.status === 'critical' ? 'bg-red-500' :
                                'bg-gray-400'
                              }`} />
                              <span className={`text-xs font-medium capitalize ${
                                status.health.status === 'healthy' ? 'text-green-700' :
                                status.health.status === 'degraded' ? 'text-yellow-700' :
                                status.health.status === 'critical' ? 'text-red-700' :
                                'text-gray-600'
                              }`}>
                                {status.health.status === 'healthy' ? 'Healthy' :
                                 status.health.status === 'degraded' ? 'Degraded' :
                                 status.health.status === 'critical' ? 'Critical' :
                                 'Inactive'}
                              </span>
                            </div>
                          </div>
                          {status.health.success_rate !== null && (
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-xs text-gray-500">Success Rate:</span>
                              <span className={`text-xs font-medium ${
                                status.health.success_rate >= 95 ? 'text-green-600' :
                                status.health.success_rate >= 80 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {status.health.success_rate}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Link
                    to={getChannelCommunicationLink(channel)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    {status.configured ? 'Update Provider' : 'Configure Provider'}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Test Notification */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Notification</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an event...</option>
                {preferences
                  .filter((p: NotificationPreference) => p.enabled)
                  .map((preference: NotificationPreference) => (
                    <option key={preference.id} value={preference.event_type}>
                      {eventTypes[preference.event_type]?.name || preference.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Recipient
              </label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Email address or phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleTestNotification}
            disabled={isTesting || !selectedEvent || !testRecipient}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>{isTesting ? 'Sending...' : 'Send Test Notification'}</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Notification Preferences</h2>
        {preferencesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {preferences
              .sort((a: NotificationPreference, b: NotificationPreference) => a.priority - b.priority)
              .map((preference: NotificationPreference) => renderPreferenceRow(preference))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPreferences;