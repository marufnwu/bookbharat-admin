import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Users,
  Mail,
  Smartphone,
  Monitor,
  Target,
  Gift,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  TrendingDown,
  Download,
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import { calculateDiscount, formatDiscount } from '../../utils/discountCalculator';
import {
  RECOVERY_RATE_THRESHOLDS,
  COLORS,
  DISCOUNT_DEFAULTS,
  PAGINATION,
} from '../../constants/abandonedCarts';
import EnhancedAbandonedCartsTable from './EnhancedAbandonedCartsTable';
import ErrorDisplay from './ErrorDisplay';

interface Cart {
  id: number;
  user?: {
    email: string;
    name?: string;
  };
  session_id: string;
  cart_data: any;
  total: number;
  total_items: number;
  currency: string;
  is_abandoned: boolean;
  status: string;
  customer_segment: string;
  device_type?: string;
  source?: string;
  recovery_probability: number;
  abandoned_at?: string;
  recovery_email_count: number;
  last_recovery_email_sent?: string;
}

interface RecoveryStats {
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
  today_recovered: number;
  week_expired: number;
  by_segment: Record<string, any>;
  by_device: Record<string, any>;
  by_status: Record<string, any>;
  value_ranges: Record<string, any>;
  by_probability: Record<string, any>;
  by_urgency: Record<string, any>;
}

const RecoveryDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'dashboard' | 'carts'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
      const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    customer_segment: '',
    device_type: '',
    status: '',
    min_probability: '',
    max_probability: '',
    min_value: '',
    max_value: '',
    date_from: '',
    date_to: '',
  });
  const [selectedCarts, setSelectedCarts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch recovery statistics
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['abandoned-carts-recovery-stats'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/statistics');
      return response.data.data;
    },
  });

  // Fetch carts with advanced filtering
  const { data: cartsData, isLoading: cartsLoading, error: cartsError, refetch: refetchCarts } = useQuery({
    queryKey: ['abandoned-carts', currentPage, filters],
    queryFn: async () => {
      const params: any = { page: currentPage, per_page: PAGINATION.DEFAULT_ITEMS_PER_PAGE };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params[key] = value;
      });
      const response = await api.get('/abandoned-carts', { params });
      return response.data;
    },
  });

  const stats: RecoveryStats = statsData || {
    total_abandoned: 0,
    total_recovered: 0,
    recovery_rate: 0,
    abandoned_value: 0,
    recovered_value: 0,
    value_recovery_rate: 0,
    emails_sent: 0,
    average_recovery_time: { hours: 0, formatted: 'N/A' },
    today_recovered: 0,
    week_expired: 0,
    by_segment: {},
    by_device: {},
    by_status: {},
    value_ranges: {},
    by_probability: {},
    by_urgency: {},
  };
  const carts: Cart[] = cartsData?.data || [];
  const pagination = cartsData?.pagination || {};

  // Bulk operations
  const bulkSendEmailsMutation = useMutation({
    mutationFn: async (data: { cart_ids: number[]; email_type?: string }) => {
      const response = await api.post('/abandoned-carts/bulk-send-emails', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchCarts();
      setSelectedCarts([]);
      setSelectAll(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send bulk emails');
    },
  });

  const bulkGenerateDiscountsMutation = useMutation({
    mutationFn: async (data: { cart_ids: number[]; discount_percentage?: number }) => {
      const promises = data.cart_ids.map(cartId => {
        // Get cart data to calculate individual discount
        const cart = cartsData?.data?.find((c: any) => c.id === cartId);

        // Calculate optimal discount for each cart
        const discount = calculateDiscount({
          cartValue: cart?.total || 0,
          customerSegment: cart?.customer_segment || 'regular',
          isVip: cart?.customer_segment === 'vip',
          urgency: cart?.urgency_level || 'medium',
          defaultPercentage: data.discount_percentage,
        });

        return api.post(`/abandoned-carts/${cartId}/generate-discount`, {
          discount_type: discount.type,
          discount_value: discount.value,
          valid_days: DISCOUNT_DEFAULTS.VALID_DAYS,
        });
      });
      const results = await Promise.all(promises);
      return { success: true, data: results.map(r => r.data) };
    },
    onSuccess: () => {
      toast.success('Bulk discounts generated successfully');
      refetchCarts();
      setSelectedCarts([]);
      setSelectAll(false);
    },
    onError: () => {
      toast.error('Failed to generate bulk discounts');
    },
  });

  const refreshAllData = () => {
    refetchCarts();
    queryClient.invalidateQueries({ queryKey: ['abandoned-carts-recovery-stats'] });
  };

  const handleViewDetails = (cart: Cart) => {
    // Modal functionality removed - user will implement themselves
    console.log('View cart details:', cart.id);
  };

  const handleRowSelect = (cartId: number, selected: boolean) => {
    setSelectedCarts(prev =>
      selected
        ? [...prev, cartId]
        : prev.filter(id => id !== cartId)
    );
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCarts([]);
    } else {
      setSelectedCarts(carts.map((cart: Cart) => cart.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkSendEmails = () => {
    if (selectedCarts.length === 0) {
      toast.error('Please select carts to send emails to');
      return;
    }

    bulkSendEmailsMutation.mutate({
      cart_ids: selectedCarts,
      email_type: 'first_reminder',
    });
  };

  const handleBulkGenerateDiscounts = () => {
    if (selectedCarts.length === 0) {
      toast.error('Please select carts to generate discounts for');
      return;
    }

    bulkGenerateDiscountsMutation.mutate({
      cart_ids: selectedCarts,
      discount_percentage: DISCOUNT_DEFAULTS.MAX_PERCENTAGE,
    });
  };

  const exportCarts = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') params.append(key, value);
    });
    params.append('export', 'csv');
    window.open(`/api/v1/abandoned-carts?${params.toString()}`, '_blank');
  };

  
  // Format stats for display
  const formatRecoveryRate = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '0%';
    return value ? `${value.toFixed(1)}%` : '0%';
  };

  const formatValue = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '₹0';
    return `₹${value.toLocaleString()}`;
  };

  const formatTime = (timeInfo: { hours: number; formatted: string } | undefined | null) => {
    if (!timeInfo) return 'N/A';
    if (typeof timeInfo === 'object' && timeInfo.formatted) return timeInfo.formatted;
    if (typeof timeInfo === 'object' && timeInfo.hours && !isNaN(timeInfo.hours)) return `${timeInfo.hours}h`;
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cart Recovery Center
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Advanced abandoned cart recovery management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAllData}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportCarts}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(statsError || cartsError) && (
        <div className="space-y-4">
          {statsError && (
            <ErrorDisplay
              error={statsError}
              title="Statistics Loading Error"
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['abandoned-carts-recovery-stats'] })}
            />
          )}
          {cartsError && (
            <ErrorDisplay
              error={cartsError}
              title="Cart Data Loading Error"
              onRetry={() => refetchCarts()}
            />
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart },
          { id: 'carts', label: 'Abandoned Carts', icon: ShoppingCart, count: pagination.total },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`px-4 py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeView === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <>
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Recovery Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatRecoveryRate(stats.recovery_rate)}
                    </p>
                    <div className="flex items-center mt-2">
                      {stats.recovery_rate > RECOVERY_RATE_THRESHOLDS.GOOD ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs text-gray-500 ml-1">
                        {stats.recovery_rate > RECOVERY_RATE_THRESHOLDS.NEEDS_ATTENTION ? 'Good' : 'Needs attention'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Target className="h-8 w-8 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Abandoned</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.total_abandoned}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Recovered</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.total_recovered}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Revenue Lost</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatValue(stats.abandoned_value - stats.recovered_value)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Opportunity value
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-8 w-8 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recovery Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recovery Performance
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={[
                  { name: 'Abandoned', value: 65, amt: 2400 },
                  { name: 'Recovered', value: 25, amt: 1398 },
                  { name: 'Lost', value: 40, amt: 1002 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="value" fill="#3b82f6" name="Count" />
                  <Line yAxisId="right" type="monotone" dataKey="amt" stroke="#10b981" name="Value (₹)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Segments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Segments
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'VIP', value: stats.by_segment?.vip?.count || 0 },
                      { name: 'High Value', value: stats.by_segment?.high_value?.count || 0 },
                      { name: 'Repeat', value: stats.by_segment?.repeat?.count || 0 },
                      { name: 'Regular', value: stats.by_segment?.regular?.count || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                      const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                      const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > Number(cx) ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs font-medium"
                        >
                          {`${(Number(percent) * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.values(COLORS).slice(0, 4).map((color: string, index: number) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Device Types */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Analysis
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.by_device || {}).map(([device, data]: any) => (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device === 'mobile' && <Smartphone className="h-4 w-4 text-gray-600" />}
                      {device === 'desktop' && <Monitor className="h-4 w-4 text-gray-600" />}
                      {device === 'tablet' && <Monitor className="h-4 w-4 text-gray-600" />}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {device || 'unknown'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{data.count} carts</span>
                      <span className="text-xs text-gray-500">
                        (₹{(data.value || 0).toLocaleString()})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgency Levels */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Urgency Distribution
              </h3>
              <div className="space-y-3">
                {stats.by_urgency && Object.entries(stats.by_urgency).map(([urgency, data]: any) => (
                  <div key={urgency} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        urgency === 'critical' ? 'bg-red-500' :
                        urgency === 'high' ? 'bg-orange-500' :
                        urgency === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {urgency}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{data.count} carts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-gray-600 text-sm">Today's Recoveries</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.today_recovered || 0}
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-gray-600 text-sm">Value Recovery Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatRecoveryRate(stats.value_recovery_rate)}
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-gray-600 text-sm">Week's Expired</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.week_expired || 0}
                </p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <p className="text-gray-600 text-sm">Avg Recovery Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatTime(stats.average_recovery_time)}
                </p>
              </div>
              <div className="border-l-4 border-pink-500 pl-4">
                <p className="text-600 text-sm">Total Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.emails_sent}
                </p>
              </div>
              <div className="border-l-4 border-indigo-500 pl-4">
                <p className="text-gray-600 text-sm">Potential Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatValue(stats.abandoned_value)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Carts View */}
      {activeView === 'carts' && (
        <>
          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by email, session, or products..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-80"
                  />
                </div>
                <button
                  onClick={() => {
                    // Apply search filter
                    setFilters(prev => ({ ...prev, search: searchTerm }));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedCarts.length > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-4 py-2">
                    <span className="text-sm text-blue-800 font-medium">
                      {selectedCarts.length} carts selected
                    </span>
                    <button
                      onClick={handleBulkSendEmails}
                      disabled={bulkSendEmailsMutation.isPending}
                      className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      {bulkSendEmailsMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Send Emails
                    </button>
                    <button
                      onClick={handleBulkGenerateDiscounts}
                      disabled={bulkGenerateDiscountsMutation.isPending}
                      className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      {bulkGenerateDiscountsMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Gift className="h-4 w-4" />
                      )}
                      Generate Discounts
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCarts([]);
                        setSelectAll(false);
                      }}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <select
                value={filters.customer_segment}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, customer_segment: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Segments</option>
                <option value="vip">VIP</option>
                <option value="high_value">High Value</option>
                <option value="repeat">Repeat</option>
                <option value="regular">Regular</option>
              </select>

              <select
                value={filters.device_type}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, device_type: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Devices</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="abandoned">Abandoned</option>
                <option value="recovered">Recovered</option>
                <option value="expired">Expired</option>
              </select>

              <input
                type="number"
                placeholder="Min Probability %"
                value={filters.min_probability}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, min_probability: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
                max="100"
              />

              <input
                type="number"
                placeholder="Max Probability %"
                value={filters.max_probability}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, max_probability: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
                max="100"
              />

              <input
                type="number"
                placeholder="Min Value"
                value={filters.min_value}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, min_value: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
              />

              <input
                type="number"
                placeholder="Max Value"
                value={filters.max_value}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, max_value: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0"
              />

              <input
                type="date"
                placeholder="From Date"
                value={filters.date_from}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, date_from: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />

              <input
                type="date"
                placeholder="To Date"
                value={filters.date_to}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, date_to: e.target.value }));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Carts Table */}
          <EnhancedAbandonedCartsTable
            carts={carts}
            onRefresh={refetchCarts}
            onRowSelect={handleRowSelect}
            selectedCarts={selectedCarts}
            onSelectAll={handleSelectAll}
            selectAll={selectAll}
          />

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                  disabled={currentPage === pagination.last_page}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pagination.per_page) + 1} to{' '}
                    {Math.min(currentPage * pagination.per_page, pagination.total)} of {pagination.total} results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(PAGINATION.VISIBLE_PAGES, pagination.last_page) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {pagination.last_page > PAGINATION.VISIBLE_PAGES && (
                      <>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <button
                          onClick={() => setCurrentPage(pagination.last_page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pagination.last_page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pagination.last_page}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                      disabled={currentPage === pagination.last_page}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {carts.length === 0 && !cartsLoading && (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No abandoned carts found</p>
              <p className="text-sm">
                Try adjusting your filters or search criteria
              </p>
            </div>
          )}

          {/* Loading */}
          {cartsLoading && (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </>
      )}

      </div>
  );
};

export default RecoveryDashboard;