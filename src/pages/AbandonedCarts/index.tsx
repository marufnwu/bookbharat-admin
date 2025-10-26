import React, { useState } from 'react';
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
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

const AbandonedCarts: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCart, setSelectedCart] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch abandoned carts
  const { data: cartsData, isLoading } = useQuery({
    queryKey: ['abandoned-carts', currentPage, searchTerm],
    queryFn: async () => {
      const params: any = { page: currentPage, per_page: 15 };
      if (searchTerm) params.search = searchTerm;
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

  // Send recovery email mutation
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (cartId: number) => {
      const response = await api.delete(`/abandoned-carts/${cartId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Abandoned cart deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete cart');
    },
  });

  const handleViewDetails = (cart: any) => {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Abandoned Carts</h1>
        <p className="mt-1 text-sm text-gray-600">Manage and recover abandoned shopping carts</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">No Recovery Email</p>
                <p className="text-2xl font-bold text-gray-900">{stats.by_recovery_count?.none || 0}</p>
              </div>
              <Mail className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or session ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Carts List */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abandoned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recovery Emails
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {carts.map((cart: any) => (
                    <tr key={cart.id} className="hover:bg-gray-50">
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
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSendEmail(cart.id)}
                            className="text-green-600 hover:text-green-900"
                            disabled={sendEmailMutation.isPending}
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cart.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteMutation.isPending}
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
                <p>No abandoned carts found</p>
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
                      {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
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
                      ))}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCart.user?.email || 'Guest'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedCart.session_id}</p>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Email Sent</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedCart.last_recovery_email_sent
                        ? new Date(selectedCart.last_recovery_email_sent).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recovery Token</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {selectedCart.recovery_token || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cart Items</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedCart.cart_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSendEmail(selectedCart.id);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  disabled={sendEmailMutation.isPending}
                >
                  <Mail className="h-4 w-4" />
                  Send Recovery Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbandonedCarts;
