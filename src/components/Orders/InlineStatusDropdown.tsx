import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../../components';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

const allStatuses: StatusOption[] = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'processing', label: 'Processing', color: 'indigo' },
  { value: 'shipped', label: 'Shipped', color: 'purple' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'gray' },
];

const validTransitions: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const statusColors: Record<string, { bg: string; hover: string; dot: string }> = {
  pending: { bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', dot: 'bg-yellow-400' },
  processing: { bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', dot: 'bg-indigo-400' },
  shipped: { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', dot: 'bg-purple-400' },
  delivered: { bg: 'bg-green-50', hover: 'hover:bg-green-100', dot: 'bg-green-400' },
  cancelled: { bg: 'bg-red-50', hover: 'hover:bg-red-100', dot: 'bg-red-400' },
  refunded: { bg: 'bg-gray-50', hover: 'hover:bg-gray-100', dot: 'bg-gray-400' },
};

interface InlineStatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export const InlineStatusDropdown: React.FC<InlineStatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const transitions = validTransitions[currentStatus] || [];
  const canTransition = transitions.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (status: string) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  const currentColors = statusColors[currentStatus] || statusColors.pending;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => !disabled && canTransition && setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
          currentColors.bg,
          !disabled && canTransition && 'cursor-pointer ' + currentColors.hover,
          disabled && 'opacity-50 cursor-not-allowed',
          !canTransition && !disabled && 'cursor-default'
        )}
        title={canTransition ? 'Click to change status' : `No transitions available from ${currentStatus}`}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', currentColors.dot)} />
        <span className="capitalize">{currentStatus}</span>
        {canTransition && !disabled && (
          <svg className={cn('w-3 h-3 text-gray-400 transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in fade-in slide-in-from-top-1">
          {transitions.map((status) => {
            const option = allStatuses.find(s => s.value === status);
            const colors = statusColors[status];
            if (!option || !colors) return null;

            return (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors',
                  'hover:bg-gray-50'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                <span className="capitalize">{option.label}</span>
                <span className="ml-auto text-gray-400">
                  {status === 'processing' && '→'}
                  {status === 'shipped' && '→'}
                  {status === 'delivered' && '→'}
                  {status === 'cancelled' && '✕'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
