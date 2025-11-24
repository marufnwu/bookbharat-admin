import React, { useState } from 'react';
import { Send, AlertTriangle, CheckCircle, XCircle, Eye, Mail, Smartphone, MessageSquare, Bell } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { notificationPreferencesApi } from '../../api/notificationSettings';
import { showToast } from '../../utils/toast';
import type { NotificationPreference, ChannelStatusData } from '../../types/notifications';
import {
  getChannelDisplayInfo,
  isChannelAvailable,
  formatEventName
} from '../../utils/notificationHelpers';

interface EnhancedTestNotificationProps {
  preferences: NotificationPreference[];
  channelStatus: ChannelStatusData;
  eventTypes: { [key: string]: any };
}

const EnhancedTestNotification: React.FC<EnhancedTestNotificationProps> = ({
  preferences,
  channelStatus,
  eventTypes
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [testEmail, setTestEmail] = useState<string>('');
  const [testPhone, setTestPhone] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const testNotificationMutation = useMutation({
    mutationFn: notificationPreferencesApi.test,
    onSuccess: (response: any) => {
      showToast.success(response?.message || 'Test notification sent successfully!');
      setShowPreview(false);
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || 'Failed to send test notification'
      );
    }
  });

  const selectedPreference = preferences.find(p => p.event_type === selectedEvent);
  const availableChannels = selectedPreference?.channels.filter(ch =>
    isChannelAvailable(ch, channelStatus)
  ) || [];

  const handleSendTest = () => {
    if (!selectedEvent) {
      showToast.error('Please select an event to test');
      return;
    }

    if (!testEmail && !testPhone) {
      showToast.error('Please enter either an email address or phone number');
      return;
    }

    if (!selectedPreference || !selectedPreference.enabled) {
      showToast.error('Selected event is not enabled');
      return;
    }

    if (availableChannels.length === 0) {
      showToast.error('No available channels for this event');
      return;
    }

    const recipient = testEmail || testPhone;

    testNotificationMutation.mutate({
      event_type: selectedEvent,
      recipient,
      channels: availableChannels,
      sample_data: {
        order_id: 'TEST-123',
        customer_name: 'Test Customer',
        amount: '99.99'
      }
    });
  };

  const getChannelPreview = (channel: string) => {
    const templates: Record<string, Record<string, { subject?: string; message: string; template?: string }>> = {
      email: {
        order_placed: {
          subject: 'Your Order #TEST-123 Has Been Placed',
          message: 'Thank you for your order! Your order #TEST-123 for ₹99.99 has been successfully placed.',
          template: 'order_placed.blade.php'
        },
        order_shipped: {
          subject: 'Your Order #TEST-123 Has Been Shipped',
          message: 'Great news! Your order #TEST-123 has been shipped and is on its way.',
          template: 'order_shipped.blade.php'
        }
      },
      sms: {
        order_placed: {
          message: 'Hi Test Customer, your order #TEST-123 for ₹99.99 has been placed successfully. Thank you for shopping with us!'
        },
        order_shipped: {
          message: 'Your order #TEST-123 has been shipped and will arrive soon. Track your order on our website.'
        }
      },
      whatsapp: {
        order_placed: {
          message: '✅ Order Confirmed!\n\nHi Test Customer,\n\nYour order #TEST-123 for ₹99.99 has been placed successfully.\n\nThank you for shopping with BookBharat!'
        },
        order_shipped: {
          message: '📦 Order Shipped!\n\nYour order #TEST-123 is on its way!\n\nExpected delivery: 2-3 business days'
        }
      },
      in_app: {
        order_placed: {
          subject: 'Order Placed',
          message: 'Your order #TEST-123 has been placed successfully'
        },
        order_shipped: {
          subject: 'Order Shipped',
          message: 'Your order #TEST-123 has been shipped'
        }
      }
    };

    const eventTemplates = templates[channel]?.[selectedEvent] || templates[channel]?.order_placed;
    return eventTemplates || { message: 'Sample notification content' };
  };

  return (
    <div id="test-notification-section" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-6 h-6 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Test Notification Before Going Live</h2>
      </div>

      <div className="space-y-4">
        {/* Step 1: Select Event */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1. Select Event to Test
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setShowPreview(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose an event...</option>
            {preferences
              .filter(p => p.enabled)
              .map(preference => (
                <option key={preference.id} value={preference.event_type}>
                  {eventTypes[preference.event_type]?.name ||
                    formatEventName(preference.event_type)}
                </option>
              ))}
          </select>
        </div>

        {/* Step 2: Enter Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2. Enter Test Recipient
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="admin@bookbharat.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Phone Number (for SMS/WhatsApp)
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Preview */}
        {selectedEvent && (testEmail || testPhone) && (
          <>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  3. Preview: What Will Be Sent?
                </label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              {showPreview && (
                <div className="space-y-3">
                  {selectedPreference?.channels.map(channel => {
                    const isAvailable = isChannelAvailable(channel, channelStatus);
                    const channelInfo = getChannelDisplayInfo(channel);
                    const preview = getChannelPreview(channel);
                    const Icon = channelInfo.icon;

                    const needsEmail = channel === 'email';
                    const needsPhone = channel === 'sms' || channel === 'whatsapp';
                    const hasRecipient = (needsEmail && testEmail) || (needsPhone && testPhone) || channel === 'in_app';

                    return (
                      <div
                        key={channel}
                        className={`border-2 rounded-lg p-4 ${
                          isAvailable && hasRecipient
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-gray-700" />
                            <span className="font-semibold text-gray-900">
                              {channelInfo.name}
                            </span>
                          </div>
                          {isAvailable && hasRecipient ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {isAvailable && hasRecipient ? (
                          <div className="space-y-2">
                            <div className="text-sm">
                              {channel === 'email' && (
                                <div className="space-y-1">
                                  <p className="text-gray-600">
                                    ✓ Will be sent to: <strong>{testEmail}</strong>
                                  </p>
                                  {preview.subject && (
                                    <p className="text-gray-600">
                                      Subject: <strong>{preview.subject}</strong>
                                    </p>
                                  )}
                                  {preview.template && (
                                    <p className="text-gray-600 text-xs">
                                      Template: {preview.template}
                                    </p>
                                  )}
                                </div>
                              )}
                              {(channel === 'sms' || channel === 'whatsapp') && (
                                <div className="space-y-1">
                                  <p className="text-gray-600">
                                    ✓ Will be sent to: <strong>{testPhone}</strong>
                                  </p>
                                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-800 whitespace-pre-line">
                                      {preview.message}
                                    </p>
                                  </div>
                                  {channel === 'sms' && (
                                    <p className="text-xs text-gray-500">
                                      Cost: ~₹0.30 per message
                                    </p>
                                  )}
                                  {channel === 'whatsapp' && (
                                    <p className="text-xs text-gray-500">
                                      Cost: ~₹0.15 per message
                                    </p>
                                  )}
                                </div>
                              )}
                              {channel === 'in_app' && (
                                <div className="space-y-1">
                                  <p className="text-gray-600">
                                    ✓ Will create in-app notification
                                  </p>
                                  {preview.subject && (
                                    <p className="text-gray-600">
                                      Title: <strong>{preview.subject}</strong>
                                    </p>
                                  )}
                                  <p className="text-gray-600 text-sm">
                                    Message: {preview.message}
                                  </p>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              Provider: {channelStatus[channel]?.provider || 'Built-in'}
                            </p>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {!isAvailable ? (
                              <p className="flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                Cannot send - Provider not configured
                              </p>
                            ) : !hasRecipient ? (
                              <p className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                {needsEmail
                                  ? 'Enter email address above'
                                  : 'Enter phone number above'}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Warning & Sample Data */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Test Mode</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This will send real notifications to the test recipient, but will NOT
                      affect production customers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs font-medium text-blue-800 mb-2">
                  Sample Data Being Used:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Order ID: TEST-123</li>
                  <li>• Customer Name: Test Customer</li>
                  <li>• Amount: ₹99.99</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Send Button */}
        <div className="border-t border-gray-200 pt-4 flex gap-3">
          <button
            onClick={handleSendTest}
            disabled={
              testNotificationMutation.isPending ||
              !selectedEvent ||
              (!testEmail && !testPhone) ||
              availableChannels.length === 0
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Send className="w-4 h-4" />
            {testNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
          </button>
          <button
            onClick={() => {
              setSelectedEvent('');
              setTestEmail('');
              setTestPhone('');
              setShowPreview(false);
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTestNotification;
