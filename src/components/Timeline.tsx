import React from 'react';
import { cn } from '../utils/cn';

/**
 * Timeline — vertical list of dated events with a colored dot + connector.
 *
 * Used for: order activity, shipment live tracking, internal-note timeline.
 * Replaces three hand-rolled `<div class="flex items-start gap-3">` blocks
 * that were scattered across OrderDetail.tsx.
 */

export type TimelineTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary';

export interface TimelineItem {
  /** Stable id (preferred) or unique key. */
  id?: React.Key;
  /** Optional icon. If absent, a colored dot is rendered. */
  icon?: React.ReactNode;
  /** Visual tone of the dot / connector. */
  tone?: TimelineTone;
  /** Primary line (e.g. activity description). */
  title: React.ReactNode;
  /** Secondary line(s) (e.g. location, before→after). */
  description?: React.ReactNode;
  /** Timestamp/footer line. */
  meta?: React.ReactNode;
  /** Optional right-aligned element. */
  right?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Render an empty-state placeholder when no items. */
  emptyState?: React.ReactNode;
  /** Optional aria-label for the list. */
  ariaLabel?: string;
  className?: string;
}

const toneClasses: Record<TimelineTone, { dot: string; line: string }> = {
  neutral: { dot: 'bg-gray-400', line: 'bg-gray-200' },
  primary: { dot: 'bg-blue-500', line: 'bg-gray-200' },
  info: { dot: 'bg-blue-500', line: 'bg-gray-200' },
  success: { dot: 'bg-green-500', line: 'bg-gray-200' },
  warning: { dot: 'bg-yellow-500', line: 'bg-gray-200' },
  danger: { dot: 'bg-red-500', line: 'bg-gray-200' },
};

export const Timeline: React.FC<TimelineProps> = ({
  items,
  emptyState,
  ariaLabel = 'Timeline',
  className,
}) => {
  if (!items || items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <ol
      aria-label={ariaLabel}
      className={cn('space-y-4', className)}
    >
      {items.map((item, index) => {
        const tone = item.tone || 'neutral';
        const isLast = index === items.length - 1;
        const colors = toneClasses[tone];
        return (
          <li key={item.id ?? index} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1.5">
              {item.icon ? (
                <div className="flex-shrink-0">{item.icon}</div>
              ) : (
                <div
                  aria-hidden="true"
                  className={cn('h-2.5 w-2.5 rounded-full', colors.dot)}
                />
              )}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn('mt-1 w-px flex-1 min-h-[16px]', colors.line)}
                />
              )}
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  {item.description && (
                    <div className="mt-0.5 text-xs text-gray-600">{item.description}</div>
                  )}
                  {item.meta && (
                    <div className="mt-1 text-xs text-gray-400">{item.meta}</div>
                  )}
                </div>
                {item.right && <div className="flex-shrink-0">{item.right}</div>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default Timeline;