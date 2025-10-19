import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Activity,
  CreditCard,
  AlertCircle,
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }: any) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="inline h-4 w-4 mr-1" />
              {trendValue}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};

export default function PaymentAnalytics() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [groupBy, setGroupBy] = useState('day');

  // Fetch payment analytics summary
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['payment-analytics-summary', dateRange],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/admin/payment-analytics/summary`, {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    }
  });

  // Fetch revenue trend
  const { data: revenueTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['payment-analytics-revenue-trend', dateRange, groupBy],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/admin/payment-analytics/revenue-trend`, {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          group_by: groupBy
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    }
  });

  // Fetch payment method distribution
  const { data: methodDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ['payment-analytics-method-distribution', dateRange],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/admin/payment-analytics/method-distribution`, {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    }
  });

  // Fetch gateway performance
  const { data: gatewayPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['payment-analytics-gateway-performance', dateRange],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/admin/payment-analytics/gateway-performance`, {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    }
  });

  // Fetch recent failed payments
  const { data: failedPayments, isLoading: failedLoading } = useQuery({
    queryKey: ['payment-analytics-failed'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/admin/payment-analytics/recent-failed`, {
        params: { limit: 10 },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    }
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Analytics</h1>
        <p className="mt-2 text-gray-600">Monitor payment performance and gateway metrics</p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <button
            onClick={() => refetchSummary()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(summary?.total_revenue || 0)}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Total Transactions"
          value={summary?.total_transactions || 0}
          icon={Activity}
          color="blue"
        />
        <KPICard
          title="Success Rate"
          value={`${summary?.success_rate || 0}%`}
          icon={TrendingUp}
          color="purple"
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(summary?.avg_order_value || 0)}
          icon={CreditCard}
          color="yellow"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Successful</p>
          <p className="text-2xl font-bold text-green-600">{summary?.successful_transactions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">{summary?.failed_transactions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">COD Orders</p>
          <p className="text-2xl font-bold text-blue-600">{summary?.cod_orders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Online Orders</p>
          <p className="text-2xl font-bold text-purple-600">{summary?.online_orders || 0}</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        {trendLoading ? (
          <div className="h-80 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="transaction_count" stroke="#10B981" strokeWidth={2} name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment Method Distribution & Gateway Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Payment Method Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method Distribution</h2>
          {distributionLoading ? (
            <div className="h-80 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={methodDistribution}
                    dataKey="count"
                    nameKey="payment_method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.payment_method}: ${entry.percentage}%`}
                  >
                    {methodDistribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {methodDistribution?.map((method: any, index: number) => (
                  <div key={method.payment_method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium uppercase">{method.payment_method}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-900 font-semibold">{formatCurrency(method.revenue)}</span>
                      <span className="text-gray-500 ml-2">({method.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gateway Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Gateway Performance</h2>
          {performanceLoading ? (
            <div className="h-80 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gatewayPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gateway" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="success_rate" fill="#10B981" name="Success Rate (%)" />
                <Bar dataKey="failure_rate" fill="#EF4444" name="Failure Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Failed Payments */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Recent Failed Payments</h2>
        </div>
        {failedLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : failedPayments && failedPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failedPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.user?.name || 'Guest'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                      {payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No failed payments in the selected period</p>
        )}
      </div>
    </div>
  );
}

