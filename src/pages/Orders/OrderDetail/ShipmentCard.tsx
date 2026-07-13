import React from 'react';
import {
  Package,
  RefreshCw,
  Clock,
  Download,
  FileText,
  ExternalLink,
  Trash2,
  Send,
  MapPin,
  Truck,
  Hash,
  Calendar,
  Weight,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Banner,
  Timeline,
  EmptyState,
  AddressBlock,
  CourierLogoList,
  CopyButton,
  type TimelineItem,
} from '../../../components';
import { formatDate, formatCurrency } from '../../../features/orders';
import { formatWeight } from '../../../utils/weight';

const SHIPMENT_STATUS_TONE: Record<
  string,
  'info' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  pending: 'warning',
  confirmed: 'info',
  pickup_scheduled: 'info',
  picked_up: 'info',
  in_transit: 'warning',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'neutral',
  failed: 'danger',
};

interface Props {
  order: any;
  shipment: any;
  orderId: string;
  /** Refetch handlers from the parent (status update, generate label, cancel). */
  onCancelShipment: () => void;
  onGenerateLabel: () => void;
  /** Prompt to confirm regeneration when an existing label will be overwritten. */
  onRegenerateLabel: () => void;
  onDownloadLabel: () => void;
  onRefetchShipment: () => void;
  isCancelling: boolean;
  isGeneratingLabel: boolean;
  onEditAddress: () => void;
}

/**
 * Shipment card — distinct sub-sections for Status, Tracking, Label,
 * Live Tracking, and Shipping Address. Renders an empty-state with
 * preferred couriers when no shipment exists yet.
 */
export const ShipmentCard: React.FC<Props> = ({
  order,
  shipment,
  orderId,
  onCancelShipment,
  onGenerateLabel,
  onRegenerateLabel,
  onDownloadLabel,
  onRefetchShipment,
  isCancelling,
  isGeneratingLabel,
  onEditAddress,
}) => {
  const navigate = useNavigate();

  if (!shipment) {
    // Allow Create Shipment from any non-terminal status. For pending
    // orders we still want admins (often COD) to be able to start the
    // shipment — the warning banner makes the trade-off explicit.
    const canCreate = !['cancelled', 'refunded', 'delivered'].includes(
      order.status,
    );
    const isPendingOrder = order.status === 'pending';

    return (
      <Card className="overflow-hidden animate-fade-in">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Truck className="h-4 w-4" />
            </span>
            Shipment
          </h2>
        </div>
        <CardContent className="space-y-4">
          {isPendingOrder && (
            <Banner
              tone="warning"
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Order is pending"
              description="This order has not been confirmed yet. Creating a shipment now will book courier capacity before payment is captured — typical for COD."
            />
          )}
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="No shipment created yet"
            description={
              canCreate
                ? 'Create a shipment to start tracking this order.'
                : 'Shipment is not available for this order status.'
            }
            action={
              canCreate ? (
                <Button
                  variant="success"
                  onClick={() => navigate(`/orders/${orderId}/create-shipment`)}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  {isPendingOrder ? 'Create Shipment (pending)' : 'Create Shipment'}
                </Button>
              ) : undefined
            }
          />
          <div className="mt-2 flex justify-center">
            <CourierLogoList order={order} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const tone = SHIPMENT_STATUS_TONE[shipment.status] ?? 'info';
  const trackingEvents: TimelineItem[] =
    shipment.tracking?.events?.map((event: any, index: number) => ({
      id: `evt-${index}`,
      title: event.status || event.activity || event.description,
      description:
        event.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {event.location}
          </span>
        ),
      meta: event.timestamp
        ? formatDate(event.timestamp)
        : event.date
          ? formatDate(event.date)
          : undefined,
    })) ?? [];

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Truck className="h-4 w-4" />
            </span>
            Shipment
          </h2>
          <span className="text-xs text-gray-500 inline-flex items-center gap-1.5">
            <span>Shipment ID:</span>
            <span className="font-mono">#{shipment.id}</span>
            <CopyButton
              value={String(shipment.id)}
              label="Shipment ID"
              successMessage="Shipment ID copied"
              size="xs"
              ariaLabel="Copy shipment ID"
            />
          </span>
        </div>
      </div>

      <CardContent className="space-y-5 pt-5">
        {/* Status banner */}
        <Banner
          tone={tone}
          title={<span className="capitalize">{shipment.status.replace('_', ' ')}</span>}
          action={
            shipment.status !== 'cancelled' &&
            shipment.status !== 'delivered' && (
              <Button
                variant="danger"
                size="sm"
                onClick={onCancelShipment}
                loading={isCancelling}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Cancel
              </Button>
            )
          }
        />

        {/* Tracking block */}
        <div className="rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-primary-700 mb-1.5 flex items-center gap-1.5">
            <Hash className="h-3 w-3" />
            Tracking Number
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-base sm:text-lg font-bold text-primary-900 break-all">
              {shipment.tracking_number}
            </div>
            <CopyButton
              value={shipment.tracking_number}
              label="Tracking number"
              successMessage="Tracking number copied"
              size="md"
              ariaLabel="Copy tracking number"
            />
          </div>
          {shipment.carrier_tracking_id &&
            shipment.carrier_tracking_id !== shipment.tracking_number && (
              <div className="mt-1.5 text-xs text-gray-500 inline-flex items-center gap-1.5">
                <span>
                  Carrier Ref: <span className="font-mono">{shipment.carrier_tracking_id}</span>
                </span>
                <CopyButton
                  value={shipment.carrier_tracking_id}
                  label="Carrier reference"
                  successMessage="Carrier reference copied"
                  size="xs"
                  ariaLabel="Copy carrier reference"
                />
              </div>
            )}
        </div>

        {/* Meta grid */}
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <MetaItem
            icon={<Truck className="h-3.5 w-3.5" />}
            label="Courier"
            value={shipment.carrier?.name || 'N/A'}
          />
          {(shipment.service_name || shipment.service_code) && (
            <MetaItem
              label="Service"
              value={shipment.service_name || shipment.service_code}
            />
          )}
          <MetaItem
            label="Cost"
            value={formatCurrency(shipment.shipping_cost || 0)}
          />
          {shipment.expected_delivery_date && (
            <MetaItem
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Expected"
              value={formatDate(shipment.expected_delivery_date)}
            />
          )}
          {shipment.actual_delivery_date && (
            <MetaItem
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Delivered"
              value={
                <span className="text-success-700 font-medium">
                  {formatDate(shipment.actual_delivery_date)}
                </span>
              }
            />
          )}
          {shipment.weight && (
            <MetaItem
              icon={<Weight className="h-3.5 w-3.5" />}
              label="Weight"
              value={formatWeight(shipment.weight * 1000)}
            />
          )}
        </dl>

        {/* Label actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {shipment.label_url ? (
            <>
              <Button variant="primary" size="sm" onClick={onDownloadLabel} leftIcon={<Download className="h-4 w-4" />} rightIcon={<ExternalLink className="h-3 w-3" />}>
                Download Shipping Label
              </Button>
              {shipment.status !== 'cancelled' &&
                shipment.status !== 'delivered' &&
                shipment.tracking_number && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerateLabel}
                    loading={isGeneratingLabel}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    title="Regenerate the shipping label PDF using the current recipient address. The existing PDF will be replaced."
                  >
                    Regenerate Label
                  </Button>
                )}
            </>
          ) : shipment.status !== 'cancelled' && shipment.status !== 'delivered' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateLabel}
              loading={isGeneratingLabel}
              leftIcon={<FileText className="h-4 w-4" />}
            >
              Generate Shipping Label
            </Button>
          ) : null}
        </div>

        {/* Live tracking */}
        {shipment.tracking && shipment.status !== 'cancelled' && (
          <section className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                Live Tracking
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefetchShipment}
                aria-label="Refresh tracking"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {shipment.tracking.status_description && (
              <Banner
                tone="info"
                description={shipment.tracking.status_description}
                className="mb-4"
              />
            )}

            {trackingEvents.length > 0 ? (
              <div className="max-h-64 overflow-y-auto pr-2 pl-1">
                <Timeline items={trackingEvents} ariaLabel="Shipment tracking events" />
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No tracking events yet</p>
              </div>
            )}
          </section>
        )}

        {/* Shipping address */}
        <section className="pt-2 border-t border-gray-100">
          <AddressBlock
            title="Shipping Address"
            address={order.shipping_address}
            editable
            onEdit={onEditAddress}
          />
        </section>
      </CardContent>
    </Card>
  );
};

interface MetaItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}
const MetaItem: React.FC<MetaItemProps> = ({ label, value, icon }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-1">
      {icon}
      {label}
    </dt>
    <dd className="text-sm font-medium text-gray-900">{value}</dd>
  </div>
);

export default ShipmentCard;