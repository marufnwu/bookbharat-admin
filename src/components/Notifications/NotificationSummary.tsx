import React from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { ChannelStatusData } from '../../types/notifications';
import {
  getChannelDisplayInfo,
  isChannelAvailable,
  estimateCostPerNotification,
  formatEventName
} from '../../utils/notificationHelpers';

interface NotificationSummaryProps {
  eventType: string;
  selectedChannels: string[];
  channelStatus: ChannelStatusData;
  isEnabled: boolean;
}

const NotificationSummary: React.FC<NotificationSummaryProps> = ({
  eventType,
  selectedChannels,
  channelStatus,
  isEnabled
}) => {
  const activeChannels = selectedChannels.filter(ch =>
    isChannelAvailable(ch, channelStatus)
  );

  const inactiveChannels = selectedChannels.filter(
    ch => !isChannelAvailable(ch, channelStatus)
  );

  const estimatedCost = estimateCostPerNotification(activeChannels, channelStatus);

  if (!isEnabled) {
    return (
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Event Disabled</h3>
        </div>
        <p className="text-sm text-gray-600">
          This notification event is currently disabled. No notifications will be sent
          regardless of channel selection.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Notification Summary</h3>
      </div>

      {activeChannels.length > 0 ? (
        <>
          <p className="text-sm text-gray-700 mb-3">
            When <strong>{formatEventName(eventType)}</strong> occurs, customers will receive:
          </p>

          <ul className="space-y-2 mb-4">
            {activeChannels.map(channel => {
              const info = getChannelDisplayInfo(channel);
              const Icon = info.icon;
              return (
                <li key={channel} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span>
                    <strong>{info.name}</strong> notification immediately
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Cost & Delivery Info */}
          <div className="flex items-center justify-between p-3 bg-white rounded-md border border-blue-200">
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                Estimated Cost Per Notification:{' '}
                <strong className="text-gray-900">
                  {estimatedCost > 0 ? `₹${estimatedCost.toFixed(2)}` : 'Free'}
                </strong>
              </div>
              <div className="text-xs text-gray-600">
                Expected Delivery Time:{' '}
                <strong className="text-gray-900">&lt; 5 seconds</strong>
              </div>
              {activeChannels.length > 1 && (
                <div className="text-xs text-gray-600">
                  Delivery Method:{' '}
                  <strong className="text-gray-900">Multi-channel (parallel)</strong>
                </div>
              )}
            </div>
          </div>

          {/* User Preference Note */}
          {(activeChannels.includes('sms') || activeChannels.includes('whatsapp')) && (
            <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Customers can opt-out of SMS/WhatsApp in their
                preferences. Email and In-App notifications will always be delivered if
                configured.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              No Active Channels
            </span>
          </div>
          <p className="text-sm text-red-700">
            No communication channels are configured and active. Notifications will{' '}
            <strong>NOT be sent</strong> for this event!
          </p>
        </div>
      )}

      {/* Inactive Channels Warning */}
      {inactiveChannels.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                {inactiveChannels.length} channel(s) selected but not active:
              </p>
              <ul className="space-y-1">
                {inactiveChannels.map(channel => {
                  const info = getChannelDisplayInfo(channel);
                  const status = channelStatus[channel];
                  const Icon = info.icon;

                  return (
                    <li key={channel} className="text-xs text-yellow-700 flex items-center gap-2">
                      <Icon className="w-3 h-3" />
                      <span>
                        {info.name} -{' '}
                        {!status?.configured
                          ? 'Provider not configured'
                          : 'Provider inactive'}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-yellow-700 mt-2">
                These channels will not send notifications until providers are configured and
                activated.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSummary;
