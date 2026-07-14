import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
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
  PaperAirplaneIcon as WhatsAppIcon,
} from '@heroicons/react/24/outline';
import { ordersApi } from '../../api';
import { Table, Button, Badge, LoadingSpinner, StatusBadge, Modal } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { Order, FilterOptions, TableColumn } from '../../types';
import { format } from 'date-fns';
import { OrderStatusTabs } from '../../components/Orders/OrderStatusTabs';
import { InlineStatusDropdown } from '../../components/Orders/InlineStatusDropdown';
import { OrderQuickView } from '../../components/Orders/OrderQuickView';
import { OrderSearchWithSuggestions } from '../../components/Orders/OrderSearchWithSuggestions';
import { KeyboardShortcutsHelp } from '../../components/Orders/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';

// WhatsApp notification types
type WhatsAppNotificationType = 'order_placed' | 'order_shipped' | 'order_delivered';

const WHATSAPP_NOTIFICATIONS: { type: WhatsAppNotificationType; label: string; description: string; icon: string }[] = [
  { type: 'order_placed', label: 'Order Confirmation', description: 'Send order placed notification', icon: '📦' },
  { type: 'order_shipped', label: 'Shipping Update', description: 'Send shipment notification with tracking', icon: '🚚' },
  { type: 'order_delivered', label: 'Delivery Confirmation', description: 'Send delivery confirmation', icon: '✅' },
];

// Single source of truth for the customer display name shown in the order list.
// Always derives from the billing_address (first_name + last_name). If the
// billing address is missing or has no name parts, returns 'N/A'.
const getCustomerName = (order: Order | null | undefined): string => {
  if (!order) return 'N/A';

  const billing = order.billing_address;
  if (billing) {
    const fullName = `${billing.first_name || ''} ${billing.last_name || ''}`.trim();
    if (fullName) return fullName;
    if ((billing as any).name?.trim()) return (billing as any).name.trim();
  }

  return 'N/A';
};

// WhatsApp Send Modal Component
interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({ isOpen, onClose, order, onSuccess }) => {
  const [selectedNotification, setSelectedNotification] = useState<WhatsAppNotificationType | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selectedNotification || !order) return;

    setSending(true);
    try {
      const phone = (order.user as any)?.phone || (order as any).shipping_address?.phone || (order as any).shipping_address?.mobile;

      if (!phone) {
        toast.error('No phone number available for this order');
        setSending(false);
        return;
      }

      const response = await api.post(`/settings/messaging/whatsapp/orders/${order.id}/send`, {
        event_type: selectedNotification,
        phone: phone,
      });

      if (response.data.success) {
        toast.success('WhatsApp message sent successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to send WhatsApp message');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !order) return null;

  const customerPhone = (order.user as any)?.phone || (order as any).shipping_address?.phone || (order as any).shipping_address?.mobile;
  const customerName = getCustomerName(order);

  return (
    <Modal open={isOpen} onClose={onClose} title="Send WhatsApp Notification" size="md">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Order: <span className="font-semibold">#{order.order_number}</span></p>
          <p className="text-sm text-gray-600">Customer: <span className="font-semibold">{customerName}</span></p>
          <p className="text-sm text-gray-600">Phone: <span className="font-semibold">{customerPhone || 'Not available'}</span></p>
        </div>

        {!customerPhone && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">⚠️ No phone number available for this order. Cannot send WhatsApp message.</p>
          </div>
        )}

        {customerPhone && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Notification Type
              </label>
              <div className="space-y-2">
                {WHATSAPP_NOTIFICATIONS.map((notification) => (
                  <button
                    key={notification.type}
                    onClick={() => setSelectedNotification(notification.type)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${selectedNotification === notification.type
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-2xl">{notification.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-medium text-gray-900">{notification.label}</div>
                      <div className="text-sm text-gray-500">{notification.description}</div>
                    </div>
                    {selectedNotification === notification.type && (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
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
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleSend}
                loading={sending}
                disabled={!selectedNotification}
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

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

// Special tab keys that map to backend filter params (not real statuses)
const SPECIAL_TABS = ['unshipped_prepaid', 'unshipped_cod', 'preorder'] as const;
type SpecialTab = typeof SPECIAL_TABS[number];

// Default filter values
const defaultFilters: FilterOptions = {
  page: 1,
  per_page: 10,
  search: '',
  status: '',
  payment_status: '',
  date_from: '',
  date_to: '',
  sort_by: 'created_at',
  sort_direction: 'desc',
};

// Main OrderList Component
const OrderList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine which special tab is active (unshipped_prepaid / unshipped_cod)
  const activeTab: string = searchParams.get('tab') || searchParams.get('status') || '';

  // Read filters from URL, falling back to defaults
  const filters: FilterOptions & Record<string, any> = {
    page: Number(searchParams.get('page')) || defaultFilters.page!,
    per_page: Number(searchParams.get('per_page')) || defaultFilters.per_page!,
    search: searchParams.get('search') || defaultFilters.search!,
    status: (() => {
      // If a special tab is active, don't set status filter
      const tab = searchParams.get('tab');
      if (tab && (SPECIAL_TABS as readonly string[]).includes(tab)) return '';
      return searchParams.get('status') || defaultFilters.status!;
    })(),
    payment_status: searchParams.get('payment_status') || defaultFilters.payment_status!,
    date_from: searchParams.get('date_from') || defaultFilters.date_from!,
    date_to: searchParams.get('date_to') || defaultFilters.date_to!,
    sort_by: searchParams.get('sort_by') || defaultFilters.sort_by!,
    sort_direction: (searchParams.get('sort_direction') as 'asc' | 'desc') || defaultFilters.sort_direction!,
    // Special filter flags for backend
    unshipped_prepaid: searchParams.get('tab') === 'unshipped_prepaid' ? '1' : '',
    unshipped_cod: searchParams.get('tab') === 'unshipped_cod' ? '1' : '',
    is_preorder: searchParams.get('tab') === 'preorder' ? '1' : '',
    preorder_payment_status: searchParams.get('tab') === 'preorder' ? 'paid,partially_paid' : '',
  };

  // Active status for OrderStatusTabs (combines status + special tabs)
  const activeStatus = searchParams.get('tab') || searchParams.get('status') || '';

  // Update a single filter and sync to URL
  const setFilter = (updates: Record<string, any>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      // If changing status/tab, clear the other
      if ('status' in updates) {
        next.delete('tab');
        if (updates.status && updates.status !== '') {
          next.set('status', updates.status);
        } else {
          next.delete('status');
        }
      }

      if ('tab' in updates) {
        next.delete('status');
        if (updates.tab && updates.tab !== '') {
          next.set('tab', updates.tab);
        } else {
          next.delete('tab');
        }
      }

      // Handle page reset on filter change
      if (updates.page !== undefined) {
        next.set('page', String(updates.page));
      } else if ('status' in updates || 'tab' in updates || 'search' in updates) {
        next.delete('page'); // reset page on filter change
      }

      // Handle other filter fields
      const simpleKeys = ['search', 'payment_status', 'date_from', 'date_to', 'sort_by', 'sort_direction', 'per_page'] as const;
      for (const key of simpleKeys) {
        if (key in updates) {
          const val = updates[key];
          const defaultVal = defaultFilters[key as keyof FilterOptions];
          if (val !== undefined && val !== '' && val !== defaultVal) {
            next.set(key, String(val));
          } else {
            next.delete(key);
          }
        }
      }

      return next;
    }, { replace: true });
  };

  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [quickViewOrderId, setQuickViewOrderId] = useState<number | null>(null);
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number>(-1);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
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

  // WhatsApp send modal state
  const [whatsappSendModal, setWhatsappSendModal] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({
    isOpen: false,
    order: null
  });

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getOrders(filters),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
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
  const handleFilterChange = (key: string, value: any) => {
    if (key === 'status') {
      // Special tabs use 'tab' param, real statuses use 'status' param
      if ((SPECIAL_TABS as readonly string[]).includes(value)) {
        setFilter({ tab: value });
      } else {
        setFilter({ status: value });
      }
    } else {
      setFilter({ [key]: value });
    }
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setFilter({ sort_by: key, sort_direction: direction });
  };

  const handlePageChange = (page: number) => {
    setFilter({ page });
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

  // Fast Delivery helpers — "Fast Delivery" is the literal courier name written
  // to `Order.metadata.shipping_method` by ShippingService when the customer
  // picks the faster shipping option at checkout. It is also promoted to the
  // top-level `shipping_method` field on the order detail endpoint.
  const isFastDelivery = (order: Order | null | undefined): boolean => {
    if (!order) return false;
    return (
      order.shipping_method === 'Fast Delivery' ||
      order.metadata?.shipping_method === 'Fast Delivery'
    );
  };

  const renderFastDeliveryBadge = () => (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
      title="Customer selected Fast Delivery at checkout"
    >
      Fast Delivery
    </span>
  );

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

  // Visual priority indicators for table rows
  const getRowClassName = (record: Order, index: number) => {
    const classes: string[] = [];

    // Keyboard navigation highlight
    if (index === highlightedRowIndex) {
      classes.push('ring-2 ring-inset ring-blue-400 bg-blue-50');
    }

    // Pending >24h: yellow background
    if (record.status === 'pending' && record.created_at) {
      const hoursSinceCreated = (Date.now() - new Date(record.created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreated > 24) {
        classes.push('bg-yellow-50');
      }
    }

    // COD orders: orange left border
    if (record.is_cod || record.payment_method === 'cod') {
      classes.push('border-l-4 border-l-orange-400');
    }

    // Failed payment: red left border
    if (record.payment_status === 'failed') {
      classes.push('border-l-4 border-l-red-400');
    }

    // High-value orders (>5000): gold left border
    if ((record.total_amount || 0) > 5000 && record.payment_status !== 'failed') {
      classes.push('border-l-4 border-l-yellow-500');
    }

    // Fast Delivery: green row tint + green left border (highest visual priority
    // so it wins over COD / failed / high-value left-border accents).
    if (isFastDelivery(record)) {
      classes.push('bg-green-50');
      classes.push('border-l-4 border-l-green-500');
    }

    return classes.join(' ');
  };

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

    // Create Shipment button for processing orders
    if (order.status === 'processing') {
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

  // Current orders list reference for keyboard navigation
  const currentOrders = (ordersResponse as any)?.orders?.data || [];

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'j', handler: () => setHighlightedRowIndex(prev => Math.min(prev + 1, currentOrders.length - 1)), description: 'Next row' },
    { key: 'k', handler: () => setHighlightedRowIndex(prev => Math.max(prev - 1, 0)), description: 'Prev row' },
    {
      key: 'Enter', handler: () => {
        if (highlightedRowIndex >= 0 && highlightedRowIndex < currentOrders.length) {
          setQuickViewOrderId(currentOrders[highlightedRowIndex].id);
        }
      }, description: 'Open quick view'
    },
    {
      key: 'p', handler: () => {
        if (highlightedRowIndex >= 0 && currentOrders[highlightedRowIndex]?.status === 'pending') {
          handleStatusUpdate(currentOrders[highlightedRowIndex].id, 'processing');
        }
      }, description: 'Process order'
    },
    {
      key: 's', handler: () => {
        if (highlightedRowIndex >= 0 && currentOrders[highlightedRowIndex]?.status === 'processing') {
          handleStatusUpdate(currentOrders[highlightedRowIndex].id, 'shipped');
        }
      }, description: 'Ship order'
    },
    {
      key: 'd', handler: () => {
        if (highlightedRowIndex >= 0 && currentOrders[highlightedRowIndex]?.status === 'shipped') {
          handleStatusUpdate(currentOrders[highlightedRowIndex].id, 'delivered');
        }
      }, description: 'Mark delivered'
    },
    {
      key: 'x', handler: () => {
        if (highlightedRowIndex >= 0 && ['pending', 'processing'].includes(currentOrders[highlightedRowIndex]?.status)) {
          handleStatusUpdate(currentOrders[highlightedRowIndex].id, 'cancelled');
        }
      }, description: 'Cancel order'
    },
    { key: '1', handler: () => handleFilterChange('status', ''), description: 'Tab: All' },
    { key: '2', handler: () => handleFilterChange('status', 'pending'), description: 'Tab: Pending' },
    { key: '3', handler: () => handleFilterChange('status', 'processing'), description: 'Tab: Processing' },
    { key: '4', handler: () => handleFilterChange('status', 'unshipped_prepaid'), description: 'Tab: Prepaid Unshipped' },
    { key: '5', handler: () => handleFilterChange('status', 'unshipped_cod'), description: 'Tab: COD Unshipped' },
    { key: '6', handler: () => handleFilterChange('status', 'shipped'), description: 'Tab: Shipped' },
    { key: '7', handler: () => handleFilterChange('status', 'delivered'), description: 'Tab: Delivered' },
    { key: '8', handler: () => handleFilterChange('status', 'cancelled'), description: 'Tab: Cancelled' },
    { key: 'e', handler: handleExport, description: 'Export' },
    {
      key: '/', handler: () => {
        const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        input?.focus();
      }, description: 'Focus search'
    },
    { key: '?', handler: () => setShowShortcutsHelp(true), description: 'Show help' },
  ]);

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
      render: (value: any, record: Order) => (
        <button
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey) {
              window.open(`/orders/${record.id}`, '_blank');
            } else {
              setQuickViewOrderId(record.id);
            }
          }}
        >
          #{value}
        </button>
      ),
    },
    {
      key: 'user' as const,
      title: 'Customer',
      render: (_: any, record: Order) => (
        <span className="font-medium text-gray-900">{getCustomerName(record)}</span>
      ),
    },
    {
      key: 'total_amount' as const,
      title: 'Total',
      sortable: true,
      render: (value: any, record: Order) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status' as const,
      title: 'Status',
      sortable: true,
      render: (value: any, record: Order) => (
        <InlineStatusDropdown
          currentStatus={value}
          onStatusChange={(newStatus) => handleStatusUpdate(record.id, newStatus)}
        />
      ),
    },
    {
      key: 'paid_amount' as any,
      title: 'Paid',
      render: (_: any, record: Order) => {
        const paid = record.paid_amount ?? 0;
        const total = record.total_amount ?? 0;
        const isFullyPaid = paid >= total && total > 0;
        return (
          <div>
            <span className={`font-medium ${isFullyPaid ? 'text-green-600' : paid > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {formatCurrency(paid)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'payment_method' as any,
      title: 'Payment',
      render: (_: any, record: Order) => {
        const isCOD = record.is_cod || record.payment_method === 'cod';
        return isCOD ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
            COD
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Prepaid
          </span>
        );
      },
    },
    {
      key: 'preorder' as const,
      title: 'Type',
      render: (_: any, record: Order) => (
        record.is_preorder ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            Preorder
          </span>
        ) : (
          <span className="text-gray-400 text-xs">Regular</span>
        )
      ),
    },
    {
      key: 'shipping_method' as any,
      title: 'Delivery',
      render: (_: any, record: Order) => (
        isFastDelivery(record) ? renderFastDeliveryBadge() : (
          <span className="text-gray-400 text-xs">Standard</span>
        )
      ),
    },
    {
      key: 'order_source' as any,
      title: 'Source',
      render: (_: any, record: Order) => {
        const source = record.order_source || 'direct';
        const recoveredFrom = (record as any).recovered_from;

        // Determine source display
        let label = 'Direct';
        let variant = 'default';

        if (recoveredFrom) {
          if (recoveredFrom.includes('whatsapp')) {
            label = 'WhatsApp Recovery';
            variant = 'success';
          } else if (recoveredFrom.includes('email')) {
            label = 'Email Recovery';
            variant = 'info';
          } else {
            label = 'Recovery';
            variant = 'warning';
          }
        } else if (source === 'utm' || (record as any).utm_source) {
          label = 'UTM';
          variant = 'info';
        } else if (source === 'organic') {
          label = 'Organic';
          variant = 'success';
        } else if (source === 'referral') {
          label = 'Referral';
          variant = 'warning';
        } else if (source === 'direct') {
          label = 'Direct';
          variant = 'default';
        }

        return (
          <Badge variant={variant as any} className="text-xs">
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'payment_status' as const,
      title: 'Pay Status',
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
      render: (_: any, record: Order) => {
        // Check if order has a phone number for WhatsApp
        const hasPhone = (record.user as any)?.phone || (record as any).shipping_address?.phone || (record as any).shipping_address?.mobile;

        return (
          <div className="flex space-x-2">
            <Link to={`/orders/${record.id}`}>
              <Button variant="ghost" size="sm">
                <EyeIcon className="h-4 w-4" />
              </Button>
            </Link>
            {hasPhone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWhatsappSendModal({ isOpen: true, order: record });
                }}
                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                title="Send WhatsApp"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </Button>
            )}
            <div className="flex space-x-1">
              {getStatusActions(record)}
            </div>
          </div>
        );
      },
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

      {/* Status Tabs */}
      <OrderStatusTabs
        activeStatus={activeStatus}
        onStatusChange={(status) => handleFilterChange('status', status)}
        stats={stats}
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-1 max-w-md">
              <OrderSearchWithSuggestions
                value={filters.search || ''}
                onChange={(value) => handleFilterChange('search', value)}
              />
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
                value={activeStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
                <option disabled>──────────</option>
                <option value="unshipped_prepaid">Prepaid Unshipped</option>
                <option value="unshipped_cod">COD Unshipped</option>
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

      {/* Orders List - Mobile (cards) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading orders…
          </div>
        ) : (ordersResponse as any)?.orders?.data?.length ? (
          ((ordersResponse as any).orders.data as Order[]).map((order, index) => (
            <div
              key={order.id}
              className={`bg-white rounded-lg shadow p-4 ${getRowClassName(order, index) ?? ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <button
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.ctrlKey || e.metaKey) {
                        window.open(`/orders/${order.id}`, '_blank');
                      } else {
                        setQuickViewOrderId(order.id);
                      }
                    }}
                  >
                    #{order.order_number}
                  </button>
                  <div className="text-sm text-gray-600 mt-0.5 truncate">
                    {getCustomerName(order)}
                  </div>
                </div>
                <InlineStatusDropdown
                  currentStatus={order.status}
                  onStatusChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString()
                    : ''}
                </div>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(order.total_amount)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Paid: <span className="font-medium text-gray-700">{formatCurrency(order.paid_amount ?? 0)}</span>
                </span>
                <Link
                  to={`/orders/${order.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View details →
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No orders found for the current filters.
          </div>
        )}
        {/* Mobile pagination controls — re-use the same handler as desktop */}
        {((ordersResponse as any)?.orders?.total || 0) > (filters.per_page || 10) && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
              disabled={(filters.page || 1) <= 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {filters.page || 1} of {Math.max(1, Math.ceil(((ordersResponse as any)?.orders?.total || 0) / (filters.per_page || 10)))}
            </span>
            <button
              type="button"
              onClick={() =>
                handlePageChange(
                  Math.min(
                    Math.max(1, Math.ceil(((ordersResponse as any)?.orders?.total || 0) / (filters.per_page || 10))),
                    (filters.page || 1) + 1,
                  ),
                )
              }
              disabled={
                (filters.page || 1) >=
                Math.max(1, Math.ceil(((ordersResponse as any)?.orders?.total || 0) / (filters.per_page || 10)))
              }
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow">
        <Table
          data={(ordersResponse as any)?.orders?.data || []}
          columns={columns}
          loading={isLoading}
          rowClassName={getRowClassName}
          pagination={{
            current: filters.page || 1,
            total: (ordersResponse as any)?.orders?.total || 0,
            pageSize: filters.per_page || 10,
            onChange: handlePageChange,
          }}
          onSort={handleSort}
        />
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

      {/* Order Quick View Drawer */}
      <OrderQuickView
        orderId={quickViewOrderId}
        open={quickViewOrderId !== null}
        onClose={() => setQuickViewOrderId(null)}
        onStatusChange={(id, status) => {
          handleStatusUpdate(id, status);
        }}
        onNavigatePrev={() => {
          const orders = (ordersResponse as any)?.orders?.data || [];
          const currentIdx = orders.findIndex((o: Order) => o.id === quickViewOrderId);
          if (currentIdx > 0) setQuickViewOrderId(orders[currentIdx - 1].id);
        }}
        onNavigateNext={() => {
          const orders = (ordersResponse as any)?.orders?.data || [];
          const currentIdx = orders.findIndex((o: Order) => o.id === quickViewOrderId);
          if (currentIdx < orders.length - 1) setQuickViewOrderId(orders[currentIdx + 1].id);
        }}
        hasPrev={(() => {
          const orders = (ordersResponse as any)?.orders?.data || [];
          const idx = orders.findIndex((o: Order) => o.id === quickViewOrderId);
          return idx > 0;
        })()}
        hasNext={(() => {
          const orders = (ordersResponse as any)?.orders?.data || [];
          const idx = orders.findIndex((o: Order) => o.id === quickViewOrderId);
          return idx >= 0 && idx < orders.length - 1;
        })()}
      />

      {/* WhatsApp Send Modal */}
      <WhatsAppSendModal
        isOpen={whatsappSendModal.isOpen}
        onClose={() => setWhatsappSendModal({ isOpen: false, order: null })}
        order={whatsappSendModal.order}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
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