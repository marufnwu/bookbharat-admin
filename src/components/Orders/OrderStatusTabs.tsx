import React from 'react';
import { cn } from '../../utils/cn';

interface StatusTab {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface OrderStatusTabsProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  stats: {
    total_orders: number;
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    refunded_orders?: number;
    unshipped_prepaid?: number;
    unshipped_cod?: number;
    preorder_orders?: number;
  } | undefined;
}

const tabs: { key: string; label: string; color: string; statsKey: string }[] = [
  { key: '', label: 'All', color: 'gray', statsKey: 'total_orders' },
  { key: 'pending', label: 'Pending', color: 'yellow', statsKey: 'pending_orders' },
  { key: 'processing', label: 'Processing', color: 'indigo', statsKey: 'processing_orders' },
  { key: 'unshipped_prepaid', label: 'Prepaid Unshipped', color: 'blue', statsKey: 'unshipped_prepaid' },
  { key: 'unshipped_cod', label: 'COD Unshipped', color: 'orange', statsKey: 'unshipped_cod' },
  { key: 'preorder', label: 'Preorders', color: 'violet', statsKey: 'preorder_orders' },
  { key: 'shipped', label: 'Shipped', color: 'purple', statsKey: 'shipped_orders' },
  { key: 'delivered', label: 'Delivered', color: 'green', statsKey: 'delivered_orders' },
  { key: 'cancelled', label: 'Cancelled', color: 'red', statsKey: 'cancelled_orders' },
];

const colorClasses: Record<string, { active: string; text: string; badge: string }> = {
  gray: { active: 'border-gray-500 text-gray-700', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' },
  yellow: { active: 'border-yellow-500 text-yellow-700', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  indigo: { active: 'border-indigo-500 text-indigo-700', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  blue: { active: 'border-blue-500 text-blue-700', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  orange: { active: 'border-orange-500 text-orange-700', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  violet: { active: 'border-violet-500 text-violet-700', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  purple: { active: 'border-purple-500 text-purple-700', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  green: { active: 'border-green-500 text-green-700', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  red: { active: 'border-red-500 text-red-700', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
};

export const OrderStatusTabs: React.FC<OrderStatusTabsProps> = ({
  activeStatus,
  onStatusChange,
  stats,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex overflow-x-auto scrollbar-hide -mb-px">
        {tabs.map((tab) => {
          const count = stats?.[tab.statsKey as keyof typeof stats] ?? 0;
          const isActive = activeStatus === tab.key;
          const colors = colorClasses[tab.color];

          return (
            <button
              key={tab.key}
              onClick={() => onStatusChange(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0',
                isActive
                  ? cn(colors.active, 'border-b-2')
                  : cn('border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-semibold',
                  isActive ? colors.badge : 'bg-gray-100 text-gray-600'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
