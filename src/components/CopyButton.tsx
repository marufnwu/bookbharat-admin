import React, { useCallback, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from '../utils/toast';

export type CopyButtonSize = 'xs' | 'sm' | 'md';

export interface CopyButtonProps {
  /** Text to copy to the clipboard. */
  value: string;
  /** Optional label; defaults to "Copy". */
  label?: string;
  /** Optional success message override; defaults to "{label} copied". */
  successMessage?: string;
  /** Show as an icon-only button (default) or with text. */
  variant?: 'icon' | 'inline';
  size?: CopyButtonSize;
  /** Disable the button. */
  disabled?: boolean;
  /** Optional className passthrough. */
  className?: string;
  /** Accessible label override (defaults to "{label} {value}"). */
  ariaLabel?: string;
}

const sizeClasses: Record<CopyButtonSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
};

const iconSizes: Record<CopyButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

/**
 * Copy-to-clipboard button with visual feedback (icon swaps to a check
 * for ~1.5s after a successful copy) and a toast notification.
 *
 * Handles the non-secure-context fallback (execCommand) so the button
 * keeps working in older browsers / http previews.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label = 'Copy',
  successMessage,
  variant = 'icon',
  size = 'sm',
  disabled = false,
  className,
  ariaLabel,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!value) return;
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === 'function'
        ) {
          await navigator.clipboard.writeText(value);
        } else if (typeof document !== 'undefined') {
          // Fallback for non-secure contexts (older browsers, http previews)
          const textarea = document.createElement('textarea');
          textarea.value = value;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setCopied(true);
        toast.success(successMessage ?? `${label} copied`);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        toast.error('Could not copy to clipboard');
      }
    },
    [value, label, successMessage],
  );

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled || !value}
        aria-label={ariaLabel ?? `${label} ${value}`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium',
          'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          className,
        )}
      >
        {copied ? (
          <Check className={cn(iconSizes[size], 'text-success-600')} aria-hidden="true" />
        ) : (
          <Copy className={iconSizes[size]} aria-hidden="true" />
        )}
        <span>{copied ? 'Copied' : label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !value}
      aria-label={ariaLabel ?? `${label} ${value}`}
      title={`${label} ${value}`}
      className={cn(
        'inline-flex items-center justify-center rounded-md border border-gray-200 bg-white',
        'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors',
        sizeClasses[size],
        className,
      )}
    >
      {copied ? (
        <Check className={cn(iconSizes[size], 'text-success-600')} aria-hidden="true" />
      ) : (
        <Copy className={iconSizes[size]} aria-hidden="true" />
      )}
    </button>
  );
};

/**
 * Inline text-with-copy: renders a short string plus a small icon
 * CopyButton. Useful for IDs, hashes, tokens, etc.
 */
export interface CopyableTextProps {
  value: string;
  label?: string;
  className?: string;
}

export const CopyableText: React.FC<CopyableTextProps> = ({
  value,
  label = 'Copy',
  className,
}) => {
  if (!value) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="font-mono text-sm">{value}</span>
      <CopyButton value={value} label={label} size="xs" />
    </span>
  );
};

export default CopyButton;