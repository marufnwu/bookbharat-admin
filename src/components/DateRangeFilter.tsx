import React from 'react';
import { Card } from './Card';
import Button from './Button';
import { cn } from '../utils/cn';

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onClear: () => void;
  /** Optional extra controls rendered alongside the date inputs (e.g. Order # search). */
  extra?: React.ReactNode;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
  extra,
  className,
}) => (
  <Card className={cn('p-4', className)}>
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      {extra}
      <Button variant="outline" size="sm" onClick={onClear}>Clear</Button>
    </div>
  </Card>
);

export default DateRangeFilter;