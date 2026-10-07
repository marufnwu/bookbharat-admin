/**
 * Messaging Dashboard — the single observability surface for the messaging
 * system: volume, success rates, failure reasons, channel health, queue
 * state, and configuration warnings. Backed by GET /settings/messaging/dashboard.
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, StatCard, Banner, Badge } from '../../components';
import { useMessagingDashboard } from '../../api/messaging/hooks';
import type { DashboardWarning, MessageChannel } from '../../api/messaging/types';

const CHANNEL_COLORS: Record<MessageChannel, string> = {
  whatsapp: '#25D366',
  sms: '#2563EB',
  email: '#8B5CF6',
};

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
};

const WARNING_TONES: Record<DashboardWarning['level'], 'info' | 'warning' | 'danger'> = {
  info: 'info',
  warning: 'warning',
  error: 'danger',
};

export const MessagingDashboard: React.FC = () => {
  const [days, setDays] = useState(7);
  const { data, isLoading, isError } = useMessagingDashboard(days);

  const chartData =
    data?.volume_by_day.map((day) => {
      const row: Record<string, string | number> = {
        date: day.date ? format(parseISO(day.date), 'MMM d') : '',
      };
      for (const c of day.channels) {
        row[c.channel] = c.total;
      }
      return row;
    }) ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messaging Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Delivery health across WhatsApp, SMS, and email notifications.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Configuration warnings */}
      {data?.warnings.map((warning, index) => (
        <Banner
          key={index}
          tone={WARNING_TONES[warning.level]}
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          description={warning.message}
        />
      ))}

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Messages"
          value={isLoading ? '—' : data?.summary.total ?? 0}
          icon={<InboxIcon className="h-6 w-6" />}
        />
        <StatCard
          title="Sent"
          value={isLoading ? '—' : data?.summary.sent ?? 0}
          icon={<MessageSquare className="h-6 w-6" />}
          iconBgColor="bg-primary-100 text-primary-600"
        />
        <StatCard
          title="Delivered"
          value={isLoading ? '—' : data?.summary.delivered ?? 0}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          iconBgColor="bg-success-100 text-success-600"
        />
        <StatCard
          title="Failed"
          value={isLoading ? '—' : data?.summary.failed ?? 0}
          icon={<XCircleIcon className="h-6 w-6" />}
          iconBgColor="bg-error-100 text-error-600"
        />
        <StatCard
          title="Queued / Pending Jobs"
          value={isLoading ? '—' : `${data?.summary.queued ?? 0} / ${data?.queue.pending_jobs ?? 0}`}
          icon={<InboxIcon className="h-6 w-6" />}
          iconBgColor="bg-warning-100 text-warning-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Volume chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Volume by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">No messages in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {(Object.keys(CHANNEL_COLORS) as MessageChannel[]).map((channel) => (
                    <Bar
                      key={channel}
                      dataKey={channel}
                      name={CHANNEL_LABELS[channel]}
                      stackId="volume"
                      fill={CHANNEL_COLORS[channel]}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Channel health */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isError && <p className="text-sm text-error-600">Failed to load channel health.</p>}
            {data &&
              (Object.keys(data.per_channel) as MessageChannel[]).map((channel) => {
                const health = data.per_channel[channel];
                return (
                  <div
                    key={channel}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CHANNEL_COLORS[channel] }}
                        />
                        {CHANNEL_LABELS[channel]}
                      </span>
                      {health.success_rate !== null ? (
                        <Badge
                          variant={
                            health.success_rate >= 95
                              ? 'success'
                              : health.success_rate >= 80
                                ? 'warning'
                                : 'error'
                          }
                        >
                          {health.success_rate}% success
                        </Badge>
                      ) : (
                        <Badge variant="default">no volume</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {health.successful} of {health.total} succeeded
                    </p>
                    {health.last_error && (
                      <p className="mt-1 line-clamp-2 text-xs text-error-600">
                        Last error: {health.last_error.message}
                      </p>
                    )}
                  </div>
                );
              })}
            {data && (
              <p className="text-xs text-gray-500">
                Failed queue jobs: <span className="font-medium">{data.queue.failed_jobs}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Failure reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Top Failure Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.failure_reasons.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No failures in this period. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {data.failure_reasons.map((reason, index) => (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-4 rounded-lg bg-gray-50 px-4 py-2.5"
                  >
                    <span className="text-sm text-gray-700">{reason.error_message ?? 'Unknown'}</span>
                    <span className="shrink-0 text-sm font-semibold text-error-600">{reason.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Per-event counts */}
        <Card>
          <CardHeader>
            <CardTitle>By Notification Event</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.by_event.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No messages in this period.</p>
            ) : (
              <ul className="space-y-2">
                {data.by_event.map((event, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-2.5"
                  >
                    <span className="font-mono text-sm text-gray-700">
                      {event.template_code ?? '—'}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-sm">
                      <span className="text-gray-500">{event.total} total</span>
                      {event.failed > 0 && (
                        <span className="font-semibold text-error-600">{event.failed} failed</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessagingDashboard;
