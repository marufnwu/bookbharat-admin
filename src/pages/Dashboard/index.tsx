import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
  ArrowRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi } from '../../api';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton, PageSkeleton } from '../../components';
import { format } from 'date-fns';

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
    return <PageSkeleton type="dashboard" />;
  }

  const orderStatusColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            Download Report
          </Button>
          <Link to="/products/create">
            <Button variant="primary" size="sm">
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.total_revenue?.value || 0)}
          change={stats?.total_revenue?.change}
          icon={CurrencyDollarIcon}
          color="bg-primary-500"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(stats?.total_orders?.value || 0)}
          change={stats?.total_orders?.change}
          icon={ShoppingCartIcon}
          color="bg-success-500"
        />
        <StatCard
          title="Total Products"
          value={formatNumber(stats?.total_products?.value || 0)}
          icon={ShoppingBagIcon}
          color="bg-warning-500"
        />
        <StatCard
          title="Total Customers"
          value={formatNumber(stats?.total_customers?.value || 0)}
          change={stats?.total_customers?.change}
          icon={UsersIcon}
          color="bg-info-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {revenueLoading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton variant="rect" height="100%" width="100%" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.order_status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.order_status_distribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={orderStatusColors[index % orderStatusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {stats?.order_status_distribution?.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: orderStatusColors[index % orderStatusColors.length] }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Products</CardTitle>
              <Link to="/products" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton variant="rect" width={48} height={48} className="rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {topProducts?.data?.map((product: any) => (
                  <div key={product.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{product.sales} sold</p>
                      <p className="text-sm text-gray-500">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton variant="rect" width={40} height={40} className="rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" width="50%" />
                      <Skeleton variant="text" width="30%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders?.data?.map((order: any) => (
                  <div key={order.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">#{order.order_number}</p>
                        <Badge
                          variant={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'processing' ? 'primary' :
                            order.status === 'pending' ? 'warning' :
                            order.status === 'cancelled' ? 'error' : 'default'
                          }
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {order.customer_name} • {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</p>
                    </div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Stat Card Component
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
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium flex items-center ${
                  isPositive ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
};

export default Dashboard;