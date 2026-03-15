import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { Button, Card, CardContent, Badge, Modal, PageSkeleton } from '../../components';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface TransactionDetailModalProps {
  transaction: any;
  onClose: () => void;
}

const TransactionDetailModal = ({ transaction, onClose }: TransactionDetailModalProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['transaction-detail', transaction.id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/admin/payment-transactions/${transaction.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentStatusVariant = (status: string): 'success' | 'error' | 'warning' => {
    if (status === 'paid' || status === 'success') return 'success';
    if (status === 'failed') return 'error';
    return 'warning';
  };

  return (
    <Modal open={true} onClose={onClose} title="Transaction Details">
      {isLoading ? (
        <PageSkeleton />
      ) : data ? (
        <div className="space-y-6">
          {/* Order Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-semibold">{data.order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-semibold">{data.order.payment_transaction_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold uppercase">{data.order.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <Badge variant={getPaymentStatusVariant(data.order.payment_status)}>
                      {data.order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{data.order.user?.name || 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{data.order.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{data.order.user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Amount Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount Breakdown</h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(data.order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">{formatCurrency(data.order.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold">{formatCurrency(data.order.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary-600">{formatCurrency(data.order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          {data.order.items && data.order.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.order.items.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm">{item.product?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{item.product?.sku || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm">{formatCurrency(item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gateway Response */}
          {data.gateway_response && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gateway Response</h3>
              <Card>
                <CardContent className="p-4">
                  <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded-lg">
                    {JSON.stringify(data.gateway_response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeline */}
          {data.timeline && data.timeline.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Timeline</h3>
              <div className="space-y-4">
                {data.timeline.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        event.status === 'success' ? 'bg-green-500' :
                        event.status === 'failed' ? 'bg-red-500' :
                        'bg-primary-500'
                      }`} />
                      {index < data.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold text-gray-900">{event.event}</p>
                      <p className="text-sm text-gray-600">{event.details}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default function TransactionLog() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    gateway: '',
    status: '',
    min_amount: '',
    max_amount: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payment-transactions', page, perPage, filters],
    queryFn: async () => {
      const params: any = { page, per_page: perPage };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await axios.get(`${API_URL}/admin/payment-transactions`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    }
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${API_URL}/admin/payment-transactions/export?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    const variants: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      paid: 'success',
      success: 'success',
      completed: 'success',
      failed: 'error',
      cancelled: 'error',
      pending: 'warning',
      processing: 'info'
    };
    return variants[status] || 'default';
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Payment Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage all payment transactions</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 w-full sm:min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number or transaction ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-initial"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="flex-1 sm:flex-initial"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                className="flex-1 sm:flex-initial"
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
                <select
                  value={filters.gateway}
                  onChange={(e) => setFilters({ ...filters, gateway: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Gateways</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="payu">PayU</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="cashfree">Cashfree</option>
                  <option value="cod">COD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  value={filters.min_amount}
                  onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  value={filters.max_amount}
                  onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gateway
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data && data.data && data.data.length > 0 ? (
                  data.data.map((transaction: any) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.payment_transaction_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.user?.name || 'Guest'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                        {transaction.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(transaction.payment_status)}>
                          {transaction.payment_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(transaction.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No transactions found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Transactions will appear here once orders are placed
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.data && data.data.length > 0 && data.pagination && (
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{data.pagination.from}</span> to{' '}
                <span className="font-medium">{data.pagination.to}</span> of{' '}
                <span className="font-medium">{data.pagination.total}</span> results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="px-4 py-1 text-sm font-medium">
                  Page {page} of {data.pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.last_page}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Empty State */}
      <Card className="md:hidden">
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No transactions found</p>
          <p className="text-gray-400 text-sm mt-1">
            Transactions will appear here once orders are placed
          </p>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
