import React from 'react';
import {
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../components';
import { Order } from '../../types';
import { Link } from 'react-router-dom';

interface MobileActionBarProps {
  order: Order | null;
  onStatusChange: (id: number, status: string) => void;
  isLoading?: boolean;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  order,
  onStatusChange,
  isLoading = false,
}) => {
  if (!order) return null;

  const getActions = () => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Process', icon: CheckIcon, status: 'processing', variant: 'primary' as const },
          { label: 'Cancel', icon: XMarkIcon, status: 'cancelled', variant: 'danger' as const },
        ];
      case 'processing':
        return [
          { label: 'Ship', icon: TruckIcon, status: 'shipped', variant: 'primary' as const },
          { label: 'Cancel', icon: XMarkIcon, status: 'cancelled', variant: 'danger' as const },
        ];
      case 'shipped':
        return [
          { label: 'Delivered', icon: CheckCircleIcon, status: 'delivered', variant: 'success' as const },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  if (actions.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Order info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            #{(order as any).order_number || order.id}
          </p>
          <p className="text-xs text-gray-500 capitalize">{order.status}</p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Link to={`/orders/${order.id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          {actions.map((action) => (
            <Button
              key={action.status}
              variant={action.variant}
              size="sm"
              onClick={() => onStatusChange(order.id, action.status)}
              disabled={isLoading}
            >
              <action.icon className="h-4 w-4 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
