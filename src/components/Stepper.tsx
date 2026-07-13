import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Stepper — horizontal (desktop) / vertical (mobile) status stepper.
 *
 * Used to visualise the order lifecycle (pending → confirmed → processing →
 * shipped → delivered). For terminal statuses (cancelled / refunded) the
 * consumer should prefer a `<Banner tone="danger">` instead of a Stepper.
 */

export interface StepperStep {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Active step value (must match one of `steps[].value`). */
  currentValue: string;
  /** Whether to render the mobile-collapsed variant. */
  variant?: 'horizontal' | 'compact';
  ariaLabel?: string;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentValue,
  variant = 'horizontal',
  ariaLabel = 'Progress steps',
  className,
}) => {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.value === currentValue),
  );

  if (variant === 'compact') {
    const current = steps[currentIndex];
    return (
      <div
        role="status"
        aria-label={`Current status: ${current?.label}`}
        className={cn(
          'flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/60 px-4 py-3',
          className,
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
          {current?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 capitalize">
            {current?.label}
          </div>
          <div className="text-xs text-gray-500">Current status</div>
        </div>
      </div>
    );
  }

  return (
    <ol
      aria-label={ariaLabel}
      className={cn(
        'flex items-center justify-between min-w-[480px] gap-2',
        className,
      )}
    >
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <React.Fragment key={step.value}>
            <li
              className="flex flex-col items-center min-w-0"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                aria-hidden="true"
                className={cn(
                  'h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive
                    ? isCurrent
                      ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white ring-4 ring-primary-100 shadow-md'
                      : 'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 border border-gray-200',
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" strokeWidth={3} /> : step.icon}
              </div>
              <span
                className={cn(
                  'mt-2.5 text-xs font-medium text-center transition-colors',
                  isCurrent
                    ? 'text-primary-700 font-semibold'
                    : isActive
                      ? 'text-gray-900'
                      : 'text-gray-400',
                )}
              >
                {step.label}
              </span>
            </li>
            {index < steps.length - 1 && (
              <li
                aria-hidden="true"
                className={cn(
                  'flex-1 h-1 mx-1 rounded-full transition-all duration-300',
                  index < currentIndex
                    ? 'bg-gradient-to-r from-success-400 to-success-500'
                    : 'bg-gray-200',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
};

export default Stepper;