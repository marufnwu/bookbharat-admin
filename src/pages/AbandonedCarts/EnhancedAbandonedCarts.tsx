import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Trash2,
  Eye,
  Search,
  Filter,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  RefreshCw,
  X,
  BarChart3,
  FileText,
  MessageSquare,
  Zap,
  CheckSquare,
  Square,
  Download,
  ChevronDown,
  Tag,
  Monitor,
  Smartphone,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import AnalyticsDashboard from './AnalyticsDashboard';
import ValidationLogs from './ValidationLogs';
import SmsRecoveryManager from './SmsRecoveryManager';
import ABTestingManager from './ABTestingManager';

interface FilterOptions {
  customer_segments: Array<{ value: string; label: string }>;
  device_types: Array<{ value: string; label: string }>;
  sources: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  recovery_email_counts: Array<{ value: number; label: string }>;
  value_ranges: Array<{ value: string; label: string }>;
  sort_options: Array<{ value: string; label: string }>;
}

interface AbandonedCart {
  id: number;
  session_id: string;
  user_id?: number;
  user?: {
    email: string;
    name?: string;
  };
  cart_data: any;
  total_amount: number;
  items_count: number;
  currency: string;
  is_abandoned: boolean;
  abandoned_at?: string;
  recovery_email_count: number;
  last_recovery_email_sent?: string;
  status: string;
  recovery_probability: number;
  customer_segment: string;
  device_type?: string;
  source?: string;
}

const AbandonedCarts: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'carts' | 'analytics' | 'validation' | 'sms' | 'abtesting'>('carts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarts, setSelectedCarts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Advanced filters state
  const [filters, setFilters] = useState({
    search: '',
    date_from: '',
    date_to: '',
    min_value: '',
    max_value: '',
    customer_segment: '',
    device_type: '',
    source: '',
    min_probability: '',
    max_probability: '',
    status: '',
    min_items: '',
    max_items: '',
    recovery_emails: '',
    sort_by: 'abandoned_at',
    sort_order: 'desc',
  });

  // Fetch filter options
  const { data: filterOptionsData } = useQuery({
    queryKey: ['abandoned-carts-filter-options'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/filter-options');
      return response.data.data as FilterOptions;
    },
  });

  // Build query params from filters
  const buildQueryParams = () => {
    const params: any = { page: currentPage, per_page: 15 };

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') {
        params[key] = value;
      }
    });

    return params;
  };

  // Fetch abandoned carts
  const { data: cartsData, isLoading } = useQuery({
    queryKey: ['abandoned-carts', currentPage, filters],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await api.get('/abandoned-carts', { params });
      return response.data;
    },
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['abandoned-carts-statistics'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/statistics');
      return response.data;
    },
  });

  const stats = statsData?.data || {};
  const carts = cartsData?.data || [];
  const pagination = cartsData?.pagination || {};
  const filterOptions = filterOptionsData || {} as FilterOptions;

  // Mutations
  const sendEmailMutation = useMutation({
    mutationFn: async (cartId: number) => {
      const response = await api.post(`/abandoned-carts/${cartId}/send-recovery-email`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Recovery email sent successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send recovery email');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cartId: number) => {
      const response = await api.delete(`/abandoned-carts/${cartId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Abandoned cart deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setSelectedCarts([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete cart');
    },
  });

  const bulkSendEmailsMutation = useMutation({
    mutationFn: async (data: { cart_ids: number[]; email_type?: string }) => {
      const response = await api.post('/abandoned-carts/bulk-send-emails', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setSelectedCarts([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send bulk emails');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (cartIds: number[]) => {
      const response = await api.post('/abandoned-carts/bulk-delete', { cart_ids: cartIds });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setSelectedCarts([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to bulk delete carts');
    },
  });

  const markAsRecoveredMutation = useMutation({
    mutationFn: async ({ cartId, notes, recoveryMethod }: { cartId: number; notes?: string; recoveryMethod?: string }) => {
      const response = await api.post(`/abandoned-carts/${cartId}/mark-as-recovered`, { notes, recovery_method: recoveryMethod });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cart marked as recovered successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      setShowDetailsModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark cart as recovered');
    },
  });

  // Event handlers
  const handleViewDetails = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setShowDetailsModal(true);
  };

  const handleSendEmail = (cartId: number) => {
    if (window.confirm('Send recovery email to this customer?')) {
      sendEmailMutation.mutate(cartId);
    }
  };

  const handleDelete = (cartId: number) => {
    if (window.confirm('Are you sure you want to delete this abandoned cart?')) {
      deleteMutation.mutate(cartId);
    }
  };

  const handleSelectCart = (cartId: number) => {
    setSelectedCarts(prev =>
      prev.includes(cartId)
        ? prev.filter(id => id !== cartId)
        : [...prev, cartId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCarts([]);
    } else {
      setSelectedCarts(carts.map((cart: AbandonedCart) => cart.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkSendEmails = () => {
    if (selectedCarts.length === 0) {
      toast.error('Please select carts to send emails to');
      return;
    }

    if (window.confirm(`Send recovery emails to ${selectedCarts.length} selected carts?`)) {
      bulkSendEmailsMutation.mutate({ cart_ids: selectedCarts });
    }
  };

  const handleBulkDelete = () => {
    if (selectedCarts.length === 0) {
      toast.error('Please select carts to delete');
      return;
    }

    if (window.confirm(`Delete ${selectedCarts.length} selected abandoned carts?`)) {
      bulkDeleteMutation.mutate(selectedCarts);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      date_from: '',
      date_to: '',
      min_value: '',
      max_value: '',
      customer_segment: '',
      device_type: '',
      source: '',
      min_probability: '',
      max_probability: '',
      status: '',
      min_items: '',
      max_items: '',
      recovery_emails: '',
      sort_by: 'abandoned_at',
      sort_order: 'desc',
    });
    setCurrentPage(1);
  };

  const exportCarts = () => {
    const params = buildQueryParams();
    params.export = 'csv';
    const queryString = new URLSearchParams(params).toString();
    window.open(`/api/v1/abandoned-carts?${queryString}`, '_blank');
  };

  // Get device icon
  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Monitor className="h-4 w-4" />;
      default: return null;
    }
  };

  // Get segment color
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip': return 'text-purple-600 bg-purple-100';
      case 'high_value': return 'text-blue-600 bg-blue-100';
      case 'repeat': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Abandoned Carts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and recover abandoned shopping carts ({pagination.total || 0} total)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters && <X className="h-4 w-4" />}
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'carts', label: 'Carts', icon: ShoppingCart },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'validation', label: 'Validation Logs', icon: FileText },
          { id: 'sms', label: 'SMS Recovery', icon: MessageSquare },
          { id: 'abtesting', label: 'AB Testing', icon: Zap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Carts Tab */}
      {activeTab === 'carts' && (
        <>
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Abandoned</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_abandoned || 0}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.total_value || 0}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 7 Days</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_abandoned || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recovered Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recovered_today || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">VIP Segments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.by_segment?.vip || 0}</p>
                  </div>
                  <Tag className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expired This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.expired_this_week || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Email, session, product..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Value Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                  <input
                    type="number"
                    value={filters.min_value}
                    onChange={(e) => handleFilterChange('min_value', e.target.value)}
                    placeholder="₹0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                  <input
                    type="number"
                    value={filters.max_value}
                    onChange={(e) => handleFilterChange('max_value', e.target.value)}
                    placeholder="₹10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Customer Segment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Segment</label>
                  <select
                    value={filters.customer_segment}
                    onChange={(e) => handleFilterChange('customer_segment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Segments</option>
                    {filterOptions.customer_segments?.map(segment => (
                      <option key={segment.value} value={segment.value}>
                        {segment.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Device Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                  <select
                    value={filters.device_type}
                    onChange={(e) => handleFilterChange('device_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Devices</option>
                    {filterOptions.device_types?.map(device => (
                      <option key={device.value} value={device.value}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.statuses?.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recovery Probability Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Probability %</label>
                  <input
                    type="number"
                    value={filters.min_probability}
                    onChange={(e) => handleFilterChange('min_probability', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Probability %</label>
                  <input
                    type="number"
                    value={filters.max_probability}
                    onChange={(e) => handleFilterChange('max_probability', e.target.value)}
                    placeholder="100"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Items Count Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Items</label>
                  <input
                    type="number"
                    value={filters.min_items}
                    onChange={(e) => handleFilterChange('min_items', e.target.value)}
                    placeholder="1"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Items</label>
                  <input
                    type="number"
                    value={filters.max_items}
                    onChange={(e) => handleFilterChange('max_items', e.target.value)}
                    placeholder="20"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Recovery Email Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Emails</label>
                  <select
                    value={filters.recovery_emails}
                    onChange={(e) => handleFilterChange('recovery_emails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    {filterOptions.recovery_email_counts?.map(count => (
                      <option key={count.value} value={count.value}>
                        {count.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {filterOptions.sort_options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <select
                    value={filters.sort_order}
                    onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedCarts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    {selectedCarts.length} carts selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkSendEmails}
                    disabled={bulkSendEmailsMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send Emails
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedCarts([])}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Carts Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {selectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            Select
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Segment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Probability
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Abandoned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emails
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {carts.map((cart: AbandonedCart) => (
                        <tr key={cart.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleSelectCart(cart.id)}
                              className="flex items-center"
                            >
                              {selectedCarts.includes(cart.id) ?
                                <CheckSquare className="h-4 w-4 text-blue-600" /> :
                                <Square className="h-4 w-4 text-gray-400" />
                              }
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {cart.user?.email || 'Guest'}
                                </div>
                                <div className="text-sm text-gray-500">{cart.session_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{cart.items_count} items</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">₹{cart.total_amount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(cart.customer_segment)}`}>
                              {cart.customer_segment?.replace('_', ' ') || 'unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(cart.device_type)}
                              <span className="text-sm text-gray-900">
                                {cart.device_type || 'unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    cart.recovery_probability >= 70 ? 'bg-green-500' :
                                    cart.recovery_probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${cart.recovery_probability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {cart.recovery_probability}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.abandoned_at ? new Date(cart.abandoned_at).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{cart.recovery_email_count || 0}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewDetails(cart)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSendEmail(cart.id)}
                                className="text-green-600 hover:text-green-900"
                                disabled={sendEmailMutation.isPending}
                                title="Send Recovery Email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cart.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={deleteMutation.isPending}
                                title="Delete Cart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {carts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No abandoned carts found matching your criteria</p>
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                          Showing <span className="font-medium">{((currentPage - 1) * pagination.per_page) + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * pagination.per_page, pagination.total)}
                          </span>{' '}
                          of <span className="font-medium">{pagination.total}</span> results
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
                          {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
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
                          {pagination.last_page > 5 && (
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
              </>
            )}
          </div>

          {/* Details Modal */}
          {showDetailsModal && selectedCart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Abandoned Cart Details</h2>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cart Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Cart Information</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Customer</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedCart.user?.email || 'Guest'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Session ID</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono text-xs">{selectedCart.session_id}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                            <p className="mt-1 text-sm text-gray-900 font-semibold">₹{selectedCart.total_amount}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Items Count</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedCart.items_count}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(selectedCart.customer_segment)}`}>
                              {selectedCart.status}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Segment</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(selectedCart.customer_segment)}`}>
                              {selectedCart.customer_segment?.replace('_', ' ') || 'unknown'}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Recovery Probability</label>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    selectedCart.recovery_probability >= 70 ? 'bg-green-500' :
                                    selectedCart.recovery_probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${selectedCart.recovery_probability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {selectedCart.recovery_probability}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Device Type</label>
                            <div className="flex items-center gap-2 mt-1">
                              {getDeviceIcon(selectedCart.device_type)}
                              <span className="text-sm text-gray-900">
                                {selectedCart.device_type || 'unknown'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Abandoned At</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedCart.abandoned_at
                              ? new Date(selectedCart.abandoned_at).toLocaleString()
                              : '-'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Recovery Emails Sent</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedCart.recovery_email_count || 0}</p>
                        </div>

                        {selectedCart.last_recovery_email_sent && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Email Sent</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {new Date(selectedCart.last_recovery_email_sent).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cart Items */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Cart Items</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedCart.cart_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        markAsRecoveredMutation.mutate({
                          cartId: selectedCart.id,
                          notes: 'Manually marked as recovered by admin',
                          recoveryMethod: 'manual'
                        });
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                      disabled={markAsRecoveredMutation.isPending}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Mark as Recovered
                    </button>
                    <button
                      onClick={() => handleSendEmail(selectedCart.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      disabled={sendEmailMutation.isPending}
                    >
                      <Mail className="h-4 w-4" />
                      Send Recovery Email
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Other Tabs */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'validation' && <ValidationLogs />}
      {activeTab === 'sms' && <SmsRecoveryManager />}
      {activeTab === 'abtesting' && <ABTestingManager />}
    </div>
  );
};

export default AbandonedCarts;