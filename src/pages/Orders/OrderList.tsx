import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  Square3Stack3DIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { ordersApi } from '../../api';
import { Table, Button, Badge, LoadingSpinner, Card, CardContent, StatusBadge, Modal } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Order, FilterOptions, TableColumn } from '../../types';
import { format } from 'date-fns';

// Order Stats Widget Component
interface OrderStatsWidgetProps {
  stats: {
    total_orders: number;
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    average_order_value: number;
  } | undefined;
  isLoading: boolean;
}

const OrderStatsWidget: React.FC<OrderStatsWidgetProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Orders', 
      value: stats?.total_orders || 0, 
      icon: Square3Stack3DIcon, 
      color: 'text-blue-600 bg-blue-50' 
    },
    { 
      label: 'Pending', 
      value: stats?.pending_orders || 0, 
      icon: ClockIcon, 
      color: 'text-yellow-600 bg-yellow-50' 
    },
    { 
      label: 'Processing', 
      value: stats?.processing_orders || 0, 
      icon: ArrowPathIcon, 
      color: 'text-indigo-600 bg-indigo-50' 
    },
    { 
      label: 'Shipped', 
      value: stats?.shipped_orders || 0, 
      icon: TruckIcon, 
      color: 'text-purple-600 bg-purple-50' 
    },
    { 
      label: 'Delivered', 
      value: stats?.delivered_orders || 0, 
      icon: CheckCircleIcon, 
      color: 'text-green-600 bg-green-50' 
    },
    { 
      label: 'Cancelled', 
      value: stats?.cancelled_orders || 0, 
      icon: XCircleIcon, 
      color: 'text-red-600 bg-red-50' 
    },
    { 
      label: 'Revenue', 
      value: `₹${((stats?.total_revenue || 0) / 1000).toFixed(1)}K`, 
      icon: CurrencyDollarIcon, 
      color: 'text-emerald-600 bg-emerald-50' 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <div key={stat.label} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Bulk Action Toolbar Component
interface BulkActionToolbarProps {
  selectedCount: number;
  onStatusUpdate: (status: string) => void;
  onExport: () => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onStatusUpdate,
  onExport,
  onClearSelection,
  isLoading,
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
      <span className="text-sm">
        <ClipboardDocumentCheckIcon className="h-5 w-5 inline mr-2" />
        {selectedCount} order{selectedCount > 1 ? 's' : ''} selected
      </span>
      
      <div className="relative">
        <button
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium flex items-center gap-1"
        >
          Update Status
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showStatusDropdown && (
          <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-900 rounded-lg shadow-lg border min-w-[160px]">
            {[
              { status: 'processing', label: 'Processing', icon: ArrowPathIcon },
              { status: 'shipped', label: 'Shipped', icon: TruckIcon },
              { status: 'delivered', label: 'Delivered', icon: CheckCircleIcon },
              { status: 'cancelled', label: 'Cancelled', icon: XCircleIcon },
            ].map((item) => (
              <button
                key={item.status}
                onClick={() => {
                  onStatusUpdate(item.status);
                  setShowStatusDropdown(false);
                }}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
              >
                <item.icon className="h-4 w-4 text-gray-500" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onExport}
        disabled={isLoading}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium"
      >
        Export Selected
      </button>

      <button
        onClick={onClearSelection}
        className="px-2 py-1 hover:bg-gray-800 rounded-md"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

// Payment Status Update Modal
interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  currentStatus: string;
  onUpdate: (id: number, status: string) => void;
  isLoading: boolean;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  isOpen,
  onClose,
  orderId,
  currentStatus,
  onUpdate,
  isLoading,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  React.useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  if (!isOpen || !orderId) return null;

  const paymentStatuses = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
    { value: 'refunded', label: 'Refunded', color: 'gray' },
    { value: 'partially_refunded', label: 'Partially Refunded', color: 'orange' },
  ];

  return (
    <Modal open={isOpen} onClose={onClose} title="Update Payment Status" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Current status: <span className="font-medium capitalize">{currentStatus}</span>
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Payment Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {paymentStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onUpdate(orderId, selectedStatus)}
            loading={isLoading}
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Main OrderList Component
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
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [paymentStatusModal, setPaymentStatusModal] = useState<{
    isOpen: boolean;
    orderId: number | null;
    currentStatus: string;
  }>({ isOpen: false, orderId: null, currentStatus: '' });
  
  // Status update modal state
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    orderId: number | null;
    currentStatus: string;
    selectedStatus: string;
    note: string;
    overrideWorkflow: boolean;
  }>({
    isOpen: false,
    orderId: null,
    currentStatus: '',
    selectedStatus: '',
    note: '',
    overrideWorkflow: false
  });

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getOrders(filters),
  });

  // Extract stats from response
  const stats = (ordersResponse as any)?.stats;

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
      setPaymentStatusModal({ isOpen: false, orderId: null, currentStatus: '' });
    },
    onError: (error: any) => {
      showError('Failed to update payment status', error.response?.data?.message);
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: number[]; status: string }) =>
      ordersApi.bulkUpdateStatus(orderIds, status),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrders(new Set());
      showSuccess(data.message || 'Orders updated successfully');
    },
    onError: (error: any) => {
      showError('Failed to update orders', error.response?.data?.message);
    },
  });

  const exportOrdersMutation = useMutation({
    mutationFn: ordersApi.exportOrders,
    onSuccess: (blob) => {
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

  // Handlers
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
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

  // Bulk selection handlers
  const handleSelectOrder = (orderId: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    const orders = (ordersResponse as any)?.orders?.data || [];
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o: Order) => o.id)));
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    bulkUpdateStatusMutation.mutate({
      orderIds: Array.from(selectedOrders),
      status,
    });
  };

  const handleBulkExport = () => {
    // Export selected orders (use existing export with filter by IDs)
    exportOrdersMutation.mutate({
      ...filters,
      ids: Array.from(selectedOrders).join(','),
    });
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

  const getPaymentStatusBadge = (status: string, onClick?: () => void) => {
    const badges = {
      pending: <Badge variant="warning" className="cursor-pointer hover:opacity-80">Pending</Badge>,
      paid: <Badge variant="success" className="cursor-pointer hover:opacity-80">Paid</Badge>,
      failed: <Badge variant="error" className="cursor-pointer hover:opacity-80">Failed</Badge>,
      refunded: <Badge variant="default" className="cursor-pointer hover:opacity-80">Refunded</Badge>,
      partially_refunded: <Badge variant="warning" className="cursor-pointer hover:opacity-80">Partial Refund</Badge>,
    };
    
    const badge = badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
    
    if (onClick) {
      return (
        <button onClick={onClick} className="focus:outline-none" title="Click to update">
          {badge}
        </button>
      );
    }
    return badge;
  };

  // All available order statuses
  const orderStatuses = [
    { value: 'pending', label: 'Pending', icon: ClockIcon, color: 'yellow' },
    { value: 'processing', label: 'Processing', icon: ArrowPathIcon, color: 'indigo' },
    { value: 'shipped', label: 'Shipped', icon: TruckIcon, color: 'purple' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircleIcon, color: 'green' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircleIcon, color: 'red' },
    { value: 'refunded', label: 'Refunded', icon: CurrencyDollarIcon, color: 'gray' },
  ];

  const getStatusActions = (order: Order) => {
    const actions = [];

    // Quick action buttons based on current status
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

    // Create Shipment button for processing/shipped orders (if no shipment exists)
    if (order.status === 'processing' || order.status === 'shipped') {
      actions.push(
        <Link key="create-shipment" to={`/orders/${order.id}/create-shipment`}>
          <Button
            size="sm"
            variant="success"
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-1" />
            Create Shipment
          </Button>
        </Link>
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

    // Always add "Change Status" button for any-to-any status change
    actions.push(
      <Button
        key="change-status"
        size="sm"
        variant="ghost"
        onClick={() => setStatusModal({
          isOpen: true,
          orderId: order.id,
          currentStatus: order.status,
          selectedStatus: order.status,
          note: '',
          overrideWorkflow: false,
        })}
        title="Change to any status"
      >
        <ArrowPathIcon className="h-4 w-4" />
      </Button>
    );

    return actions;
  };

  // Handle status update with optional override
  const handleStatusUpdateWithOverride = () => {
    if (!statusModal.orderId || !statusModal.selectedStatus) return;
    
    // If overriding workflow or status is different, proceed
    if (statusModal.overrideWorkflow || statusModal.selectedStatus !== statusModal.currentStatus) {
      updateStatusMutation.mutate({
        id: statusModal.orderId,
        status: statusModal.selectedStatus
      });
      setStatusModal({
        isOpen: false,
        orderId: null,
        currentStatus: '',
        selectedStatus: '',
        note: '',
        overrideWorkflow: false
      });
    }
  };

  // Column definitions with checkbox
  const columns = useMemo(() => [
    {
      key: 'select' as const,
      title: (
        <input
          type="checkbox"
          checked={selectedOrders.size === ((ordersResponse as any)?.orders?.data?.length || 0) && selectedOrders.size > 0}
          onChange={handleSelectAll}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      render: (_: any, record: Order) => (
        <input
          type="checkbox"
          checked={selectedOrders.has(record.id)}
          onChange={() => handleSelectOrder(record.id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'order_number' as const,
      title: 'Order #',
      sortable: true,
      render: (value: any) => (
        <span className="font-medium text-blue-600">#{value}</span>
      ),
    },
    {
      key: 'user' as const,
      title: 'Customer',
      render: (_: any, record: Order) => (
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
      key: 'total_amount' as const,
      title: 'Total',
      sortable: true,
      render: (value: any) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status' as const,
      title: 'Status',
      sortable: true,
      render: (value: any) => getStatusBadge(value),
    },
    {
      key: 'payment_status' as const,
      title: 'Payment',
      sortable: true,
      render: (value: any, record: Order) => getPaymentStatusBadge(value, () =>
        setPaymentStatusModal({
          isOpen: true,
          orderId: record.id,
          currentStatus: value,
        })
      ),
    },
    {
      key: 'created_at' as const,
      title: 'Date',
      sortable: true,
      render: (value: any) => (
        <div>
          <div>{format(new Date(value), 'MMM dd, yyyy')}</div>
          <div className="text-sm text-gray-500">
            {format(new Date(value), 'HH:mm')}
          </div>
        </div>
      ),
    },
    {
      key: 'actions' as const,
      title: 'Actions',
      render: (_: any, record: Order) => (
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
  ], [selectedOrders, ordersResponse]);

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

      {/* Order Stats Widget */}
      <OrderStatsWidget stats={stats} isLoading={isLoading} />

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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
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
                  </div>
                  <StatusBadge status={order.status as any} size="sm" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium text-gray-900">
                      {order.user?.name || order.billing_address?.first_name ? `${order.billing_address.first_name} ${order.billing_address.last_name || ''}`.trim() : order.billing_address?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium text-gray-900">
                      {order.order_items_count || order.items_count || order.items?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium text-gray-900">₹{Number(order.total_amount || order.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment</span>
                    <button
                      onClick={() => setPaymentStatusModal({
                        isOpen: true,
                        orderId: order.id,
                        currentStatus: order.payment_status,
                      })}
                    >
                      <StatusBadge status={order.payment_status as any} size="sm" />
                    </button>
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
      </div>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedOrders.size}
        onStatusUpdate={handleBulkStatusUpdate}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedOrders(new Set())}
        isLoading={bulkUpdateStatusMutation.isPending}
      />

      {/* Payment Status Update Modal */}
      <PaymentStatusModal
        isOpen={paymentStatusModal.isOpen}
        onClose={() => setPaymentStatusModal({ isOpen: false, orderId: null, currentStatus: '' })}
        orderId={paymentStatusModal.orderId}
        currentStatus={paymentStatusModal.currentStatus}
        onUpdate={handlePaymentStatusUpdate}
        isLoading={updatePaymentStatusMutation.isPending}
      />

      {/* Order Status Update Modal - Any to Any with Override */}
      <Modal
        open={statusModal.isOpen}
        onClose={() => setStatusModal({
          isOpen: false,
          orderId: null,
          currentStatus: '',
          selectedStatus: '',
          note: '',
          overrideWorkflow: false
        })}
        title="Change Order Status"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Current status: <span className="font-semibold capitalize">{statusModal.currentStatus}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={statusModal.selectedStatus}
              onChange={(e) => setStatusModal(prev => ({ ...prev, selectedStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={statusModal.note}
              onChange={(e) => setStatusModal(prev => ({ ...prev, note: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add a note about this status change..."
            />
          </div>

          {/* Override Checkbox */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={statusModal.overrideWorkflow}
                onChange={(e) => setStatusModal(prev => ({ ...prev, overrideWorkflow: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
              />
              <div>
                <span className="text-sm font-medium text-yellow-800">
                  Override Workflow Rules
                </span>
                <p className="text-xs text-yellow-700 mt-1">
                  Enable this to skip normal workflow restrictions and force the status change.
                  Use with caution as this may bypass validation checks.
                </p>
              </div>
            </label>
          </div>

          {/* Warning for unusual transitions */}
          {statusModal.selectedStatus && statusModal.currentStatus &&
           statusModal.selectedStatus !== statusModal.currentStatus && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 text-orange-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Status Transition Warning
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Changing from <span className="font-semibold capitalize">{statusModal.currentStatus}</span> to{' '}
                    <span className="font-semibold capitalize">{statusModal.selectedStatus}</span> is not in the normal workflow.
                    {!statusModal.overrideWorkflow && ' Check "Override Workflow Rules" to proceed.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStatusModal({
                isOpen: false,
                orderId: null,
                currentStatus: '',
                selectedStatus: '',
                note: '',
                overrideWorkflow: false
              })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleStatusUpdateWithOverride}
              loading={updateStatusMutation.isPending}
              disabled={
                statusModal.selectedStatus === statusModal.currentStatus ||
                (!statusModal.overrideWorkflow &&
                 statusModal.selectedStatus !== '' &&
                 statusModal.currentStatus !== '' &&
                 !getValidTransitions(statusModal.currentStatus).includes(statusModal.selectedStatus))
              }
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Helper function for valid transitions (simplified)
const getValidTransitions = (currentStatus: string): string[] => {
  const transitions: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
    refunded: [],
  };
  return transitions[currentStatus] || [];
};

export default OrderList;