import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { ViewColumnsIcon, ChevronDownIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export interface TableColumnOption {
  key: string;
  label: string;
  locked?: boolean;
}

interface TableColumnPickerProps {
  columns: TableColumnOption[];
  visible: string[];
  onChange: (visible: string[]) => void;
  onReset?: () => void;
  className?: string;
}

export const TableColumnPicker: React.FC<TableColumnPickerProps> = ({
  columns,
  visible,
  onChange,
  onReset,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const visibleSet = new Set(visible);

  const toggle = (key: string) => {
    const next = new Set(visibleSet);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    // Preserve the declared column order in what we persist.
    onChange(columns.filter((column) => next.has(column.key)).map((column) => column.key));
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={open}
        title="Choose visible columns"
      >
        <ViewColumnsIcon className="h-4 w-4 text-gray-500" />
        Columns
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600 tabular-nums">
          {visible.length}
        </span>
        <ChevronDownIcon className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          role="menu"
          aria-label="Visible columns"
        >
          <div className="max-h-80 overflow-y-auto py-1">
            {columns.map((column) => {
              const checked = column.locked || visibleSet.has(column.key);
              return (
                <button
                  key={column.key}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  disabled={column.locked}
                  onClick={() => !column.locked && toggle(column.key)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    column.locked ? 'cursor-default text-gray-400' : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked
                        ? column.locked
                          ? 'border-gray-300 bg-gray-200 text-gray-500'
                          : 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    {checked && <CheckIcon className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{column.label}</span>
                  {column.locked && <span className="ml-auto text-[10px] uppercase tracking-wide">fixed</span>}
                </button>
              );
            })}
          </div>

          {onReset && (
            <button
              type="button"
              onClick={() => {
                onReset();
                close();
              }}
              className="flex w-full items-center gap-2 border-t border-gray-200 px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TableColumnPicker;
