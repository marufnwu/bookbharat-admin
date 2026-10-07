/**
 * Notification Events — the ONLY screen where event routing is controlled:
 * which channels send each notification event, quiet-hours exemption, and
 * test sends. Backed by /settings/messaging/events.
 */

import React, { useState } from 'react';
import { Mail as MailIcon, MessageSquare, Phone, Send, Lock } from 'lucide-react';
import { Banner, Button, Card, CardContent, CardHeader, CardTitle, Badge, SkeletonList } from '../../components';
import { useMessageEvents, useTestEvent, useUpdateEvent } from '../../api/messaging/hooks';
import type { MessageChannel, MessageEventMap } from '../../api/messaging/types';

const CHANNELS: { key: MessageChannel; label: string; icon: React.ReactNode }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="h-5 w-5" /> },
  { key: 'sms', label: 'SMS', icon: <Phone className="h-5 w-5" /> },
  { key: 'email', label: 'Email', icon: <MailIcon className="h-5 w-5" /> },
];

export const NotificationEvents: React.FC = () => {
  const { data: events, isLoading } = useMessageEvents();
  const updateEvent = useUpdateEvent();
  const testEvent = useTestEvent();
  const [testRecipient, setTestRecipient] = useState('');
  const [testing, setTesting] = useState<{ event: string; channel: MessageChannel } | null>(null);

  const entries = Object.entries((events ?? {}) as MessageEventMap);

  const handleToggle = (
    event: string,
    current: { channels: Record<MessageChannel, boolean>; quiet_hours_exempt: boolean },
    channel: MessageChannel,
  ) => {
    updateEvent.mutate({
      event,
      payload: { ...current, channels: { ...current.channels, [channel]: !current.channels[channel] } },
    });
  };

  const handleQuietHours = (
    event: string,
    current: { channels: Record<MessageChannel, boolean>; quiet_hours_exempt: boolean },
  ) => {
    updateEvent.mutate({
      event,
      payload: { ...current, quiet_hours_exempt: !current.quiet_hours_exempt },
    });
  };

  const handleTest = (event: string, channel: MessageChannel) => {
    if (!testRecipient) return;
    setTesting({ event, channel });
    testEvent.mutate(
      { event, channel, recipient: testRecipient },
      { onSettled: () => setTesting(null) },
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Events</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control which channels deliver each notification. Changes apply immediately.
        </p>
      </div>

      {/* Test recipient */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Test recipient (phone or email)
            </label>
            <input
              type="text"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="+9198XXXXXXXX or you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <p className="text-xs text-gray-500 sm:max-w-xs">
            Test sends use sample data and are delivered to this address only — customers are never
            contacted.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <SkeletonList items={6} />
      ) : entries.length === 0 ? (
        <Banner tone="danger" description="Failed to load notification events." />
      ) : (
        <div className="space-y-4">
          {entries.map(([event, definition]) => (
            <Card key={event}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-700">{event}</span>
                  <span className="text-sm font-normal text-gray-500">— {definition.label}</span>
                  {definition.category === 'marketing' && (
                    <Badge variant="purple" size="sm">
                      marketing
                    </Badge>
                  )}
                  {definition.locked && (
                    <Badge variant="info" size="sm">
                      <Lock className="mr-1 inline h-3 w-3" />
                      required for login
                    </Badge>
                  )}
                  {definition.is_customised && (
                    <Badge variant="warning" size="sm">
                      customised
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {CHANNELS.map(({ key, label, icon }) => {
                    const enabled = definition.channels[key];
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-sm text-gray-700">
                          {icon}
                          {label}
                        </span>
                        <button
                          type="button"
                          disabled={!!definition.locked || updateEvent.isPending}
                          onClick={() => handleToggle(event, definition, key)}
                          aria-label={`${enabled ? 'Disable' : 'Enable'} ${label} for ${event}`}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            enabled ? 'bg-success-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              enabled ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}

                  {/* Quiet hours exemption */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <span className="text-sm text-gray-700">Quiet hours exempt</span>
                    <button
                      type="button"
                      disabled={!!definition.locked || updateEvent.isPending}
                      onClick={() => handleQuietHours(event, definition)}
                      aria-label={`Toggle quiet hours exemption for ${event}`}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        definition.quiet_hours_exempt ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          definition.quiet_hours_exempt ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Per-channel test sends */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">Test:</span>
                  {CHANNELS.map(({ key, label }) => {
                    const disabled =
                      !definition.channels[key] || !testRecipient || testEvent.isPending;
                    return (
                      <Button
                        key={key}
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        loading={testing?.event === event && testing.channel === key}
                        leftIcon={<Send className="h-3 w-3" />}
                        onClick={() => handleTest(event, key)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationEvents;
