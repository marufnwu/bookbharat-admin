import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Banner / Callout — colored info/warning/error/success blocks.
 *
 * Replaces the many one-off `bg-{color}-50 border-{color}-200` divs that
 * were scattered across OrderDetail (override-workflow, transition
 * warning, no-phone, no-shipment empty state, preorder, etc.).
 */

export type BannerTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BannerProps {
  tone?: BannerTone;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Used as a fallback body when no `description` is provided. */
  children?: React.ReactNode;
  icon?: React.ReactNode;
  /** Override the auto-selected icon. */
  hideIcon?: boolean;
  /** Optional action area rendered right-aligned. */
  action?: React.ReactNode;
  className?: string;
  /** Render in a more prominent (filled) style. */
  prominent?: boolean;
  ariaLabel?: string;
}

const toneStyles: Record<
  BannerTone,
  {
    container: string;
    iconWrap: string;
    title: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    iconWrap: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-800',
    Icon: Info,
  },
  success: {
    container: 'bg-green-50 border-green-200',
    iconWrap: 'text-green-600',
    title: 'text-green-900',
    description: 'text-green-800',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    iconWrap: 'text-yellow-600',
    title: 'text-yellow-900',
    description: 'text-yellow-800',
    Icon: AlertTriangle,
  },
  danger: {
    container: 'bg-red-50 border-red-200',
    iconWrap: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-800',
    Icon: AlertCircle,
  },
  neutral: {
    container: 'bg-gray-50 border-gray-200',
    iconWrap: 'text-gray-600',
    title: 'text-gray-900',
    description: 'text-gray-700',
    Icon: Info,
  },
};

export const Banner: React.FC<BannerProps> = ({
  tone = 'info',
  title,
  description,
  children,
  icon,
  hideIcon = false,
  action,
  className,
  prominent = false,
  ariaLabel,
}) => {
  const styles = toneStyles[tone];
  const Icon = styles.Icon;
  const role = tone === 'warning' || tone === 'danger' ? 'alert' : 'status';

  return (
    <div
      role={role}
      aria-live={tone === 'warning' || tone === 'danger' ? 'assertive' : 'polite'}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      className={cn(
        'rounded-lg border p-4 flex items-start gap-3',
        styles.container,
        prominent && 'shadow-sm',
        className,
      )}
    >
      {!hideIcon && (
        <div className={cn('flex-shrink-0 mt-0.5', styles.iconWrap)}>
          {icon ?? <Icon className="h-5 w-5" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && <div className={cn('font-semibold text-sm', styles.title)}>{title}</div>}
        {description && (
          <div className={cn('text-sm mt-1', styles.description)}>{description}</div>
        )}
        {children && (
          <div className={cn('text-sm mt-1', styles.description)}>{children}</div>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

/** Alias for legacy "Callout" naming. */
export const Callout = Banner;

export default Banner;