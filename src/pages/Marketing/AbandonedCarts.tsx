import React, { useState, useEffect } from 'react';
import { ShoppingCart, Send, CheckCircle, TrendingUp, DollarSign, Package, Calendar, Search, Filter } from 'lucide-react';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';

interface AbandonedCart {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  total: number;
  items: Array<{
    id: number;
    product: {
      title: string;
      image?: string;
    };
    quantity: number;
    unit_price: number;
  }>;
  abandoned_at: string;
  recovery_sent_at?: string;
  recovered_at?: string;
}

interface Statistics {
  total_abandoned: number;
  total_value: number;
  recovered_count: number;
  recovered_value: number;
  recovery_rate: number;
  recent_abandoned: number;
  recovery_sent: number;
  pending_recovery: number;
}

const AbandonedCarts: React.FC = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [showRecovered, setShowRecovered] = useState<string>('false');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCarts();
    loadStats();
  }, [currentPage, search, dateFrom, dateTo, minValue, maxValue, showRecovered]);

  const loadCarts = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, per_page: 20 };
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (minValue) params.min_value = minValue;
      if (maxValue) params.max_value = maxValue;
      if (showRecovered) params.recovered = showRecovered;

      const response = await api.get('/abandoned-carts', { params });
      setCarts(response.data.data);
      setTotalPages(response.data.pagination.last_page);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to load carts:', error);
      toast.error('Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/abandoned-carts/statistics');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const sendRecovery = async (cartId: number, channel: 'email' | 'sms' | 'whatsapp') => {
    setSending(cartId);
    try {
      await api.post(`/abandoned-carts/${cartId}/send-recovery`, { channel });
      toast.success(`Recovery message sent via ${channel}`);
      loadCarts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send recovery message');
    } finally {
      setSending(null);
    }
  };

  const markRecovered = async (cartId: number) => {
    try {
      await api.post(`/abandoned-carts/${cartId}/mark-recovered`);
      toast.success('Cart marked as recovered');
      loadCarts();
      loadStats();
    } catch (error) {
      toast.error('Failed to mark as recovered');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setMinValue('');
    setMaxValue('');
    setShowRecovered('false');
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Abandoned Carts</h1>
        <p className="text-gray-600 mt-1">Manage and recover abandoned customer carts</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Abandoned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_abandoned}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">₹{stats.total_value.toLocaleString()} total value</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recovered</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.recovered_count}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">₹{stats.recovered_value.toLocaleString()} recovered</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recovery Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.recovery_rate}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{stats.recovery_sent} messages sent</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent (7 days)</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.recent_abandoned}</p>
              </div>
              <Calendar className="h-10 w-10 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{stats.pending_recovery} pending recovery</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={showRecovered}
              onChange={(e) => setShowRecovered(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="false">Not Recovered</option>
              <option value="true">Recovered</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
            <input
              type="number"
              placeholder="₹"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
            <input
              type="number"
              placeholder="₹"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Carts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Abandoned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : carts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No abandoned carts found</p>
                  </td>
                </tr>
              ) : (
                carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cart.user.name}</div>
                        <div className="text-sm text-gray-500">{cart.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{cart.items.length} items</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">₹{cart.total.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cart.abandoned_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cart.recovered_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Recovered
                        </span>
                      ) : cart.recovery_sent_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Recovery Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {!cart.recovered_at && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => sendRecovery(cart.id, 'email')}
                            disabled={sending === cart.id}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            title="Send Email"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => markRecovered(cart.id)}
                            className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                            title="Mark as Recovered"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 20, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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

export default AbandonedCarts;
