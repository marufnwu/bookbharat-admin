import React from 'react';
import { cn } from '../utils/cn';
import {
  PREFERRED_COURIER_META,
  getPreferredCouriers,
  type CourierMeta,
} from '../features/orders';

/**
 * CourierLogo — render the courier badge (logo + name + colored background).
 * Falls back gracefully if the logo image fails to load.
 */

export interface CourierLogoProps {
  code: string;
  size?: 'sm' | 'md';
  className?: string;
}

function resolveMeta(code: string): CourierMeta | null {
  return PREFERRED_COURIER_META[code] ?? null;
}

export const CourierLogo: React.FC<CourierLogoProps> = ({
  code,
  size = 'md',
  className,
}) => {
  const meta = resolveMeta(code);
  if (!meta) return null;

  const sizes =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border',
        meta.bg,
        meta.text,
        meta.border,
        sizes,
        className,
      )}
    >
      <img
        src={meta.logo}
        alt={`${meta.name} logo`}
        className={cn(
          'object-contain flex-shrink-0',
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
        )}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      {meta.name}
    </span>
  );
};

export interface CourierLogoListProps {
  order: any;
  className?: string;
}

export const CourierLogoList: React.FC<CourierLogoListProps> = ({
  order,
  className,
}) => {
  const codes = getPreferredCouriers(order);
  if (!codes.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {codes
        .filter((code) => PREFERRED_COURIER_META[code])
        .map((code) => (
          <CourierLogo key={code} code={code} />
        ))}
    </div>
  );
};

export default CourierLogo;