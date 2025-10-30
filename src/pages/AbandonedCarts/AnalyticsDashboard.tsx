import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Percent,
  Users,
  Mail,
  Smartphone,
  Monitor,
  Zap,
  Calendar,
} from 'lucide-react';
import { api } from '../../api/axios';

interface AnalyticsSummary {
  total_abandoned: number;
  total_recovered: number;
  total_expired: number;
  recovery_rate: number;
  abandoned_value: number;
  recovered_value: number;
  value_recovery_rate: number;
  emails_sent: number;
  average_recovery_time: {
    hours: number;
    formatted: string;
  };
}

interface Trends {
  [date: string]: {
    abandoned: number;
    recovered: number;
    value: number;
    recovery_rate: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Fetch analytics
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['abandoned-carts-analytics', dateRange],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/analytics', {
        params: {
          from: dateRange.from,
          to: dateRange.to,
        },
      });
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summary: AnalyticsSummary = analyticsData?.summary || {};
  const segments = analyticsData?.by_segment || {};
  const devices = analyticsData?.by_device || {};
  const emailPerf = analyticsData?.email_performance || {};
  const funnel = analyticsData?.conversion_funnel || {};
  const revenue = analyticsData?.revenue || {};
  const trends: Trends = analyticsData?.trends || {};

  // Format trend data for chart
  const trendData = Object.entries(trends).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    abandoned: data.abandoned,
    recovered: data.recovered,
    recovery_rate: data.recovery_rate,
  }));

  // Format segment data
  const segmentData = Object.entries(segments).map(([name, data]: any) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    recovered: data.recovered,
    abandoned: data.abandoned,
    recovery_rate: data.recovery_rate,
  }));

  // Format device data
  const deviceData = Object.entries(devices).map(([name, data]: any) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    recovered: data.recovered,
    abandoned: data.abandoned,
    recovery_rate: data.recovery_rate,
  }));

  // Format email performance data
  const emailData = [
    {
      name: 'No Email',
      value: emailPerf.no_email?.count || 0,
      percentage: emailPerf.no_email?.percentage || 0,
    },
    {
      name: '1 Email',
      value: emailPerf.one_email?.count || 0,
      percentage: emailPerf.one_email?.percentage || 0,
    },
    {
      name: '2 Emails',
      value: emailPerf.two_emails?.count || 0,
      percentage: emailPerf.two_emails?.percentage || 0,
    },
    {
      name: '3+ Emails',
      value: emailPerf.three_or_more?.count || 0,
      percentage: emailPerf.three_or_more?.percentage || 0,
    },
  ];

  // Format funnel data
  const funnelData = [
    { name: 'Abandoned', value: funnel.step_1_abandoned?.count || 0 },
    { name: '1st Email', value: funnel.step_2_first_email?.count || 0 },
    { name: '2nd Email', value: funnel.step_3_second_email?.count || 0 },
    { name: '3rd Email', value: funnel.step_4_third_email?.count || 0 },
    { name: 'Recovered', value: funnel.step_5_recovered?.count || 0 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recovery Analytics</h1>
          <p className="text-gray-600 mt-1">Abandoned cart recovery performance</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Recovery Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.recovery_rate}%
              </p>
            </div>
            <Percent className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Abandoned</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.total_abandoned}
              </p>
            </div>
            <ShoppingCart className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Recovered</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.total_recovered}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Net Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{revenue.net_revenue || 0}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recovery Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="abandoned" fill="#f59e0b" name="Abandoned" />
              <Line yAxisId="right" type="monotone" dataKey="recovery_rate" stroke="#10b981" name="Recovery %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Email Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={emailData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {emailData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Conversion Funnel
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Segment Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Segment Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={segmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="recovered" fill="#10b981" name="Recovered" />
              <Bar dataKey="abandoned" fill="#f59e0b" name="Abandoned" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Breakdown
          </h3>
          <div className="space-y-4">
            {deviceData.map((device) => (
              <div key={device.name} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{device.name}</span>
                  <span className="text-sm font-semibold text-blue-600">{device.recovery_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(device.recovery_rate, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Recovered: {device.recovered}</span>
                  <span>Abandoned: {device.abandoned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-gray-600 text-sm">Avg Recovery Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.average_recovery_time?.formatted || 'N/A'}
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-600 text-sm">Value Recovery Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.value_recovery_rate}%
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-gray-600 text-sm">ROI</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {revenue.roi}%
            </p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-gray-600 text-sm">Abandoned Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{summary.abandoned_value}
            </p>
          </div>
          <div className="border-l-4 border-pink-500 pl-4">
            <p className="text-gray-600 text-sm">Recovered Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{summary.recovered_value}
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-600 text-sm">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{revenue.average_order_value || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
