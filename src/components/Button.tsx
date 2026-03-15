import React from 'react';
import { cn } from '../utils/cn';

// Button variants using cva-like pattern
const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800 disabled:bg-primary-400',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 active:bg-gray-300 disabled:bg-gray-50 disabled:text-gray-400',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 active:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400',
  ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500 disabled:text-gray-300',
  danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 active:bg-error-800 disabled:bg-error-400',
  success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 active:bg-success-800 disabled:bg-success-400',
  warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500 active:bg-warning-800 disabled:bg-warning-400',
  info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 disabled:bg-blue-400',
};

const buttonSizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2',
  icon: 'h-10 w-10 p-0 rounded-lg flex items-center justify-center',
  'icon-sm': 'h-8 w-8 p-0 rounded-md flex items-center justify-center',
  'icon-lg': 'h-12 w-12 p-0 rounded-lg flex items-center justify-center',
};

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200',
          // Variant styles
          buttonVariants[variant],
          // Size styles
          buttonSizes[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {/* For icon buttons, render children directly without span wrapper. For regular buttons, render children directly to allow gap to work properly. */}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Icon Button component for convenience
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'ghost', size = 'icon', className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={className}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button Group component
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;
        
        return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
          className: cn(
            (child as React.ReactElement<{ className?: string }>).props.className,
            !isFirst && orientation === 'horizontal' && '-ml-px',
            !isFirst && orientation === 'vertical' && '-mt-px',
            isFirst && orientation === 'horizontal' && 'rounded-r-none',
            isLast && orientation === 'horizontal' && 'rounded-l-none',
            !isFirst && !isLast && orientation === 'horizontal' && 'rounded-none',
            isFirst && orientation === 'vertical' && 'rounded-b-none',
            isLast && orientation === 'vertical' && 'rounded-t-none',
            !isFirst && !isLast && orientation === 'vertical' && 'rounded-none'
          ),
        });
      })}
    </div>
  );
};

export default Button;