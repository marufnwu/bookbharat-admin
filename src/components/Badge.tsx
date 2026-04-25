import React from 'react';
import { cn } from '../utils/cn';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Badge variants
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'destructive' | 'info' | 'outline' | 'purple';
type BadgeSize = 'sm' | 'md' | 'lg';

const badgeVariants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-gray-200 text-gray-800',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  destructive: 'bg-error-100 text-error-700', // alias for error
  info: 'bg-blue-100 text-blue-700',
  outline: 'bg-transparent border border-gray-300 text-gray-700',
  purple: 'bg-purple-100 text-purple-700',
};

const badgeSizes = {
  sm: 'text-2xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      removable = false,
      onRemove,
      icon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'success' && 'bg-success-500',
              variant === 'warning' && 'bg-warning-500',
              variant === 'error' && 'bg-error-500',
              variant === 'primary' && 'bg-primary-500',
              variant === 'info' && 'bg-blue-500',
              variant === 'default' && 'bg-gray-500'
            )}
          />
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 ml-0.5 hover:opacity-70 transition-opacity"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge - for showing status with dot indicator
export interface StatusBadgeProps extends Omit<BadgeProps, 'dot' | 'variant' | 'children'> {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning' | 'info' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'paid' | 'failed' | 'default';
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    error: { variant: 'error', label: 'Error' },
    success: { variant: 'success', label: 'Success' },
    warning: { variant: 'warning', label: 'Warning' },
    info: { variant: 'info', label: 'Info' },
    confirmed: { variant: 'info', label: 'Confirmed' },
    processing: { variant: 'primary', label: 'Processing' },
    shipped: { variant: 'primary', label: 'Shipped' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    refunded: { variant: 'default', label: 'Refunded' },
    paid: { variant: 'success', label: 'Paid' },
    failed: { variant: 'error', label: 'Failed' },
    default: { variant: 'default', label: 'Unknown' },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <Badge variant={config.variant} dot {...props}>
      {props.children || config.label}
    </Badge>
  );
};

// Count Badge - for notification counts
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  variant = 'error',
  size = 'sm',
  className,
  ...props
}) => {
  if (count === 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <Badge
      variant={variant}
      size={size}
      className={cn('min-w-[1.25rem] justify-center', className)}
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

// Dot Badge - simple indicator dot
export interface DotBadgeProps {
  color?: 'primary' | 'success' | 'warning' | 'error' | 'gray';
  pulse?: boolean;
  className?: string;
}

export const DotBadge: React.FC<DotBadgeProps> = ({
  color = 'primary',
  pulse = false,
  className,
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    gray: 'bg-gray-400',
  };

  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            colorClasses[color]
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          colorClasses[color]
        )}
      />
    </span>
  );
};

export default Badge;