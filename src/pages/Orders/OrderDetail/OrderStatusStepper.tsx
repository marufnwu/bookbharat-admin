import React from 'react';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  PackageCheck,
} from 'lucide-react';
import { Card, CardContent, Stepper, Banner } from '../../../components';
import type { OrderStatus } from '../../../features/orders';

/**
 * Order status stepper. Renders the standard 5-step progress for
 * pending → confirmed → processing → shipped → delivered. For terminal
 * states (cancelled / refunded) shows a single-tone Banner instead.
 */

const LIFECYCLE_STEPS = [
  { value: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" /> },
  { value: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="h-4 w-4" /> },
  { value: 'processing', label: 'Processing', icon: <Package className="h-4 w-4" /> },
  { value: 'shipped', label: 'Shipped', icon: <Truck className="h-4 w-4" /> },
  { value: 'delivered', label: 'Delivered', icon: <PackageCheck className="h-4 w-4" /> },
];

const TERMINAL_BANNER = {
  cancelled: {
    tone: 'danger' as const,
    title: 'Order Cancelled',
    description: 'This order has been cancelled and will not ship.',
  },
  refunded: {
    tone: 'neutral' as const,
    title: 'Order Refunded',
    description: 'This order has been fully refunded.',
  },
};

interface Props {
  status: OrderStatus | string;
}

export const OrderStatusStepper: React.FC<Props> = ({ status }) => {
  const terminal = TERMINAL_BANNER[status as keyof typeof TERMINAL_BANNER];

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="px-6 pt-5 pb-2 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Clock className="h-4 w-4" />
          </span>
          Order Progress
        </h2>
        <p className="text-xs text-gray-500 mt-1 ml-9">
          Track the order from placement to delivery.
        </p>
      </div>
      <CardContent className="py-7">
        <div className="sm:hidden">
          <Stepper steps={LIFECYCLE_STEPS} currentValue={status as string} variant="compact" />
        </div>
        <div className="hidden sm:block">
          {terminal ? (
            <Banner tone={terminal.tone} title={terminal.title} description={terminal.description} />
          ) : (
            <Stepper
              steps={LIFECYCLE_STEPS}
              currentValue={status as string}
              ariaLabel="Order lifecycle"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusStepper;