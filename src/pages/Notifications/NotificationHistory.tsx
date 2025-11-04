import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Download,
  Calendar,
  RefreshCw,
  Search,
  Trash2,
  ChevronDown,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../utils/toast';

interface NotificationLog {
  id: number;
  user_id?: number;
  user?: { id: number; name: string; email: string };
  event_type: string;
  channel: string;
  recipient: string;
  status: string;
  message_content?: string;
  error_message?: string;
  retry_count: number;
  sent_at?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

const NotificationHistory: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    channel: '',
    status: '',
    event_type: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(20);

  // Fetch notification logs
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['notification-logs', filters, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value)),
      });
      const response = await fetch(`/api/notifications/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notification logs');
      return response.json();
    },
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return response.json();
    },
  });

  // Cleanup logs mutation
  const cleanupMutation = useMutation({
    mutationFn: (days: number) => fetch('/api/notifications/cleanup', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    }).then(res => res.json()),
    onSuccess: (data) => {
      showToast.success(data.message || 'Cleanup completed');
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Cleanup failed');
    },
  });

  // Export logs mutation
  const exportMutation = useMutation({
    mutationFn: (format: string) => {
      const params = new URLSearchParams({
        format,
        date_from: filters.date_from,
        date_to: filters.date_to,
        channel: filters.channel,
        status: filters.status,
      });
      return fetch(`/api/notifications/export?${params}`)
        .then(res => res.json());
    },
    onSuccess: (data) => {
      showToast.success(data.message || 'Export completed');
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || 'Export failed');
    },
  });

  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination || {};
  const stats = statsData?.stats || {};

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return Smartphone;
      case 'whatsapp': return MessageSquare;
      case 'push': return Bell;
      case 'in_app': return Bell;
      default: return Bell;
    }
  };

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would be implemented here
    refetch();
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
  };

  const getStatusPercentage = (sent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification History</h1>
          <p className="text-gray-600 mt-1">View and manage all notification deliveries</p>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_sent?.toLocaleString() || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-green-600">
                  {getStatusPercentage(stats.total_sent || 0, stats.total_logs || 0)}%
                </p>
                {getStatusPercentage(stats.total_sent || 0, stats.total_logs || 0) >= 95 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
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
              <p className="text-2xl font-bold text-red-600">{stats.total_failed?.toLocaleString() || 0}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.total_pending?.toLocaleString() || 0}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => handleFilterChange('channel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="push">Push</option>
              <option value="in_app">In-App</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by recipient, event type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <button
              onClick={() => {
                setFilters({
                  channel: '',
                  status: '',
                  event_type: '',
                  user_id: '',
                  date_from: '',
                  date_to: '',
                });
                setSearchTerm('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {logs.length} of {pagination.total || 0} notifications
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden">
              <button
                onClick={() => exportMutation.mutate('csv')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => exportMutation.mutate('xlsx')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as Excel
              </button>
              <button
                onClick={() => exportMutation.mutate('json')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete logs older than 30 days?')) {
                cleanupMutation.mutate(30);
              }
            }}
            className="px-3 py-2 text-red-600 hover:text-red-800 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Cleanup Old Logs
          </button>
        </div>
      </div>

      {/* Notification Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retries
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No notification logs found matching your criteria
                  </td>
                </tr>
              ) : (
                logs.map((log: NotificationLog) => {
                  const StatusIcon = getStatusIcon(log.status);
                  const ChannelIcon = getChannelIcon(log.channel);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {log.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ChannelIcon className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900 capitalize">{log.channel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {log.event_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{log.recipient}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.user ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.user.name}</div>
                            <div className="text-sm text-gray-500">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.message_content || '-'}
                        </div>
                        {log.error_message && (
                          <div className="text-xs text-red-600 mt-1 truncate">
                            {log.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          log.retry_count > 0 ? 'text-yellow-600' : 'text-gray-900'
                        }`}>
                          {log.retry_count}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {pagination.current_page} of {pagination.total_pages} pages
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={!pagination.has_more && pagination.current_page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => {
                    // Handle pagination
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={!pagination.has_more}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => {
                    // Handle pagination
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;