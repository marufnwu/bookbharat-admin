import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Smartphone,
  DollarSign,
  Loader,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import { PAGINATION } from '../../constants/abandonedCarts';

interface SmsRecord {
  id: number;
  persistent_cart_id: number;
  user_id: number;
  phone_number: string;
  message: string;
  discount_code: string | null;
  gateway: string;
  gateway_message_id: string | null;
  delivery_status: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered';
  attempts: number;
  max_attempts: number;
  clicked: boolean;
  clicked_at: string | null;
  recovered: boolean;
  recovered_at: string | null;
  cart_value: number;
  recovery_probability: number | null;
  customer_segment: string | null;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    name: string;
  };
  persistent_cart?: {
    id: number;
    total: number;
  };
}

interface SmsStats {
  total_sent: number;
  pending: number;
  delivered: number;
  failed: number;
  clicked: number;
  recovered: number;
  total_revenue: number;
  average_cart_value: number;
  delivery_rate: number;
  click_rate: number;
  conversion_rate: number;
  roi: number;
}

const SmsRecoveryManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [selectedSms, setSelectedSms] = useState<SmsRecord | null>(null);

  // Fetch SMS records
  const { data: smsData, isLoading } = useQuery({
    queryKey: ['sms-recovery', currentPage, searchTerm, filterStatus],
    queryFn: async () => {
      const params: any = { page: currentPage, per_page: PAGINATION.DEFAULT_ITEMS_PER_PAGE };
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.delivery_status = filterStatus;
      const response = await api.get('/abandoned-carts/sms', { params });
      return response.data;
    },
  });

  // Fetch SMS statistics
  const { data: statsData } = useQuery({
    queryKey: ['sms-stats'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/sms/stats');
      return response.data;
    },
  });

  // Fetch performance metrics
  const { data: performanceData } = useQuery({
    queryKey: ['sms-performance'],
    queryFn: async () => {
      const response = await api.get('/abandoned-carts/sms/performance');
      return response.data;
    },
  });

  const smsRecords: SmsRecord[] = smsData?.data || [];
  const pagination = smsData?.pagination || {};
  const stats: SmsStats = statsData?.data || {};
  const performance = performanceData?.data || {};

  // Retry failed SMS mutation
  const retryMutation = useMutation({
    mutationFn: async (smsId: number) => {
      const response = await api.put(`/abandoned-carts/sms/${smsId}/retry`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('SMS retry scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['sms-recovery'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to retry SMS');
    },
  });

  const handleRetry = (smsId: number) => {
    if (window.confirm('Retry sending this SMS?')) {
      retryMutation.mutate(smsId);
    }
  };

  const handleViewDetails = (sms: SmsRecord) => {
    setSelectedSms(sms);
    setShowDetails(sms.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'bounced':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_sent || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered || 0}</p>
                <p className="text-xs text-gray-500">{stats.delivery_rate || 0}% rate</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clicked</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clicked || 0}</p>
                <p className="text-xs text-gray-500">{stats.click_rate || 0}% rate</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recovered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recovered || 0}</p>
                <p className="text-xs text-gray-500">{stats.conversion_rate || 0}% rate</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performance && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Average Cart Value</p>
              <p className="text-xl font-bold text-gray-900">₹{performance.average_cart_value || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{performance.total_revenue || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-xl font-bold text-green-600">{performance.roi || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-xl font-bold text-red-600">{stats.failed || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 items-center">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </select>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by phone number..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />

          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SMS Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cart Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {smsRecords.map((sms) => (
                    <tr key={sms.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Smartphone className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{sms.phone_number}</div>
                            {sms.user && (
                              <div className="text-sm text-gray-500">{sms.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{sms.cart_value}</div>
                        {sms.discount_code && (
                          <div className="text-xs text-blue-600">Code: {sms.discount_code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sms.delivery_status)}`}>
                          {getStatusIcon(sms.delivery_status)}
                          {sms.delivery_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sms.gateway}</div>
                        {sms.gateway_message_id && (
                          <div className="text-xs text-gray-500">ID: {sms.gateway_message_id.substring(0, 8)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {sms.clicked && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                              <Eye className="h-3 w-3" />
                              Clicked
                            </span>
                          )}
                          {sms.recovered && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              Recovered
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {sms.sent_at ? new Date(sms.sent_at).toLocaleDateString() : '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sms.sent_at ? new Date(sms.sent_at).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(sms)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {sms.delivery_status === 'failed' && sms.attempts < sms.max_attempts && (
                            <button
                              onClick={() => handleRetry(sms.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                      <span className="font-medium">{Math.min(currentPage * pagination.per_page, pagination.total)}</span> of{' '}
                      <span className="font-medium">{pagination.total}</span> results
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
                      {(() => {
                        const pages = [];
                        const totalPages = pagination.last_page;
                        const current = currentPage;

                        // Show first page, current page ± 2, and last page with ellipsis
                        if (totalPages <= 7) {
                          // Show all pages if 7 or fewer
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Show ellipsis for large page counts
                          pages.push(1);

                          if (current > 3) {
                            pages.push('...');
                          }

                          for (let i = Math.max(2, current - 2); i <= Math.min(totalPages - 1, current + 2); i++) {
                            if (!pages.includes(i)) {
                              pages.push(i);
                            }
                          }

                          if (current < totalPages - 2) {
                            pages.push('...');
                          }

                          if (totalPages > 1) {
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((page, index) => (
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          ) : (
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
                          )
                        ));
                      })()}
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
      {showDetails && selectedSms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">SMS Details</h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSms.phone_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Status</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSms.delivery_status)}`}>
                        {getStatusIcon(selectedSms.delivery_status)}
                        {selectedSms.delivery_status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gateway</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSms.gateway}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cart Value</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold">₹{selectedSms.cart_value}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attempts</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSms.attempts} / {selectedSms.max_attempts}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recovery Status</label>
                    <p className="mt-1">
                      {selectedSms.recovered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Recovered
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">Not Recovered</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedSms.message}</p>
                  </div>
                </div>

                {selectedSms.discount_code && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discount Code</label>
                    <p className="mt-1 text-sm text-blue-600 font-mono">{selectedSms.discount_code}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sent At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedSms.sent_at ? new Date(selectedSms.sent_at).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Clicked At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedSms.clicked_at ? new Date(selectedSms.clicked_at).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recovered At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedSms.recovered_at ? new Date(selectedSms.recovered_at).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Failed At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedSms.failed_at ? new Date(selectedSms.failed_at).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>

                {selectedSms.failure_reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Failure Reason</label>
                    <p className="mt-1 text-sm text-red-600">{selectedSms.failure_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsRecoveryManager;


