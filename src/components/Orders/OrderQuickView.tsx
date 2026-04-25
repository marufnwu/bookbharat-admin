import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  XMarkIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Drawer } from '../../components/Drawer';
import { Button, Badge, LoadingSpinner } from '../../components';
import { ordersApi } from '../../api';
import { Order } from '../../types';
import { format } from 'date-fns';
import { InlineStatusDropdown } from './InlineStatusDropdown';

interface OrderQuickViewProps {
  orderId: number | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: ClockIcon,
  processing: ArrowPathIcon,
  shipped: TruckIcon,
  delivered: CheckCircleIcon,
  cancelled: XCircleIcon,
  refunded: CurrencyDollarIcon,
};

export const OrderQuickView: React.FC<OrderQuickViewProps> = ({
  orderId,
  open,
  onClose,
  onStatusChange,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
}) => {
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order-quick-view', orderId],
    queryFn: () => ordersApi.getOrder(orderId!),
    enabled: !!orderId && open,
    staleTime: 30000,
  });

  const order = (orderData as any)?.order || (orderData as any)?.data || orderData as Order | undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status] || ClockIcon;
    return <Icon className="w-4 h-4" />;
  };

  // Footer actions based on status
  const getFooterActions = () => {
    if (!order) return null;
    const actions = [];

    actions.push(
      <Link key="view" to={`/orders/${order.id}`} onClick={onClose}>
        <Button variant="outline" size="sm">
          <EyeIcon className="h-4 w-4 mr-1" />
          Full Details
        </Button>
      </Link>
    );

    return actions;
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      position="right"
      width="w-[480px]"
      title={order ? `Order #${(order as any).order_number || order.id}` : 'Order Details'}
      footer={getFooterActions()}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      ) : !order ? (
        <div className="text-center py-12 text-gray-500">
          Order not found
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(order.status)}
                <InlineStatusDropdown
                  currentStatus={order.status}
                  onStatusChange={(status) => onStatusChange(order.id, status)}
                />
              </div>
              <p className="text-sm text-gray-500">
                {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy HH:mm') : '-'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount || 0)}</p>
              <Badge variant={order.payment_status === 'paid' ? 'success' : order.payment_status === 'failed' ? 'error' : 'warning'} size="sm">
                {order.payment_status || 'pending'}
              </Badge>
            </div>
          </div>

          {/* Preorder Indicator */}
          {order.is_preorder && (
            <div className="border-t border-purple-100 pt-4">
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Preorder</p>
                  {order.release_date && (
                    <p className="text-xs text-purple-700">
                      Releases on {format(new Date(order.release_date), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation arrows */}
          {(hasPrev || hasNext) && (
            <div className="flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={!hasPrev}
                onClick={onNavigatePrev}
              >
                ← Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!hasNext}
                onClick={onNavigateNext}
              >
                Next →
              </Button>
            </div>
          )}

          {/* Customer Info */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-medium">
                  {(order.user?.name || 'G')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.user?.name || 'Guest'}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {order.user?.email && (
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="w-3 h-3" />
                        {order.user.email}
                      </span>
                    )}
                    {order.user?.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3" />
                        {order.user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Items ({(order as any).items?.length || (order as any).order_items?.length || 0})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {((order as any).items || (order as any).order_items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 py-2">
                  {item.product?.image || item.image ? (
                    <img
                      src={item.product?.image || item.image}
                      alt={item.product?.name || item.name}
                      className="w-10 h-10 object-cover rounded border border-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      N/A
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product?.name || item.name}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency((order as any).subtotal || order.total_amount || 0)}</span>
              </div>
              {(order as any).shipping_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">{formatCurrency((order as any).shipping_amount)}</span>
                </div>
              )}
              {(order as any).discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-{formatCurrency((order as any).discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid</span>
                <span className={`font-medium ${(order as any).paid_amount >= order.total_amount ? 'text-green-600' : 'text-blue-600'}`}>
                  {formatCurrency((order as any).paid_amount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {(order as any).is_cod || order.payment_method === 'cod' ? 'COD' : (order.payment_method || 'Online')}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {(order as any).shipping_address && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                Shipping Address
              </h4>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">
                  {(order as any).shipping_address.name || (order as any).shipping_address.first_name} {(order as any).shipping_address.last_name || ''}
                </p>
                <p>{(order as any).shipping_address.address || (order as any).shipping_address.line1}</p>
                <p>
                  {[(order as any).shipping_address.city, (order as any).shipping_address.state, (order as any).shipping_address.pincode || (order as any).shipping_address.zip].filter(Boolean).join(', ')}
                </p>
                {(order as any).shipping_address.phone && (
                  <p className="mt-1 flex items-center gap-1">
                    <PhoneIcon className="w-3 h-3" />
                    {(order as any).shipping_address.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Shipment Tracking */}
          {(order as any).tracking_number && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                <TruckIcon className="w-4 h-4" />
                Shipment
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Carrier</span>
                  <span>{(order as any).carrier || (order as any).shipping_carrier || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{(order as any).tracking_number}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};
