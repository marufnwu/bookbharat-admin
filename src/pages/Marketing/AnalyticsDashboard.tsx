import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  DollarSign,
  Target,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

// API service
import { adminApi } from '../../services/adminApi';

// TypeScript interfaces
interface MarketingAnalytics {
  visitors: number;
  page_views: number;
  conversions: number;
  revenue: number;
  conversion_rate: number;
  aov: number;
  top_sources: TrafficSource[];
  campaign_performance: CampaignPerformance[];
}

// Default empty analytics data
const defaultAnalytics: MarketingAnalytics = {
  visitors: 0,
  page_views: 0,
  conversions: 0,
  revenue: 0,
  conversion_rate: 0,
  aov: 0,
  top_sources: [],
  campaign_performance: [],
};

interface TrafficSource {
  source: string;
  visitors: number;
  conversions: number;
}

interface CampaignPerformance {
  name: string;
  revenue: number;
  roi: number;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Fetch marketing analytics
  const { data: analyticsData, isLoading, error, refetch } = useQuery<MarketingAnalytics>({
    queryKey: ['marketing-analytics', selectedPeriod],
    queryFn: async () => {
      const response = await adminApi.getMarketingAnalytics({ period: selectedPeriod });
      return response.data;
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const analytics = analyticsData || defaultAnalytics;

  const metrics: MetricCard[] = [
    {
      title: 'Visitors',
      value: formatNumber(analytics.visitors),
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Page Views',
      value: formatNumber(analytics.page_views),
      icon: <Eye className="h-5 w-5" />,
      color: 'bg-green-500',
    },
    {
      title: 'Conversions',
      value: formatNumber(analytics.conversions),
      icon: <Target className="h-5 w-5" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Revenue',
      value: formatCurrency(analytics.revenue),
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-yellow-500',
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversion_rate}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-pink-500',
    },
    {
      title: 'Avg. Order Value',
      value: formatCurrency(analytics.aov),
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-indigo-500',
    },
  ];

  // Prepare data for traffic sources chart
  const trafficSourcesData = analytics.top_sources.map((source: TrafficSource) => ({
    name: source.source,
    visitors: source.visitors,
    conversions: source.conversions,
  }));

  // Prepare data for campaign performance chart
  const campaignData = analytics.campaign_performance.map((campaign: CampaignPerformance) => ({
    name: campaign.name,
    revenue: campaign.revenue,
    roi: campaign.roi,
  }));

  // Colors for pie chart
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('revenue') || entry.name.includes('Revenue')
                ? formatCurrency(entry.value)
                : entry.name.includes('Rate') || entry.name.includes('ROI')
                ? `${entry.value}%`
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Marketing Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and analyze marketing performance
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Failed to load analytics</h3>
              <p className="mt-1 text-sm text-red-600">
                There was an error loading the marketing analytics data. Please try again.
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Marketing Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and analyze marketing performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={isLoading}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          metrics.map((metric, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${metric.color} rounded-md p-2`}>
                  <div className="text-white">{metric.icon}</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {metric.title}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {metric.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Traffic Sources</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
            </div>
          ) : trafficSourcesData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSourcesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props;
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="visitors"
                  >
                    {trafficSourcesData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No traffic data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Traffic source data will appear here once available.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Performance Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
            </div>
          ) : campaignData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No campaign data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Campaign performance data will appear here once available.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Traffic Sources Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Traffic Sources</h3>
          </div>
          <div className="overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trafficSourcesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trafficSourcesData.map((source: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {source.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(source.visitors)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatNumber(source.conversions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No traffic source data available for the selected period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Performance Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          </div>
          <div className="overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : campaignData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ROI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaignData.map((campaign: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {campaign.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(campaign.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className={campaign.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {campaign.roi >= 0 ? '+' : ''}{campaign.roi}%
                            </span>
                            {campaign.roi >= 0 ? (
                              <ArrowUpRight className="ml-1 h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="ml-1 h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No campaign performance data available for the selected period.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;