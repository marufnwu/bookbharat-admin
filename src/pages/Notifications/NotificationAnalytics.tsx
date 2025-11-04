import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { showToast } from '../../utils/toast';

interface AnalyticsData {
  delivery_trends: any;
  channel_performance: any;
  event_popularity: any;
  success_rates: any;
}

const NotificationAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('7days');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['notification-analytics', period],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
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

  const analytics = analyticsData?.analytics || {};
  const stats = statsData?.stats || {};

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const exportData = () => {
    const data = {
      period,
      date_range: analytics.date_range,
      analytics,
      stats,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-analytics-${period}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast.success('Analytics data exported successfully');
  };

  // Calculate key metrics
  const totalNotifications = stats.total || 0;
  const successRate = totalNotifications > 0 ? Math.round((stats.sent / totalNotifications) * 100) : 0;
  const failedRate = totalNotifications > 0 ? Math.round((stats.failed / totalNotifications) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into notification performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24hours">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(totalNotifications)}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">This period</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className={`text-3xl font-bold ${getSuccessRateColor(successRate)}`}>
                {successRate}%
              </p>
              <div className="flex items-center mt-2">
                {successRate >= 95 ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : successRate < 80 ? (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                ) : null}
                <span className="text-sm text-gray-500">
                  {successRate >= 95 ? 'Excellent' : successRate < 80 ? 'Needs attention' : 'Good'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Notifications</p>
              <p className="text-3xl font-bold text-red-600">{formatNumber(stats.failed || 0)}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">{failedRate}% of total</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{formatNumber(stats.pending || 0)}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">Awaiting delivery</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.success_rates?.map((channel: any) => {
                const Icon = getChannelIcon(channel.channel);
                return (
                  <div key={channel.channel} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        channel.success_rate >= 95 ? 'bg-green-100' :
                        channel.success_rate >= 80 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          channel.success_rate >= 95 ? 'text-green-600' :
                          channel.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {channel.channel === 'in_app' ? 'In-App' : channel.channel}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(channel.total)} notifications
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getSuccessRateColor(channel.success_rate)}`}>
                        {channel.success_rate}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {channel.successful} successful
                      </div>
                    </div>
                  </div>
                );
              }) || (
                <div className="text-center py-8 text-gray-500">
                  No channel performance data available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event Popularity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Events</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.event_popularity?.slice(0, 6).map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {event.event_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {formatNumber(event.count)} times
                      </span>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((event.count / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No event data available
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delivery Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Delivery Trends</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Successful</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Failed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(analytics.delivery_trends || {}).slice(0, 7).map(([date, statuses]: [string, any]) => (
              <div key={date} className="border-l-4 border-gray-200 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(date).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Object.values(statuses).reduce((sum: number, count: any) => sum + (count as number), 0)} total
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(statuses).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                      <span className="text-xs text-gray-600 capitalize">{status}:</span>
                      <span className="text-xs font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No delivery trend data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Channel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel Distribution</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.by_channel || {}).map(([channel, count]: [string, any]) => {
                const Icon = getChannelIcon(channel);
                const total = Object.values(stats.by_channel || {}).reduce((sum: number, val: any) => sum + (val as number), 0);
                const percentage = total > 0 ? Math.round(((count as number) / total) * 100) : 0;

                return (
                  <div key={channel} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {channel === 'in_app' ? 'In-App' : channel}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {percentage}%
                      </span>
                      <span className="text-sm font-medium text-gray-900 w-16 text-right">
                        {formatNumber(count)}
                      </span>
                    </div>
                  </div>
                );
              }) || (
                <div className="text-center py-8 text-gray-500">
                  No channel distribution data available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Type Distribution</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.by_event_type || {}).slice(0, 8).map(([eventType, count]: [string, any]) => {
                const total = Object.values(stats.by_event_type || {}).reduce((sum: number, val: any) => sum + (val as number), 0);
                const percentage = total > 0 ? Math.round(((count as number) / total) * 100) : 0;

                return (
                  <div key={eventType} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right">
                        {percentage}%
                      </span>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {formatNumber(count)}
                      </span>
                    </div>
                  </div>
                );
              }) || (
                <div className="text-center py-8 text-gray-500">
                  No event type distribution data available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationAnalytics;