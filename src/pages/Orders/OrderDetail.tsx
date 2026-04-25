import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ordersApi } from '../../api';
import { formatWeight, toKg } from '../../utils/weight';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowLeft,
  MapPin,
  Package,
  PackageCheck,
  Truck,
  CreditCard,
  User,
  Phone,
  Mail,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Printer,
  RefreshCw,
  ChevronRight,
  Send,
  Trash2,
  ExternalLink,
  Info,
  ClipboardList,
  MoreVertical,
  Copy,
  Tag,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../api/axios';
import CommunicationPanel from '../../components/Orders/CommunicationPanel';
import InternalNotesSection from '../../components/Orders/InternalNotesSection';
import EditAddressModal from '../../components/Orders/EditAddressModal';
import PartialRefundModal from '../../components/Orders/PartialRefundModal';
import OrderFinancialSummary from '../../components/Orders/OrderFinancialSummary';
import { orderEnhancementsApi } from '../../api/orderEnhancements';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  StatusBadge,
  Modal,
  ConfirmModal,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  PageSkeleton
} from '../../components';

interface OrderStatus {
  value: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const orderStatuses: OrderStatus[] = [
  { value: 'pending', label: 'Pending', color: 'yellow', icon: <Clock className="h-4 w-4" /> },
  { value: 'confirmed', label: 'Confirmed', color: 'blue', icon: <CheckCircle className="h-4 w-4" /> },
  { value: 'processing', label: 'Processing', color: 'indigo', icon: <Package className="h-4 w-4" /> },
  { value: 'shipped', label: 'Shipped', color: 'purple', icon: <Truck className="h-4 w-4" /> },
  { value: 'delivered', label: 'Delivered', color: 'green', icon: <CheckCircle className="h-4 w-4" /> },
  { value: 'cancelled', label: 'Cancelled', color: 'red', icon: <XCircle className="h-4 w-4" /> },
  { value: 'refunded', label: 'Refunded', color: 'gray', icon: <RefreshCw className="h-4 w-4" /> },
];

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [overrideWorkflow, setOverrideWorkflow] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  // Phase 1 Enhancement States
  const [editAddressModal, setEditAddressModal] = useState<{ type: 'shipping' | 'billing'; address: any } | null>(null);
  const [showPartialRefundModal, setShowPartialRefundModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [carrierReference, setCarrierReference] = useState('');
  const [shippingCost, setShippingCost] = useState('');

  // Fetch order details with real-time polling
  const { data: orderResponse, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(Number(id)),
    enabled: !!id,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const order = orderResponse?.order;

  // Fetch shipment details for this order
  const { data: shipmentResponse, refetch: refetchShipment } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/orders/${id}/shipment`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // No shipment exists
        }
        throw error;
      }
    },
    enabled: !!id,
  });

  const shipment = shipmentResponse?.shipment;

  const { data: carriersData } = useQuery({
    queryKey: ['shipping-carriers'],
    queryFn: () => api.get('/shipping/multi-carrier/carriers').then(res => res.data),
    enabled: showStatusModal && selectedStatus === 'shipped',
  });
  const carriers = carriersData?.data || carriersData?.carriers || [];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note, overrideWorkflow }: { status: string; note: string; overrideWorkflow: boolean }) => {
      return ordersApi.updateStatus(Number(id), status, note, overrideWorkflow);
    },
    onSuccess: () => {
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      setOverrideWorkflow(false);
      setStatusNote('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Cancel shipment mutation
  const cancelShipmentMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/orders/${id}/shipment`);
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data.warning) {
        toast.success('Shipment cancelled in system', { duration: 4000 });
        toast(data.warning, { icon: '⚠️', duration: 6000 });
      } else {
        toast.success('Shipment cancelled successfully');
      }
      
      setShowCancelConfirm(false);
      refetch();
      refetchShipment();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel shipment');
    },
  });

  // Generate label mutation
  const generateLabelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/shipping/multi-carrier/shipments/${shipment?.id}/generate-label`);
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data.success && data.data?.label_url) {
        toast.success('Shipping label generated successfully');
        refetchShipment();
      } else {
        toast.error(data.message || 'Failed to generate label');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate shipping label');
    },
  });

  const manualShipMutation = useMutation({
    mutationFn: (data: any) => ordersApi.updateTracking(Number(id), data),
    onSuccess: () => {
      toast.success('Order marked as shipped with tracking info');
      setShowStatusModal(false);
      setTrackingNumber('');
      setCarrierId('');
      setCarrierReference('');
      setShippingCost('');
      setStatusNote('');
      setOverrideWorkflow(false);
      refetch();
      refetchShipment();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update tracking');
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    if (selectedStatus === 'shipped' && trackingNumber) {
      if (!carrierId) {
        toast.error('Please select a carrier');
        return;
      }
      manualShipMutation.mutate({
        tracking_number: trackingNumber,
        carrier_id: carrierId,
        carrier_reference: carrierReference || undefined,
        shipping_cost: shippingCost ? parseFloat(shippingCost) : undefined,
        notes: statusNote || undefined,
      });
      return;
    }
    
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'processing', 'cancelled'],
      confirmed: ['processing', 'shipped', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
      refunded: [],
    };
    
    const currentStatus = order?.status || '';
    const isValidTransition = validTransitions[currentStatus]?.includes(selectedStatus);
    
    if (!isValidTransition && !overrideWorkflow) {
      toast.error('This status transition is not allowed. Check "Override Workflow Rules" to proceed.');
      return;
    }
    
    updateStatusMutation.mutate({ status: selectedStatus, note: statusNote, overrideWorkflow });
  };

  const handlePrintInvoice = () => {
    const pdfUrl = orderEnhancementsApi.getInvoicePdfUrl(Number(id));
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
      toast.success('Opening invoice for printing...');
    } else {
      toast.error('Please allow popups to print invoice');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const loadingToast = toast.loading('Preparing invoice download...');
      
      const token = useAuthStore.getState().token;
      const baseUrl = orderEnhancementsApi.getInvoicePdfUrl(Number(id));
      
      const response = await fetch(baseUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order?.order_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Invoice downloaded successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleDownloadPackingSlip = async () => {
    try {
      const loadingToast = toast.loading('Preparing packing slip...');
      
      const token = useAuthStore.getState().token;
      const baseUrl = orderEnhancementsApi.getPackingSlipPdfUrl(Number(id));
      
      const response = await fetch(baseUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to download packing slip');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packing-slip-${order?.order_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Packing slip downloaded successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download packing slip');
    }
  };

  const handleRefund = () => {
    setShowPartialRefundModal(true);
  };

  const handleCancelShipment = () => {
    setShowCancelConfirm(true);
  };

  const getShipmentStatusColor = (status: string) => {
    const colors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
      'pending': 'warning',
      'confirmed': 'info',
      'pickup_scheduled': 'info',
      'picked_up': 'info',
      'in_transit': 'warning',
      'out_for_delivery': 'info',
      'delivered': 'success',
      'cancelled': 'error',
      'returned': 'default',
      'failed': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusColor = (status: string) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const getStatusIcon = (status: string) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj?.icon || <AlertCircle className="h-4 w-4" />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Loading state with skeleton
  if (isLoading) {
    return <PageSkeleton type="detail" />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Order not found</h3>
        <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Sticky on scroll (desktop) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 -mx-6 px-6 py-4 print:static print:border-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/orders')}
            className="hidden sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
              <StatusBadge status={order.status as any} className="hidden sm:inline-flex" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPackingSlip}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Packing Slip
          </Button>
          {!shipment && (order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped') && (
            <Button variant="success" size="sm" onClick={() => navigate(`/orders/${id}/create-shipment`)}>
              <Send className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          )}
          {shipment && shipment.status === 'cancelled' && (
            <Button variant="warning" size="sm" onClick={() => navigate(`/orders/${id}/create-shipment`)}>
              <Send className="h-4 w-4 mr-2" />
              Create New Shipment
            </Button>
          )}
          {shipment && shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
            <Button variant="danger" size="sm" onClick={handleCancelShipment} loading={cancelShipmentMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Shipment
            </Button>
          )}
          {order.status !== 'refunded' && order.status !== 'cancelled' && (
            <Button variant="primary" size="sm" onClick={() => {
              setSelectedStatus(order.status);
              setShowStatusModal(true);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          )}
        </div>

        {/* Mobile Actions Menu */}
        <div className="lg:hidden relative">
          <Button
            variant="outline"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className="w-full"
          >
            Actions
            <MoreVertical className="h-4 w-4 ml-2" />
          </Button>
          {showActionsMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => { handlePrintInvoice(); setShowActionsMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print Invoice
              </button>
              <button
                onClick={() => { handleDownloadInvoice(); setShowActionsMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Invoice
              </button>
              <button
                onClick={() => { handleDownloadPackingSlip(); setShowActionsMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <ClipboardList className="h-4 w-4" /> Packing Slip
              </button>
              <hr className="my-2" />
              {!shipment && (order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped') && (
                <button
                  onClick={() => { navigate(`/orders/${id}/create-shipment`); setShowActionsMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                >
                  <Send className="h-4 w-4" /> Create Shipment
                </button>
              )}
              {shipment && shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
                <button
                  onClick={() => { handleCancelShipment(); setShowActionsMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="h-4 w-4" /> Cancel Shipment
                </button>
              )}
              <button
                onClick={() => { setSelectedStatus(order.status); setShowStatusModal(true); setShowActionsMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
              >
                <Edit className="h-4 w-4" /> Update Status
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile Status Display */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                {getStatusIcon(order.status)}
                <div>
                  <p className="font-medium capitalize">{order.status}</p>
                  <p className="text-xs text-gray-500">Current Status</p>
                </div>
              </div>
              <StatusBadge status={order.status as any} />
            </div>
          </div>
          
          {/* Desktop Timeline */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="flex items-center justify-between min-w-[500px]">
              {orderStatuses.slice(0, 5).map((status, index) => {
                const isActive = orderStatuses.findIndex(s => s.value === order.status) >= index;
                const isCurrent = status.value === order.status;

                return (
                  <React.Fragment key={status.value}>
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all
                        ${isActive
                          ? isCurrent
                            ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                            : 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}>
                        {isActive && !isCurrent ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          status.icon
                        )}
                      </div>
                      <span className={`
                        mt-2 text-xs font-medium text-center
                        ${isActive ? 'text-gray-900' : 'text-gray-400'}
                      `}>
                        {status.label}
                      </span>
                    </div>
                    {index < 4 && (
                      <div className={`
                        flex-1 h-1 mx-2 rounded-full transition-all
                        ${isActive ? 'bg-green-500' : 'bg-gray-200'}
                      `} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
              <CardDescription>
                {order.order_items?.length || 0} item(s) in this order
                {order.order_items?.some((item: any) => item.product?.weight) && (
                  <span className="ml-2 text-gray-400">
                    • Total Weight: {formatWeight(order.order_items.reduce((sum: number, item: any) =>
                      sum + (item.product?.weight || 0) * item.quantity, 0))}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => {
                  // Check if this is a bundle item
                  const isBundle = item.bundle_variant_id || item.bundle_details;
                  const bundleDetails = item.bundle_details || (item.product_attributes ? (() => {
                    try {
                      const attrs = typeof item.product_attributes === 'string'
                        ? JSON.parse(item.product_attributes)
                        : item.product_attributes;
                      return attrs.bundle_discount_amount > 0 ? {
                        discount_amount: attrs.bundle_discount_amount,
                        quantity_per_bundle: attrs.bundle_quantity || 1
                      } : null;
                    } catch { return null; }
                  })() : null);
                  
                  return (
                    <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg transition-colors ${
                      isBundle ? 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.product_name || item.product?.name || 'Product'}
                          </h3>
                          {isBundle && (
                            <Badge variant="info" className="text-xs">Bundle</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                          <span>SKU: {item.product_sku || item.product?.sku || 'N/A'}</span>
                          {item.product?.isbn && <span>ISBN: {item.product.isbn}</span>}
                          {item.product?.weight && <span>Weight: {formatWeight(item.product.weight)}</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                          {item.product?.weight && (
                            <span className="text-gray-400 ml-2">
                              (Total: {formatWeight(item.product.weight * item.quantity)})
                            </span>
                          )}
                        </p>
                        
                        {/* Bundle Details */}
                        {bundleDetails && (
                          <div className="mt-2 p-2 bg-white rounded border border-blue-200 text-sm">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Package className="h-4 w-4" />
                              <span className="font-medium">Bundle Offer</span>
                            </div>
                            <div className="mt-1 text-gray-600 space-y-0.5">
                              {bundleDetails.quantity_per_bundle && (
                                <p>Items per bundle: <span className="font-medium">{bundleDetails.quantity_per_bundle}</span>
                                  {bundleDetails.total_items && ` (Total: ${bundleDetails.total_items} items)`}
                                </p>
                              )}
                              {bundleDetails.variant_name && (
                                <p>Variant: <span className="font-medium">{bundleDetails.variant_name}</span></p>
                              )}
                              {bundleDetails.discount_amount > 0 && (
                                <p className="text-green-600">Bundle Savings: -{formatCurrency(bundleDetails.discount_amount)}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
                        {bundleDetails?.discount_amount > 0 && (
                          <p className="text-sm text-green-600">
                            Bundle: -{formatCurrency(bundleDetails.discount_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipment ? (
                <div className="space-y-4">
                  {/* Shipment Status Banner */}
                  <div className={`p-4 rounded-lg border-2 ${
                    getShipmentStatusColor(shipment.status) === 'success' ? 'bg-green-50 border-green-200' :
                    getShipmentStatusColor(shipment.status) === 'error' ? 'bg-red-50 border-red-200' :
                    getShipmentStatusColor(shipment.status) === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Package className={`h-8 w-8 ${
                          getShipmentStatusColor(shipment.status) === 'success' ? 'text-green-600' :
                          getShipmentStatusColor(shipment.status) === 'error' ? 'text-red-600' :
                          getShipmentStatusColor(shipment.status) === 'warning' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div>
                          <p className="font-semibold text-lg capitalize">{shipment.status.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">Shipment ID: #{shipment.id}</p>
                        </div>
                      </div>
                      {shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleCancelShipment}
                          loading={cancelShipmentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tracking Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-mono font-bold text-blue-900 break-all">{shipment.tracking_number}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(shipment.tracking_number);
                            toast.success('Tracking number copied!');
                          }}
                          className="flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {shipment.carrier_tracking_id && shipment.carrier_tracking_id !== shipment.tracking_number && (
                        <p className="text-xs text-gray-500 mt-1">Carrier Ref: {shipment.carrier_tracking_id}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Courier Partner</p>
                      <p className="font-medium">{shipment.carrier?.name || 'N/A'}</p>
                      {(shipment.service_name || shipment.service_code) && (
                        <p className="text-xs text-gray-500">
                          Service: {shipment.service_name || shipment.service_code}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Shipping Cost</p>
                      <p className="font-medium">{formatCurrency(shipment.shipping_cost || 0)}</p>
                    </div>

                    {shipment.expected_delivery_date && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Expected Delivery</p>
                        <p className="font-medium">{formatDate(shipment.expected_delivery_date)}</p>
                      </div>
                    )}

                    {shipment.actual_delivery_date && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Actual Delivery</p>
                        <p className="font-medium text-green-600">{formatDate(shipment.actual_delivery_date)}</p>
                      </div>
                    )}

                    {shipment.weight && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Weight</p>
                        <p className="font-medium">{formatWeight(shipment.weight * 1000)}</p>
                      </div>
                    )}

                    {/* Shipping Label Actions */}
                    <div className="col-span-1 md:col-span-2 flex flex-wrap gap-2">
                      {shipment.label_url ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => window.open(shipment.label_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Shipping Label
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                      ) : shipment.status !== 'cancelled' && shipment.status !== 'delivered' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateLabelMutation.mutate()}
                          loading={generateLabelMutation.isPending}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Shipping Label
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Live Tracking Timeline */}
                  {shipment.tracking && shipment.status !== 'cancelled' && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">Live Tracking</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refetchShipment()}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {shipment.tracking.status_description && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-900">{shipment.tracking.status_description}</p>
                        </div>
                      )}

                      {shipment.tracking.events && shipment.tracking.events.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {shipment.tracking.events.map((event: any, index: number) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                                {index !== shipment.tracking.events.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-gray-300 mt-1"></div>
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className={`text-sm font-medium ${index === 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {event.status || event.activity || event.description}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-gray-600 mt-0.5">📍 {event.location}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {event.timestamp ? formatDate(event.timestamp) : event.date ? formatDate(event.date) : 'N/A'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No tracking events yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Shipping Address</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditAddressModal({ type: 'shipping', address: order.shipping_address })}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          {order.shipping_address?.name || `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {[
                            order.shipping_address?.house_number,
                            order.shipping_address?.address_line_1,
                            order.shipping_address?.address_1,
                            order.shipping_address?.address,
                            order.shipping_address?.address_line_2,
                            order.shipping_address?.address_2,
                            order.shipping_address?.landmark,
                          ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.shipping_address?.city || ''}, {order.shipping_address?.state || ''} {order.shipping_address?.pincode || order.shipping_address?.postal_code || ''}
                        </p>
                        <p className="text-sm text-gray-600">{order.shipping_address?.country}</p>
                        {(order.shipping_address?.phone || order.shipping_address?.mobile || order.shipping_address?.whatsapp_number) && (
                          <p className="text-sm text-gray-600">Phone: {order.shipping_address.phone || order.shipping_address.mobile || order.shipping_address.whatsapp_number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No shipment created yet</p>
                  {(order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped') && (
                    <Button variant="success" onClick={() => navigate(`/orders/${id}/create-shipment`)}>
                      <Send className="h-4 w-4 mr-2" />
                      Create Shipment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Billing Information
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditAddressModal({ type: 'billing', address: order.billing_address })}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {order.billing_address?.name || `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {[
                      order.billing_address?.house_number,
                      order.billing_address?.address_line_1,
                      order.billing_address?.address_1,
                      order.billing_address?.address,
                      order.billing_address?.address_line_2,
                      order.billing_address?.address_2,
                      order.billing_address?.landmark,
                    ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.billing_address?.city || ''}, {order.billing_address?.state || ''} {order.billing_address?.pincode || order.billing_address?.postal_code || ''}
                  </p>
                  <p className="text-sm text-gray-600">{order.billing_address?.country}</p>
                  {(order.billing_address?.phone || order.billing_address?.mobile || order.billing_address?.whatsapp_number) && (
                    <p className="text-sm text-gray-600">Phone: {order.billing_address.phone || order.billing_address.mobile || order.billing_address.whatsapp_number}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preorder Information */}
          {order.is_preorder && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Calendar className="h-5 w-5" />
                  Preorder Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700">Release Date</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {order.release_date ? new Date(order.release_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">Estimated Shipping</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {order.release_date ? new Date(new Date(order.release_date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">Note:</span> This is a preorder. Items will ship within 3-5 business days after the release date.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.activities && order.activities.length > 0 ? (
                  order.activities.map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'status_change' ? 'bg-blue-500' :
                          activity.type === 'shipment_created' ? 'bg-green-500' :
                          activity.type === 'shipment_cancelled' ? 'bg-red-500' :
                          activity.type === 'order_created' ? 'bg-purple-500' :
                          activity.type === 'payment_update' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        {index !== order.activities.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[20px]"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        {activity.old_value && activity.new_value && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            <span className="text-red-600 line-through">{activity.old_value}</span>
                            {' → '}
                            <span className="text-green-600 font-medium">{activity.new_value}</span>
                          </p>
                        )}
                        {activity.note && (
                          <p className="text-xs text-gray-600 mt-1 italic bg-gray-50 p-2 rounded">
                            {activity.note}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">{formatDate(activity.created_at)}</p>
                          {activity.performed_by && activity.performed_by !== 'System' && (
                            <span className="text-xs text-gray-400">• by {activity.performed_by}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No activity recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column on desktop */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium">
                    {order.user?.first_name} {order.user?.last_name}
                    {!order.user?.first_name && order.user?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <a href={`mailto:${order.user?.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{order.user?.email}</span>
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <a href={`tel:${order.user?.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {order.user?.phone || 'Not provided'}
                  </a>
                </div>
                {order.user?.id && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                    <p className="font-medium">#{order.user.id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <p className="font-medium">{order.customer?.total_orders || 1}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/customers/${order.user_id || order.customer_id}`)}
              >
                View Customer
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="font-medium capitalize">{order.payment_method || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                  <StatusBadge
                    status={
                      order.payment_status === 'paid' ? 'success' :
                      order.payment_status === 'pending' ? 'warning' : 'error'
                    }
                  >
                    {order.payment_status || 'Pending'}
                  </StatusBadge>
                </div>
                {order.payment_transaction_id && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                    <p className="font-mono text-sm break-all">{order.payment_transaction_id}</p>
                  </div>
                )}
                {order.status === 'delivered' && order.payment_status === 'paid' && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleRefund}
                  >
                    Process Refund
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* COD Information Card */}
          {order.is_cod && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  COD Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="text-sm font-medium text-orange-800">Payment Type</span>
                    <span className="text-sm font-bold text-orange-900">
                      {order.is_cod_advance ? 'COD with Advance' : 'Full COD'}
                    </span>
                  </div>
                  
                  {order.is_cod_advance && order.advance_amount && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Advance Paid</span>
                        <span className="font-medium text-green-600">{formatCurrency(order.advance_amount)}</span>
                      </div>
                      {order.balance_amount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Balance (COD)</span>
                          <span className="font-medium text-orange-600">{formatCurrency(order.balance_amount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!order.is_cod_advance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount to Collect</span>
                      <span className="font-bold text-orange-600">{formatCurrency(order.total_amount)}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                    ⚠️ Cash on Delivery - Verify payment upon delivery
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.delivery_option && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Delivery Option</p>
                    <p className="font-medium">{order.delivery_option.name}</p>
                    {order.delivery_option.description && (
                      <p className="text-xs text-gray-500">{order.delivery_option.description}</p>
                    )}
                  </div>
                )}
                
                {order.pickup_pincode && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pickup Pincode</p>
                    <p className="font-medium font-mono">{order.pickup_pincode}</p>
                  </div>
                )}
                
                {order.delivery_pincode && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Delivery Pincode</p>
                    <p className="font-medium font-mono">{order.delivery_pincode}</p>
                  </div>
                )}
                
                {order.estimated_delivery_date && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estimated Delivery</p>
                    <p className="font-medium text-blue-600">
                      {new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                {order.shipping_zone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Shipping Zone</p>
                    <Badge variant="outline">{order.shipping_zone}</Badge>
                  </div>
                )}
                
                {!order.delivery_option && !order.pickup_pincode && !order.delivery_pincode && !order.estimated_delivery_date && (
                  <p className="text-sm text-gray-500">No delivery details available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Packaging & Insurance Card */}
          {(order.packaging_option || order.packaging_amount > 0 || order.insurance_amount > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Packaging & Insurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.packaging_option && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Packaging</p>
                      <p className="font-medium">{order.packaging_option.name}</p>
                      {order.packaging_option.description && (
                        <p className="text-xs text-gray-500">{order.packaging_option.description}</p>
                      )}
                    </div>
                  )}
                  
                  {order.packaging_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Packaging Cost</span>
                      <span className="font-medium">{formatCurrency(order.packaging_amount)}</span>
                    </div>
                  )}
                  
                  {order.insurance_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Insurance</span>
                      <span className="font-medium">{formatCurrency(order.insurance_amount)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referral Card */}
          {order.referral_details && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Referral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-sm font-medium text-purple-800">Referral Code</span>
                    <span className="text-sm font-bold font-mono text-purple-900">{order.referral_details.code}</span>
                  </div>
                  
                  {order.referral_details.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount Applied</span>
                      <span className="font-medium text-green-600">-{formatCurrency(order.referral_details.discount_amount)}</span>
                    </div>
                  )}
                  
                  {order.referral_details.discount_type && (
                    <div className="text-xs text-gray-500">
                      Discount Type: {order.referral_details.discount_type}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refunds Card */}
          {order.refunds_list && order.refunds_list.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Refunds ({order.refunds_list.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.refunds_list.map((refund: any, index: number) => (
                    <div key={refund.id || index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Refund #{refund.id}</span>
                        <StatusBadge
                          status={
                            refund.status === 'completed' ? 'success' :
                            refund.status === 'pending' ? 'warning' : 'error'
                          }
                        >
                          {refund.status}
                        </StatusBadge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-medium text-red-600">{formatCurrency(refund.amount)}</span>
                      </div>
                      {refund.reason && (
                        <p className="text-xs text-gray-500 mt-2 italic">"{refund.reason}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(refund.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <OrderFinancialSummary
            order={order}
            formatCurrency={formatCurrency}
          />

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.notes ? (
                <p className="text-sm text-gray-600">{order.notes}</p>
              ) : (
                <p className="text-sm text-gray-500">No notes added</p>
              )}
            </CardContent>
          </Card>

          {/* Communication Panel */}
          <CommunicationPanel
            orderId={Number(id)}
            customerName={`${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() || order.user?.name || 'Customer'}
            customerEmail={order.user?.email || ''}
            customerPhone={order.user?.phone || order.shipping_address?.phone || order.shipping_address?.mobile}
            orderNumber={order.order_number}
            totalAmount={order.total_amount}
            trackingNumber={shipment?.tracking_number}
          />

          {/* Internal Notes */}
          <InternalNotesSection orderId={Number(id)} />
        </div>
      </div>

      {/* Modals */}
      {editAddressModal && (
        <EditAddressModal
          orderId={Number(id)}
          addressType={editAddressModal.type}
          currentAddress={editAddressModal.address}
          onClose={() => setEditAddressModal(null)}
        />
      )}

      {showPartialRefundModal && (
        <PartialRefundModal
          orderId={Number(id)}
          orderNumber={order.order_number}
          totalAmount={order.total_amount}
          orderItems={order.orderItems}
          onClose={() => setShowPartialRefundModal(false)}
        />
      )}

      {/* Cancel Shipment Confirmation Modal */}
      <ConfirmModal
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => cancelShipmentMutation.mutate()}
        title="Cancel Shipment"
        message="Are you sure you want to cancel this shipment? This may incur cancellation charges from the carrier."
        confirmText="Cancel Shipment"
        variant="danger"
        loading={cancelShipmentMutation.isPending}
      />

      {/* Status Update Modal with Override */}
      <Modal
        open={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setOverrideWorkflow(false);
          setTrackingNumber('');
          setCarrierId('');
          setCarrierReference('');
          setShippingCost('');
        }}
        title="Update Order Status"
        size="md"
      >
        <div className="space-y-4">
          {/* Current Status Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Current status: <span className="font-semibold capitalize">{order?.status}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {orderStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {selectedStatus === 'shipped' && (
            <div className="space-y-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm font-medium text-indigo-800">Shipment Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carrier <span className="text-red-500">*</span>
                </label>
                <select
                  value={carrierId}
                  onChange={(e) => setCarrierId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select carrier</option>
                  {carriers.map((carrier: any) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name || carrier.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tracking number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carrier Reference ID
                </label>
                <input
                  type="text"
                  value={carrierReference}
                  onChange={(e) => setCarrierReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional: carrier's internal reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Cost
                </label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Add a note about this status change..."
            />
          </div>

          {/* Override Workflow Checkbox */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideWorkflow}
                onChange={(e) => setOverrideWorkflow(e.target.checked)}
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
          {selectedStatus && order?.status && selectedStatus !== order.status && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Status Transition Warning
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Changing from <span className="font-semibold capitalize">{order.status}</span> to{' '}
                    <span className="font-semibold capitalize">{selectedStatus}</span> may not follow the normal workflow.
                    {!overrideWorkflow && ' Check "Override Workflow Rules" if you want to proceed anyway.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setShowStatusModal(false);
              setOverrideWorkflow(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleStatusUpdate}
            loading={updateStatusMutation.isPending}
          >
            Update Status
          </Button>
        </div>
      </Modal>

      {/* Mobile Fixed Bottom Action Bar */}
      {order && order.status !== 'refunded' && order.status !== 'cancelled' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handlePrintInvoice}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            {order.status === 'pending' && (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedStatus('processing');
                  handleStatusUpdate();
                }}
              >
                Process
              </Button>
            )}
            {order.status === 'processing' && (
              <Button
                variant="success"
                size="sm"
                className="flex-1"
                onClick={() => navigate(`/orders/${id}/create-shipment`)}
              >
                <Send className="h-4 w-4 mr-1" />
                Ship
              </Button>
            )}
            {order.status === 'shipped' && (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedStatus('delivered');
                  handleStatusUpdate();
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Delivered
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStatus(order.status);
                setShowStatusModal(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
