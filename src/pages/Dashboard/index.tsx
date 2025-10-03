import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi } from '../../api';
import { LoadingSpinner, Badge } from '../../components';
import { format } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
          {change !== undefined && (
            <div className="ml-2">
              <div className={`flex items-center text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change)}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => dashboardApi.getRevenueData('30d'),
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: () => dashboardApi.getTopProducts(5),
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: () => dashboardApi.getRecentOrders(5),
  });

  // Extract stats from the response
  const stats = statsResponse?.dashboard?.stats;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const orderStatusColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.total_revenue?.value || 0)}
          change={stats?.total_revenue?.change || 0}
          icon={CurrencyDollarIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(stats?.total_orders?.value || 0)}
          change={8.2}
          icon={ShoppingCartIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Total Products"
          value={formatNumber(stats?.total_products?.value || 0)}
          icon={ShoppingBagIcon}
          color="bg-yellow-500"
        />
        <StatCard
          title="Total Customers"
          value={formatNumber(stats?.total_customers?.value || 0)}
          change={15.1}
          icon={UsersIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
          {revenueLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Trend (Last 30 Days)</h3>
          {revenueLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [value, 'Orders']}
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                />
                <Bar dataKey="orders" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
          {productsLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts?.data?.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{product.name || product.title}</p>
                      <p className="text-xs text-gray-500">{product.sales_count || product.total_sold || 0} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.revenue || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
          {ordersLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders?.data?.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Badge
                        variant={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'cancelled' ? 'error' :
                          order.status === 'shipped' ? 'info' : 'warning'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">#{order.order_number || order.id}</p>
                      <p className="text-xs text-gray-500">
                        {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_amount || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.user?.name || order.customer?.name || 'Guest'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-lg inline-block">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">Pending Orders</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.total_orders?.pending || 0}</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-lg inline-block">
              <ShoppingBagIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.total_products?.low_stock || 0}</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-lg inline-block">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">Today's Revenue</p>
            <p className="text-2xl font-bold text-green-600">₹0</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-lg inline-block">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">New Customers</p>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;