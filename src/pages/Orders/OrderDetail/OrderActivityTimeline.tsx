import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, Timeline, EmptyState, type TimelineItem } from '../../../components';
import { formatDate, getOrderActivities } from '../../../features/orders';

const ACTIVITY_TONE: Record<string, 'info' | 'success' | 'danger' | 'warning' | 'primary' | 'neutral'> = {
  status_change: 'info',
  status_pending: 'neutral',
  shipment_created: 'success',
  shipment_cancelled: 'danger',
  order_created: 'primary',
  payment_update: 'warning',
};

interface Props {
  order: any;
  /**
   * Root-level `timeline[]` returned by the admin GET /orders/{id} endpoint.
   * The Laravel controller returns the status-step array next to `order`
   * (not nested inside it). When omitted, we fall back to any
   * `order.timeline[]` or `order.activities[]`.
   */
  timeline?: any[];
}

/**
 * Renders the order activity timeline.
 *
 * Reads from `getOrderActivities()` which, in order:
 *   1. Prefers `order.activities[]` (rich audit events).
 *   2. Falls back to the root-level `timeline[]` prop (the customer-
 *      facing status steps returned by the admin GET /orders/{id}).
 *   3. Falls back to `order.timeline[]` (in case it is nested).
 */
export const OrderActivityTimeline: React.FC<Props> = ({ order, timeline }) => {
  const activities = getOrderActivities(order, timeline);

  const items: TimelineItem[] = activities.map((activity, index) => ({
    id: activity.id || `activity-${index}`,
    tone: ACTIVITY_TONE[activity.type ?? ''] ?? 'neutral',
    title: activity.description || activity.new_value || activity.type,
    description:
      activity.old_value && activity.new_value ? (
        <span>
          <span className="text-error-600 line-through">{activity.old_value}</span>{' '}
          →{' '}
          <span className="text-success-700 font-medium">{activity.new_value}</span>
        </span>
      ) : null,
    meta:
      activity.created_at ? (
        <span className="inline-flex items-center gap-2">
          <span>{formatDate(activity.created_at)}</span>
          {activity.performed_by && activity.performed_by !== 'System' && (
            <>
              <span className="text-gray-300">•</span>
              <span>by {activity.performed_by}</span>
            </>
          )}
        </span>
      ) : null,
  }));

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Clock className="h-4 w-4" />
          </span>
          Activity Log
        </h2>
      </div>
      <CardContent className="pt-5">
        {items.length > 0 ? (
          <Timeline items={items} ariaLabel="Order activity" />
        ) : (
          <EmptyState
            icon={<Clock className="h-8 w-8" />}
            title="No activity recorded yet"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default OrderActivityTimeline;