import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ordersApi } from '../../api';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Package,
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
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  // Fetch order details
  const { data: orderResponse, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(Number(id)),
    enabled: !!id,
  });

  const order = orderResponse?.order;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note: string }) => {
      return ordersApi.updateStatus(Number(id), status, note);
    },
    onSuccess: () => {
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    updateStatusMutation.mutate({ status: selectedStatus, note: statusNote });
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    // In a real app, this would generate and download a PDF
    toast.success('Invoice download started');
  };

  const handleRefund = () => {
    if (window.confirm('Are you sure you want to refund this order?')) {
      updateStatusMutation.mutate({ status: 'refunded', note: 'Order refunded by admin' });
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold">Order #{order.order_number}</h1>
            <p className="text-sm text-gray-500">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintInvoice}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          {(order.status === 'confirmed' || order.status === 'processing') && !order.tracking_number && (
            <button
              onClick={() => navigate(`/orders/${id}/create-shipment`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
              Create Shipment
            </button>
          )}
          {order.status !== 'refunded' && order.status !== 'cancelled' && (
            <button
              onClick={() => {
                setSelectedStatus(order.status);
                setShowStatusModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Order Status</h2>
        <div className="flex items-center justify-between">
          {orderStatuses.slice(0, 5).map((status, index) => {
            const isActive = orderStatuses.findIndex(s => s.value === order.status) >= index;
            const isCurrent = status.value === order.status;

            return (
              <React.Fragment key={status.value}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isActive
                      ? isCurrent
                        ? `bg-${status.color}-500 text-white`
                        : 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                    }
                  `}>
                    {isActive && !isCurrent ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      status.icon
                    )}
                  </div>
                  <span className={`
                    mt-2 text-xs font-medium
                    ${isActive ? 'text-gray-900' : 'text-gray-400'}
                  `}>
                    {status.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`
                    flex-1 h-1 mx-2
                    ${isActive ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Order Items</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.product?.image_url && (
                      <img
                        src={item.product.image_url}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product_name || item.product?.name || 'Product'}</h3>
                      <p className="text-sm text-gray-500">
                        SKU: {item.product_sku || item.product?.sku || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        ISBN: {item.product?.isbn || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      {item.product_attributes && (() => {
                        const attrs = JSON.parse(item.product_attributes);
                        return attrs.bundle_discount_amount > 0 && (
                          <p className="text-sm text-green-600">
                            Bundle Discount: -{formatCurrency(attrs.bundle_discount_amount)}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(order.subtotal || 0)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span>{formatCurrency(order.shipping_amount)}</span>
                  </div>
                )}
                {order.insurance_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Insurance</span>
                    <span>{formatCurrency(order.insurance_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Courier Partner</p>
                  <p className="font-medium">{order.courier_partner || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                  <p className="font-medium">{order.tracking_number || 'Not available'}</p>
                </div>
                {order.estimated_delivery_date && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Est. Delivery</p>
                    <p className="font-medium">{formatDate(order.estimated_delivery_date)}</p>
                  </div>
                )}
                {order.shipping_zone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Shipping Zone</p>
                    <p className="font-medium">{order.shipping_zone}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Shipping Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">
                        {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shipping_address?.address_line_1}
                        {order.shipping_address?.address_line_2 && (
                          <>, {order.shipping_address.address_line_2}</>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.pincode}
                      </p>
                      <p className="text-sm text-gray-600">{order.shipping_address?.country}</p>
                      {order.shipping_address?.phone && (
                        <p className="text-sm text-gray-600">Phone: {order.shipping_address.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Billing Information
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">
                    {order.billing_address?.first_name} {order.billing_address?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.billing_address?.address_line_1}
                    {order.billing_address?.address_line_2 && (
                      <>, {order.billing_address.address_line_2}</>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.billing_address?.city}, {order.billing_address?.state} {order.billing_address?.pincode}
                  </p>
                  <p className="text-sm text-gray-600">{order.billing_address?.country}</p>
                  {order.billing_address?.phone && (
                    <p className="text-sm text-gray-600">Phone: {order.billing_address.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Order Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.activities?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                      {activity.note && (
                        <p className="text-sm text-gray-600 mt-1">{activity.note}</p>
                      )}
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No activity recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
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
                  {order.user?.email}
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
              <button
                onClick={() => navigate(`/customers/${order.user_id || order.customer_id}`)}
                className="w-full px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                View Customer
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method || 'N/A'}</p>
              </div>
              {order.payment_transaction_id && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-medium text-xs">{order.payment_transaction_id}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${order.payment_status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : order.payment_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                  }
                `}>
                  {order.payment_status || 'Pending'}
                </span>
              </div>
              {order.transaction_id && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm">{order.transaction_id}</p>
                </div>
              )}
              {order.status === 'delivered' && order.payment_status === 'paid' && (
                <button
                  onClick={handleRefund}
                  className="w-full px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Notes
              </h2>
            </div>
            <div className="p-6">
              {order.notes ? (
                <p className="text-sm text-gray-600">{order.notes}</p>
              ) : (
                <p className="text-sm text-gray-500">No notes added</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a note about this status change..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;