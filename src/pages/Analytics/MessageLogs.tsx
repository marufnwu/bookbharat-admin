/**
 * Message Logs — audit trail of every message the system sent. Filterable
 * list, detail drawer with payload + provider response, resend for failed
 * rows. Backed by /settings/messaging/logs.
 */

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail as MailIcon, MessageSquare, Phone, RefreshCw } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmModal,
  Drawer,
  EmptyState,
  StatusBadge,
  Table,
} from '../../components';
import type { TableColumn } from '../../types';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { useMessageLogs, useRetryLog } from '../../api/messaging/hooks';
import { exportLogs } from '../../api/messaging/api';
import type { LogFilters, MessageChannel, MessageLog } from '../../api/messaging/types';

const CHANNELS: { value: string; label: string }[] = [
  { value: '', label: 'All channels' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
];

const STATUSES: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
];

const CHANNEL_ICONS: Record<MessageChannel, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-success-600" />,
  sms: <Phone className="h-4 w-4 text-primary-600" />,
  email: <MailIcon className="h-4 w-4 text-primary-600" />,
};

const DEFAULT_FILTERS: LogFilters = {
  channel: '',
  status: '',
  template_code: '',
  user_id: '',
  date_from: '',
  date_to: '',
};

const statusToBadge = (status: MessageLog['status']) =>
  status === 'queued'
    ? 'pending'
    : status === 'sent' || status === 'delivered'
      ? 'success'
      : status === 'failed'
        ? 'failed'
        : 'default';

export const MessageLogs: React.FC = () => {
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MessageLog | null>(null);
  const [confirmResend, setConfirmResend] = useState(false);
  const [exporting, setExporting] = useState(false);

  const perPage = 50;
  const { data, isLoading } = useMessageLogs(filters, page, perPage);
  const retryLog = useRetryLog();

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportLogs(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `message-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export failure is surfaced by the browser (no download); nothing else to do.
    } finally {
      setExporting(false);
    }
  };

  const columns: TableColumn<MessageLog>[] = useMemo(
    () => [
      {
        key: 'channel',
        title: 'Channel',
        render: (_: unknown, record: MessageLog) => (
          <span className="flex items-center gap-2">
            {CHANNEL_ICONS[record.channel as MessageChannel]}
            <span className="capitalize text-gray-700">{record.channel}</span>
          </span>
        ),
      },
      {
        key: 'template_code',
        title: 'Event',
        render: (_: unknown, record: MessageLog) => (
          <span className="font-mono text-xs text-gray-700">{record.template_code ?? '—'}</span>
        ),
      },
      {
        key: 'recipient',
        title: 'Recipient',
        render: (v: string) => <span className="text-gray-700">{v}</span>,
      },
      {
        key: 'status',
        title: 'Status',
        render: (_: unknown, record: MessageLog) => (
          <StatusBadge status={statusToBadge(record.status)}>{record.status}</StatusBadge>
        ),
      },
      {
        key: 'user',
        title: 'Customer',
        render: (_: unknown, record: MessageLog) =>
          record.user ? (
            <span className="text-gray-700">{record.user.name}</span>
          ) : (
            <span className="text-gray-400">Guest</span>
          ),
      },
      {
        key: 'created_at',
        title: 'Time',
        render: (v: string) => (
          <span className="text-gray-500">{format(new Date(v), 'MMM d, HH:mm:ss')}</span>
        ),
      },
      {
        key: 'actions',
        title: '',
        align: 'right',
        render: (_: unknown, record: MessageLog) =>
          record.status === 'failed' ? (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(record);
                setConfirmResend(true);
              }}
            >
              Resend
            </Button>
          ) : null,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every message sent to customers — WhatsApp, SMS, and email.
          </p>
        </div>
        <Button variant="outline" loading={exporting} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-2 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-500">Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => {
                setFilters({ ...filters, channel: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-500">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-500">Event</label>
            <input
              type="text"
              value={filters.template_code}
              placeholder="e.g. order_placed"
              onChange={(e) => {
                setFilters({ ...filters, template_code: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-500">Date range</label>
            <DateRangeFilter
              startDate={filters.date_from || ''}
              endDate={filters.date_to || ''}
              onStartChange={(v) => {
                setFilters({ ...filters, date_from: v });
                setPage(1);
              }}
              onEndChange={(v) => {
                setFilters({ ...filters, date_to: v });
                setPage(1);
              }}
              onClear={() => setFilters({ ...filters, date_from: '', date_to: '' })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      {rows.length === 0 && !isLoading ? (
        <Card>
          <EmptyState
            icon={<MailIcon className="h-10 w-10" />}
            title="No messages found"
            description="No messages match the selected filters."
          />
        </Card>
      ) : (
        <Card>
          <Table
            data={rows}
            columns={columns}
            loading={isLoading}
            onRowClick={(record) => setSelected(record)}
            pagination={{
              current: page,
              pageSize: perPage,
              total,
              onChange: setPage,
            }}
          />
        </Card>
      )}

      {/* Detail drawer */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={`Message #${selected?.id ?? ''}`}
        description={selected ? `${selected.channel} · ${selected.template_code ?? '—'}` : ''}
        width="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={statusToBadge(selected.status)}>{selected.status}</StatusBadge>
              <Badge variant="default" size="sm">
                {selected.attempts ?? 1} attempt{(selected.attempts ?? 1) > 1 ? 's' : ''}
              </Badge>
              {selected.provider && <Badge variant="info">{selected.provider}</Badge>}
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-gray-500">Recipient</dt>
                <dd className="text-right text-gray-900">{selected.recipient}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-gray-500">Customer</dt>
                <dd className="text-right text-gray-900">
                  {selected.user ? `${selected.user.name} (${selected.user.email})` : 'Guest'}
                </dd>
              </div>
              {selected.provider_message_id && (
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-gray-500">Provider message ID</dt>
                  <dd className="break-all text-right font-mono text-xs text-gray-900">
                    {selected.provider_message_id}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-gray-500">Sent at</dt>
                <dd className="text-gray-900">
                  {selected.sent_at ? format(new Date(selected.sent_at), 'MMM d, yyyy HH:mm:ss') : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-gray-500">Delivered at</dt>
                <dd className="text-gray-900">
                  {selected.delivered_at
                    ? format(new Date(selected.delivered_at), 'MMM d, yyyy HH:mm:ss')
                    : '—'}
                </dd>
              </div>
              {selected.subject_type && (
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-gray-500">Related to</dt>
                  <dd className="text-gray-900">
                    {selected.subject_type.replace('App\\Models\\', '')} #{selected.subject_id}
                  </dd>
                </div>
              )}
            </dl>

            {selected.error_message && (
              <div className="rounded-lg bg-error-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-error-600">Error</p>
                <p className="mt-1 text-sm text-error-700">{selected.error_message}</p>
              </div>
            )}

            {selected.payload && Object.keys(selected.payload).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                  Template data (payload)
                </p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
            )}

            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                  Provider response (metadata)
                </p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}

            {selected.status === 'failed' && (
              <Button
                variant="primary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => setConfirmResend(true)}
              >
                Resend message
              </Button>
            )}
          </div>
        )}
      </Drawer>

      {/* Resend confirmation */}
      <ConfirmModal
        open={confirmResend}
        onClose={() => setConfirmResend(false)}
        onConfirm={() => {
          if (selected) retryLog.mutate(selected.id);
          setConfirmResend(false);
        }}
        title="Resend message"
        message={`Resend the ${selected?.channel ?? ''} message for "${selected?.template_code ?? ''}" to ${selected?.recipient ?? ''}?`}
        confirmText="Resend"
        variant="warning"
        loading={retryLog.isPending}
      />
    </div>
  );
};

export default MessageLogs;
