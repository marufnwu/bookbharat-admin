import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  ClipboardList,
  Send,
  Trash2,
  Edit,
  MessageSquare,
  MoreVertical,
  Calendar,
  Hash,
  User,
} from 'lucide-react';
import { Button, StatusBadge, CopyButton } from '../../../components';
import { getOrderPhone, formatCurrency, getOrderTotalAmount } from '../../../features/orders';

interface Props {
  order: any;
  shipment: any;
  orderId: string;
  onPrint: () => void;
  onDownloadInvoice: () => void;
  onDownloadPackingSlip: () => void;
  onCancelShipment: () => void;
  onOpenStatusModal: () => void;
  onOpenWhatsApp: () => void;
  isCancelling: boolean;
}

const STATUS_TINT: Record<string, { bg: string; ring: string }> = {
  pending: { bg: 'from-yellow-50 to-amber-50', ring: 'ring-yellow-200' },
  confirmed: { bg: 'from-blue-50 to-indigo-50', ring: 'ring-blue-200' },
  processing: { bg: 'from-indigo-50 to-purple-50', ring: 'ring-indigo-200' },
  shipped: { bg: 'from-purple-50 to-fuchsia-50', ring: 'ring-purple-200' },
  delivered: { bg: 'from-green-50 to-emerald-50', ring: 'ring-green-200' },
  cancelled: { bg: 'from-red-50 to-rose-50', ring: 'ring-red-200' },
  refunded: { bg: 'from-gray-50 to-slate-50', ring: 'ring-gray-200' },
};

/**
 * Hero header card + dedicated actions toolbar.
 *
 * The hero shows order #, big status pill, placed date, customer and
 * grand total — the "what is this order at a glance" summary admins need
 * first. Actions are moved to a separate, calmer toolbar row below so the
 * hero isn't visually crowded.
 */
export const OrderHeader: React.FC<Props> = ({
  order,
  shipment,
  orderId,
  onPrint,
  onDownloadInvoice,
  onDownloadPackingSlip,
  onCancelShipment,
  onOpenStatusModal,
  onOpenWhatsApp,
  isCancelling,
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowActions(false);
    }
    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showActions]);

  // Allow admins to start a shipment from any non-terminal status,
  // including `pending` (useful for COD). The Create Shipment page
  // itself decides what's required server-side.
  const canCreateShipment =
    !shipment &&
    !['cancelled', 'refunded', 'delivered'].includes(order.status);
  const isPendingOrder = order.status === 'pending';
  const canRecreateShipment = shipment && shipment.status === 'cancelled';
  const canCancelShipment =
    shipment && shipment.status !== 'cancelled' && shipment.status !== 'delivered';
  const canUpdateStatus = order.status !== 'refunded' && order.status !== 'cancelled';
  const hasPhone = Boolean(getOrderPhone(order));

  const tint = STATUS_TINT[order.status] ?? STATUS_TINT.pending;
  const itemCount = order.order_items?.length ?? order.items?.length ?? 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero card */}
      <section
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tint.bg} ring-1 ${tint.ring} px-5 py-5 sm:px-7 sm:py-6 shadow-card print:shadow-none print:ring-0 print:bg-white`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: title block */}
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2 transition-colors print:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Orders
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Order #{order.order_number}
              </h1>
              <StatusBadge status={order.status as any} className="text-sm" />
              <CopyButton
                value={order.order_number}
                label="Order number"
                successMessage="Order number copied"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Placed{' '}
                {new Date(order.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                <CopyButton
                  value={order.id ? `#${order.order_number}` : ''}
                  label="Order reference"
                  successMessage="Order reference copied"
                  size="xs"
                  ariaLabel="Copy order reference"
                />
              </span>
              {(order.user?.first_name || order.user?.name) && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {`${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() ||
                    order.user?.name}
                  <CopyButton
                    value={
                      `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() ||
                      order.user?.name ||
                      ''
                    }
                    label="Customer name"
                    successMessage="Customer name copied"
                    size="xs"
                    ariaLabel="Copy customer name"
                  />
                </span>
              )}
              {order.user?.id && (
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Customer</span>
                  <span className="font-mono">#{order.user.id}</span>
                  <CopyButton
                    value={String(order.user.id)}
                    label="Customer ID"
                    successMessage="Customer ID copied"
                    size="xs"
                    ariaLabel="Copy customer ID"
                  />
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-mono">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(getOrderTotalAmount(order))}</span>
                <CopyButton
                  value={formatCurrency(getOrderTotalAmount(order))}
                  label="Order total"
                  successMessage="Order total copied"
                  size="xs"
                  ariaLabel="Copy order total"
                />
              </span>
            </div>
          </div>

          {/* Right: big action */}
          {canUpdateStatus && (
            <div className="hidden sm:flex flex-col items-end gap-1.5">
              <Button
                variant="primary"
                onClick={onOpenStatusModal}
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Update Status
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Actions toolbar */}
      <section className="flex flex-wrap items-center gap-2 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          leftIcon={<Printer className="h-4 w-4" />}
        >
          Print
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadInvoice}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Invoice
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadPackingSlip}
          leftIcon={<ClipboardList className="h-4 w-4" />}
        >
          Packing Slip
        </Button>

        <span className="mx-1 h-5 w-px bg-gray-200 hidden sm:inline-block" />

        {isPendingOrder && canCreateShipment && (
          <span
            className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-warning-700 bg-warning-50 border border-warning-200 px-2 py-1 rounded-full"
            title="Order is pending — shipment will be created before payment confirmation"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />
            Pending payment
          </span>
        )}

        {canCreateShipment && (
          <Button
            variant="success"
            size="sm"
            onClick={() => navigate(`/orders/${orderId}/create-shipment`)}
            leftIcon={<Send className="h-4 w-4" />}
            title={
              isPendingOrder
                ? 'Order is pending — shipment will be created before payment confirmation'
                : undefined
            }
          >
            {isPendingOrder ? 'Create Shipment (pending)' : 'Create Shipment'}
          </Button>
        )}
        {canRecreateShipment && (
          <Button
            variant="warning"
            size="sm"
            onClick={() => navigate(`/orders/${orderId}/create-shipment`)}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Create New Shipment
          </Button>
        )}
        {canCancelShipment && (
          <Button
            variant="danger"
            size="sm"
            onClick={onCancelShipment}
            loading={isCancelling}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Cancel Shipment
          </Button>
        )}
        {hasPhone && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenWhatsApp}
            className="text-green-700 border-green-200 hover:bg-green-50"
            leftIcon={<MessageSquare className="h-4 w-4" />}
          >
            WhatsApp
          </Button>
        )}

        {/* Mobile overflow */}
        <div className="ml-auto lg:hidden relative" ref={menuRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActions((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showActions}
          >
            More <MoreVertical className="h-4 w-4 ml-1" />
          </Button>
          {showActions && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            >
              {canUpdateStatus && (
                <MenuItem
                  onClick={() => {
                    onOpenStatusModal();
                    setShowActions(false);
                  }}
                  icon={<Edit className="h-4 w-4" />}
                  label="Update Status"
                  tone="info"
                />
              )}
              {canCreateShipment && (
                <MenuItem
                  onClick={() => {
                    navigate(`/orders/${orderId}/create-shipment`);
                    setShowActions(false);
                  }}
                  icon={<Send className="h-4 w-4" />}
                  label={isPendingOrder ? 'Create Shipment (pending)' : 'Create Shipment'}
                  tone="success"
                />
              )}
              {canCancelShipment && (
                <MenuItem
                  onClick={() => {
                    onCancelShipment();
                    setShowActions(false);
                  }}
                  icon={<Trash2 className="h-4 w-4" />}
                  label="Cancel Shipment"
                  tone="danger"
                />
              )}
              {hasPhone && (
                <MenuItem
                  onClick={() => {
                    onOpenWhatsApp();
                    setShowActions(false);
                  }}
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Send WhatsApp"
                  tone="success"
                />
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface MenuItemProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone?: 'success' | 'danger' | 'info';
}
const MenuItem: React.FC<MenuItemProps> = ({ onClick, icon, label, tone }) => {
  const toneClass =
    tone === 'success'
      ? 'text-green-600'
      : tone === 'danger'
        ? 'text-red-600'
        : tone === 'info'
          ? 'text-blue-600'
          : 'text-gray-700';
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${toneClass}`}
    >
      {icon}
      {label}
    </button>
  );
};

export default OrderHeader;