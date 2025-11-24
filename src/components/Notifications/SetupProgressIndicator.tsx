import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Settings,
  Bell,
  BarChart3
} from 'lucide-react';
import type { ChannelStatusData, NotificationPreference } from '../../types/notifications';
import { getChannelDisplayInfo, isChannelAvailable } from '../../utils/notificationHelpers';

interface SetupProgressIndicatorProps {
  channelStatus: ChannelStatusData;
  preferences: NotificationPreference[];
}

const SetupProgressIndicator: React.FC<SetupProgressIndicatorProps> = ({
  channelStatus,
  preferences
}) => {
  // Calculate provider setup progress
  const availableProviders = ['email', 'sms', 'whatsapp'];
  const configuredProviders = availableProviders.filter(
    channel => channelStatus[channel]?.configured && channelStatus[channel]?.active
  );
  const providerProgress = configuredProviders.length;
  const totalProviders = availableProviders.length;

  // Calculate event configuration progress
  const configuredEvents = preferences.filter(
    pref => pref.enabled && pref.channels.some(ch => isChannelAvailable(ch, channelStatus))
  );
  const eventProgress = configuredEvents.length;
  const totalEvents = preferences.length;

  // Determine overall status
  const isProviderSetupComplete = providerProgress === totalProviders;
  const hasMinimumProviders = providerProgress >= 1;
  const hasConfiguredEvents = eventProgress > 0;

  const getUnconfiguredProviders = () => {
    return availableProviders.filter(
      channel => !channelStatus[channel]?.configured || !channelStatus[channel]?.active
    );
  };

  const unconfiguredProviders = getUnconfiguredProviders();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Notification System Setup
        </h2>
        {isProviderSetupComplete && hasConfiguredEvents && (
          <span className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            Setup Complete
          </span>
        )}
        {!hasMinimumProviders && (
          <span className="flex items-center gap-1 text-sm font-medium text-red-700 bg-red-100 px-3 py-1 rounded-full">
            <XCircle className="w-4 h-4" />
            Action Required
          </span>
        )}
        {hasMinimumProviders && !isProviderSetupComplete && (
          <span className="flex items-center gap-1 text-sm font-medium text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
            <AlertCircle className="w-4 h-4" />
            Partial Setup
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Step 1: Configure Providers */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                  isProviderSetupComplete
                    ? 'bg-green-100 text-green-700'
                    : hasMinimumProviders
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Configure Communication Providers</h3>
                <p className="text-sm text-gray-600">
                  Set up email, SMS, and WhatsApp providers to enable notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isProviderSetupComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {providerProgress}/{totalProviders} Completed
                </span>
              )}
            </div>
          </div>

          <div className="ml-11 space-y-2">
            {availableProviders.map(channel => {
              const status = channelStatus[channel];
              const isConfigured = status?.configured && status?.active;
              const channelInfo = getChannelDisplayInfo(channel);
              const Icon = channelInfo.icon;

              return (
                <div
                  key={channel}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {isConfigured ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {channelInfo.name}
                    </span>
                    {status?.provider && (
                      <span className="text-xs text-gray-500">({status.provider})</span>
                    )}
                  </div>
                  {isConfigured ? (
                    <Link
                      to={status.providerLink || channelInfo.setupLink}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      View Settings
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <Link
                      to={channelInfo.setupLink}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                    >
                      Configure Now
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {!isProviderSetupComplete && unconfiguredProviders.length > 0 && (
            <div className="ml-11 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {unconfiguredProviders.length} provider(s) not configured
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Configure{' '}
                    {unconfiguredProviders
                      .map(ch => getChannelDisplayInfo(ch).name)
                      .join(', ')}{' '}
                    to expand notification reach and improve delivery rates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Select Channels for Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                  hasConfiguredEvents
                    ? 'bg-green-100 text-green-700'
                    : hasMinimumProviders
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Select Channels for Events</h3>
                <p className="text-sm text-gray-600">
                  Configure which notification channels each event should use
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-600">
              {eventProgress}/{totalEvents} Configured
            </span>
          </div>

          <div className="ml-11">
            <p className="text-sm text-gray-700">
              Configure notification channels for each event type below ↓
            </p>
            {!hasMinimumProviders && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-600">
                  Complete Step 1 to start configuring events
                </p>
              </div>
            )}
            {hasMinimumProviders && eventProgress === 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    No events configured yet. Select channels for events below to start sending
                    notifications.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Test & Monitor */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                  hasConfiguredEvents
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Test & Monitor Performance</h3>
                <p className="text-sm text-gray-600">
                  Send test notifications and monitor delivery statistics
                </p>
              </div>
            </div>
          </div>

          <div className="ml-11 flex gap-3">
            <button
              disabled={!hasConfiguredEvents}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={() => {
                const testSection = document.getElementById('test-notification-section');
                if (testSection) {
                  testSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <Bell className="w-4 h-4" />
              Send Test Notification
            </button>
            <Link
              to="/notifications/analytics"
              className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              View Analytics
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupProgressIndicator;
