import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Truck } from 'lucide-react';
import {
  Modal,
  Button,
  Select,
  Input,
  Textarea,
  Checkbox,
  Banner,
} from '../../../components';
import { ORDER_STATUSES, isValidTransition } from '../../../features/orders';
import { api } from '../../../api/axios';
import type { OrderStatus } from '../../../features/orders';

interface Props {
  open: boolean;
  onClose: () => void;
  order: any;
  initialStatus?: string;
  onUpdateStatus: (params: {
    status: string;
    note: string;
    overrideWorkflow: boolean;
    tracking?: {
      tracking_number: string;
      carrier_id: string;
      carrier_reference?: string;
      shipping_cost?: number;
      notes?: string;
    };
  }) => void;
  onManualShip: (params: {
    tracking_number: string;
    carrier_id: string;
    carrier_reference?: string;
    shipping_cost?: number;
    notes?: string;
  }) => void;
  isPending: boolean;
}

const STATUS_META: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    tone: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: <span className="h-2 w-2 rounded-full bg-yellow-500" />,
  },
  confirmed: {
    label: 'Confirmed',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  processing: {
    label: 'Processing',
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: <span className="h-2 w-2 rounded-full bg-indigo-500" />,
  },
  shipped: {
    label: 'Shipped',
    tone: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <Truck className="h-3 w-3" />,
  },
  delivered: {
    label: 'Delivered',
    tone: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'bg-red-50 text-red-700 border-red-200',
    icon: <span className="h-2 w-2 rounded-full bg-red-500" />,
  },
  refunded: {
    label: 'Refunded',
    tone: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <span className="h-2 w-2 rounded-full bg-gray-500" />,
  },
};

const STATUS_OPTIONS = ORDER_STATUSES.map((v) => ({
  value: v,
  label: STATUS_META[v].label,
}));

/**
 * Modal for updating an order's status. Includes a "Ship" sub-form when
 * the new status is `shipped` (carrier + tracking + cost), and an override
 * checkbox to skip the workflow validator.
 */
export const StatusUpdateModal: React.FC<Props> = ({
  open,
  onClose,
  order,
  initialStatus,
  onUpdateStatus,
  onManualShip,
  isPending,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus ?? order?.status ?? '');
  const [statusNote, setStatusNote] = useState('');
  const [overrideWorkflow, setOverrideWorkflow] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [carrierReference, setCarrierReference] = useState('');
  const [shippingCost, setShippingCost] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedStatus(initialStatus ?? order?.status ?? '');
      setStatusNote('');
      setOverrideWorkflow(false);
      setTrackingNumber('');
      setCarrierId('');
      setCarrierReference('');
      setShippingCost('');
    }
  }, [open, initialStatus, order?.status]);

  const { data: carriersData } = useQuery({
    queryKey: ['shipping-carriers'],
    queryFn: () => api.get('/shipping/multi-carrier/carriers').then((res) => res.data),
    enabled: open && selectedStatus === 'shipped',
  });
  const carriers = carriersData?.data || carriersData?.carriers || [];

  const isTransition = selectedStatus && order?.status && selectedStatus !== order.status;
  const validTransition = isValidTransition(order?.status as OrderStatus, selectedStatus);

  const handleSubmit = () => {
    if (!selectedStatus) return;

    if (selectedStatus === 'shipped' && trackingNumber) {
      if (!carrierId) return;
      onManualShip({
        tracking_number: trackingNumber,
        carrier_id: carrierId,
        carrier_reference: carrierReference || undefined,
        shipping_cost: shippingCost ? parseFloat(shippingCost) : undefined,
        notes: statusNote || undefined,
      });
      return;
    }

    onUpdateStatus({ status: selectedStatus, note: statusNote, overrideWorkflow });
  };

  const currentMeta = STATUS_META[order?.status] ?? STATUS_META.pending;
  const targetMeta = STATUS_META[selectedStatus] ?? STATUS_META.pending;

  return (
    <Modal open={open} onClose={onClose} title="Update Order Status" size="md">
      <div className="space-y-5">
        {/* Current → Target visualisation */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Transition</div>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${currentMeta.tone}`}
            >
              {currentMeta.icon}
              <span className="capitalize">{order?.status}</span>
            </span>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${targetMeta.tone}`}
            >
              {targetMeta.icon}
              <span className="capitalize">{selectedStatus}</span>
            </span>
          </div>
        </div>

        <Select
          label="New Status"
          required
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={STATUS_OPTIONS}
        />

        {selectedStatus === 'shipped' && (
          <section className="rounded-xl border border-primary-200 bg-primary-50/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-primary-900 flex items-center gap-1.5">
              <Truck className="h-4 w-4" />
              Shipment Details
            </h4>
            <Select
              label="Carrier"
              required
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              placeholder="Select carrier"
              options={carriers.map((c: any) => ({
                value: String(c.id),
                label: c.name || c.display_name,
              }))}
            />
            <Input
              label="Tracking Number"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Carrier Reference"
                value={carrierReference}
                onChange={(e) => setCarrierReference(e.target.value)}
                helper="Optional"
                placeholder="Optional"
              />
              <Input
                label="Shipping Cost"
                type="number"
                inputSize="md"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </section>
        )}

        <Textarea
          label="Note (Optional)"
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          placeholder="Add a note about this status change..."
          rows={3}
        />

        <Banner tone="warning" title="Override Workflow Rules">
          <div className="flex items-start gap-3 mt-2">
            <Checkbox
              checked={overrideWorkflow}
              onCheckedChange={setOverrideWorkflow}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-warning-900">
                Enable to skip normal workflow restrictions
              </span>
              <p className="text-xs text-warning-800 mt-1">
                Use with caution — this may bypass validation checks.
              </p>
            </div>
          </div>
        </Banner>

        {isTransition && !validTransition && !overrideWorkflow && (
          <Banner
            tone="danger"
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Status Transition Warning"
            description={
              <span>
                Changing from <strong className="capitalize">{order.status}</strong> to{' '}
                <strong className="capitalize">{selectedStatus}</strong> may not follow the normal
                workflow. Enable "Override Workflow Rules" to proceed.
              </span>
            }
          />
        )}
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button variant="outline" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          loading={isPending}
          disabled={!validTransition && !overrideWorkflow}
        >
          Update Status
        </Button>
      </div>
    </Modal>
  );
};

export default StatusUpdateModal;