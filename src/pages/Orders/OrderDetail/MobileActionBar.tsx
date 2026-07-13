import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Printer,
  Send,
  CheckCircle,
  Edit,
} from 'lucide-react';
import { Button } from '../../../components';

interface Props {
  order: any;
  shipment: any;
  orderId: string;
  onPrint: () => void;
  onQuickStatusUpdate: (status: string) => void;
  onOpenStatusModal: () => void;
}

/**
 * Fixed bottom action bar visible only on mobile (<lg). Shows status-aware
 * primary action plus a "Print" shortcut and a manual edit button.
 *
 * Uses iOS safe-area-inset-bottom via Tailwind's `pb-[env(safe-area-inset-bottom)]`.
 */
export const MobileActionBar: React.FC<Props> = ({
  order,
  shipment,
  orderId,
  onPrint,
  onQuickStatusUpdate,
  onOpenStatusModal,
}) => {
  const navigate = useNavigate();

  if (order.status === 'refunded' || order.status === 'cancelled') return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>

        {order.status === 'pending' && (
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onQuickStatusUpdate('processing')}
          >
            Process
          </Button>
        )}

        {order.status === 'processing' && !shipment && (
          <Button
            variant="success"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/orders/${orderId}/create-shipment`)}
          >
            <Send className="h-4 w-4 mr-1" /> Ship
          </Button>
        )}

        {order.status === 'shipped' && (
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onQuickStatusUpdate('delivered')}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> Delivered
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenStatusModal}
          aria-label="Edit status"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MobileActionBar;