import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ordersApi } from '../../api';
import { Table, Button, Badge, LoadingSpinner, Card, CardContent, StatusBadge } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Order, FilterOptions, TableColumn } from '../../types';
import { format } from 'date-fns';

const OrderList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    per_page: 10,
    search: '',
    status: '',
    payment_status: '',
    date_from: '',
    date_to: '',
    sort_by: 'created_at',
    sort_direction: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getOrders(filters),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showSuccess('Order status updated successfully');
    },
    onError: (error: any) => {
      showError('Failed to update order status', error.response?.data?.message);
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, payment_status }: { id: number; payment_status: string }) =>
      ordersApi.updatePaymentStatus(id, payment_status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showSuccess('Payment status updated successfully');
    },
    onError: (error: any) => {
      showError('Failed to update payment status', error.response?.data?.message);
    },
  });

  const exportOrdersMutation = useMutation({
    mutationFn: ordersApi.exportOrders,
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Orders exported successfully');
    },
    onError: (error: any) => {
      showError('Failed to export orders', error.response?.data?.message);
    },
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sort_by: key,
      sort_direction: direction,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handlePaymentStatusUpdate = (id: number, payment_status: string) => {
    updatePaymentStatusMutation.mutate({ id, payment_status });
  };

  const handleExport = () => {
    exportOrdersMutation.mutate(filters);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'processing':
        return <Badge variant="info">Processing</Badge>;
      case 'shipped':
        return <Badge variant="info">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      case 'refunded':
        return <Badge variant="error">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'refunded':
        return <Badge variant="error">Refunded</Badge>;
      case 'partially_refunded':
        return <Badge variant="warning">Partially Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusActions = (order: Order) => {
    const actions = [];

    if (order.status === 'pending') {
      actions.push(
        <Button
          key="approve"
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate(order.id, 'processing')}
        >
          <CheckIcon className="h-4 w-4 mr-1" />
          Process
        </Button>
      );
    }

    if (order.status === 'processing') {
      actions.push(
        <Button
          key="ship"
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate(order.id, 'shipped')}
        >
          Ship
        </Button>
      );
    }

    if (order.status === 'shipped') {
      actions.push(
        <Button
          key="deliver"
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate(order.id, 'delivered')}
        >
          Mark Delivered
        </Button>
      );
    }

    if (['pending', 'processing'].includes(order.status)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="danger"
          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      );
    }

    return actions;
  };

  const columns: TableColumn<Order>[] = [
    {
      key: 'order_number',
      title: 'Order #',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-blue-600">#{value}</span>
      ),
    },
    {
      key: 'user',
      title: 'Customer',
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">
            {record.user?.name || 'Guest'}
          </div>
          <div className="text-sm text-gray-500">
            {record.user?.email || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'total_amount',
      title: 'Total',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'payment_status',
      title: 'Payment',
      sortable: true,
      render: (value) => getPaymentStatusBadge(value),
    },
    {
      key: 'created_at',
      title: 'Date',
      sortable: true,
      render: (value) => (
        <div>
          <div>{format(new Date(value), 'MMM dd, yyyy')}</div>
          <div className="text-sm text-gray-500">
            {format(new Date(value), 'HH:mm')}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Link to={`/orders/${record.id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex space-x-1">
            {getStatusActions(record)}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track customer orders
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          loading={exportOrdersMutation.isPending}
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.payment_status}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per Page
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.per_page}
                onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow">
        <Table
          data={(ordersResponse as any)?.orders?.data || []}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: filters.page || 1,
            total: (ordersResponse as any)?.orders?.total || 0,
            pageSize: filters.per_page || 10,
            onChange: handlePageChange,
          }}
          onSort={handleSort}
        />
      </div>

      {/* Orders Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : ((ordersResponse as any)?.orders?.data || []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          ((ordersResponse as any)?.orders?.data || []).map((order: any) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      #{order.order_number}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.created_at ? format(new Date(order.created_at), 'MMM d, yyyy h:mm a') : '-'}
                    </p>
                  </div>
                  <StatusBadge status={order.status as any} size="sm" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium text-gray-900">
                      {order.customer?.name || order.billing_address?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium text-gray-900">
                      {order.items_count || order.items?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium text-gray-900">৳{Number(order.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <StatusBadge status={order.payment_status as any} size="sm" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Link
                    to={`/orders/${order.id}`}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Details
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Mobile Pagination */}
        {((ordersResponse as any)?.orders?.total || 0) > (filters.per_page || 10) && (
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page || 1) <= 1}
              onClick={() => handlePageChange((filters.page || 1) - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              Page {filters.page || 1} of {Math.ceil(((ordersResponse as any)?.orders?.total || 0) / (filters.per_page || 10))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page || 1) >= Math.ceil(((ordersResponse as any)?.orders?.total || 0) / (filters.per_page || 10))}
              onClick={() => handlePageChange((filters.page || 1) + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;