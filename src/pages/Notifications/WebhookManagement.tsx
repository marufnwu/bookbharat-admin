import React, { useState } from 'react';
import {
  Webhook,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Download,
  Trash2,
  ExternalLink,
  Settings,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../utils/toast';

interface WebhookLog {
  id: number;
  event_type: string;
  recipient: string;
  status: string;
  error_message?: string;
  retry_count: number;
  metadata?: {
    webhook_url?: string;
    webhook_name?: string;
    status_code?: number;
    response?: any;
    duration?: number;
    webhook_id?: number;
  };
  created_at: string;
  sent_at?: string;
}

interface WebhookStats {
  total_webhooks: number;
  successful: number;
  failed: number;
  success_rate: number;
  by_channel: Record<string, number>;
  by_event_type: Record<string, number>;
  common_errors: Record<string, number>;
  last_24h: number;
  last_7d: number;
}

const WebhookManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'analytics'>('overview');
  const [filters, setFilters] = useState({
    status: '',
    event_type: '',
    date_from: '',
    date_to: '',
  });
  const [testUrl, setTestUrl] = useState('');
  const [testSecret, setTestSecret] = useState('');

  // Fetch webhook stats
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['webhook-stats'],
    queryFn: async () => {
      const response = await fetch('/api/webhooks/stats');
      if (!response.ok) throw new Error('Failed to fetch webhook stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch webhook logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['webhook-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      );
      const response = await fetch(`/api/webhooks/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch webhook logs');
      return response.json();
    },
  });

  // Fetch webhook configuration
  const { data: configData } = useQuery({
    queryKey: ['webhook-config'],
    queryFn: async () => {
      const response = await fetch('/api/webhooks/configuration');
      if (!response.ok) throw new Error('Failed to fetch webhook configuration');
      return response.json();
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (data: { url: string; secret?: string }) => {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to test webhook');
      return response.json();
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'Webhook test completed');
      refetchLogs();
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Webhook test failed');
    },
  });

  // Retry failed webhooks mutation
  const retryFailedWebhooksMutation = useMutation({
    mutationFn: async (maxRetries: number = 3) => {
      const response = await fetch('/api/webhooks/retry-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_retries: maxRetries }),
      });
      if (!response.ok) throw new Error('Failed to retry webhooks');
      return response.json();
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'Webhooks retried successfully');
      refetchLogs();
      refetchStats();
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Retry failed');
    },
  });

  // Cleanup logs mutation
  const cleanupLogsMutation = useMutation({
    mutationFn: async (days: number) => {
      const response = await fetch('/api/webhooks/cleanup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      if (!response.ok) throw new Error('Failed to cleanup logs');
      return response.json();
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'Cleanup completed');
      refetchLogs();
      refetchStats();
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Cleanup failed');
    },
  });

  const stats = statsData?.stats || {} as WebhookStats;
  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination || {};
  const config = configData?.configuration || {};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return CheckCircle;
      case 'delivered': return CheckCircle;
      case 'failed': return XCircle;
      case 'pending': return Clock;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  const handleTestWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl) {
      showToast.error('Please enter a webhook URL');
      return;
    }

    try {
      new URL(testUrl); // Validate URL
    } catch {
      showToast.error('Please enter a valid webhook URL');
      return;
    }

    testWebhookMutation.mutate({ url: testUrl, secret: testSecret });
  };

  const handleRetryFailed = () => {
    if (window.confirm('Retry all failed webhook deliveries?')) {
      retryFailedWebhooksMutation.mutate(3);
    }
  };

  const handleCleanup = () => {
    const days = prompt('Enter number of days of logs to keep (1-365):', '30');
    if (days && !isNaN(Number(days))) {
      const numDays = Number(days);
      if (numDays >= 1 && numDays <= 365) {
        cleanupLogsMutation.mutate(numDays);
      } else {
        showToast.error('Please enter a number between 1 and 365');
      }
    }
  };

  const getErrorSeverity = (count: number) => {
    if (count >= 50) return 'text-red-600';
    if (count >= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage webhook deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Delivery Logs
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Webhooks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_webhooks?.toLocaleString() || 0}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Webhook className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.success_rate?.toFixed(1) || 0}%
                    </p>
                    {stats.success_rate >= 95 ? (
                      <BarChart3 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed?.toLocaleString() || 0}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last 24h</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.last_24h?.toLocaleString() || 0}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Test Webhook */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Webhook</h2>
            <form onSubmit={handleTestWebhook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={testSecret}
                    onChange={(e) => setTestSecret(e.target.value)}
                    placeholder="Webhook secret key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={testWebhookMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {testWebhookMutation.isPending ? 'Testing...' : 'Test Webhook'}
              </button>
            </form>
          </div>

          {/* Common Errors */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Errors</h2>
            <div className="space-y-3">
              {Object.entries(stats.common_errors || {}).map(([error, count]: [string, any]) => (
                <div key={error} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{error}</span>
                  </div>
                  <div className={`text-sm font-medium ${getErrorSeverity(count)}`}>
                    {count} times
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No errors recorded yet
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleRetryFailed}
                disabled={retryFailedWebhooksMutation.isPending}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {retryFailedWebhooksMutation.isPending ? 'Retrying...' : 'Retry Failed Webhooks'}
              </button>
              <button
                onClick={handleCleanup}
                disabled={cleanupLogsMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {cleanupLogsMutation.isPending ? 'Cleaning...' : 'Cleanup Old Logs'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <input
                  type="text"
                  value={filters.event_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, event_type: e.target.value }))}
                  placeholder="Filter by event type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setFilters({ status: '', event_type: '', date_from: '', date_to: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Webhook URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No webhook logs found matching your criteria
                    </td>
                  </tr>
                ) : (
                  logs.map((log: WebhookLog) => {
                    const StatusIcon = getStatusIcon(log.status);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {log.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {log.event_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900 truncate max-w-xs">
                              {log.recipient}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400 cursor-pointer" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            (log.metadata?.status_code ?? 0) >= 200 && (log.metadata?.status_code ?? 0) < 300
                              ? 'text-green-600'
                              : (log.metadata?.status_code ?? 0) >= 400
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {log.metadata?.status_code ?? '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {log.metadata?.duration ? `${log.metadata.duration}ms` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination would go here */}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border-gray-200">
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
            <p>Advanced webhook analytics will be available in the next update.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManagement;