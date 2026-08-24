import React from 'react';
import Button from './Button';
import { cn } from '../utils/cn';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total?: number;
  per_page?: number;
}

export interface TablePaginationProps {
  meta: PaginationMeta | undefined | null;
  page: number;
  onPageChange: (p: number) => void;
  /** Optional left-aligned slot (e.g. select-all checkbox on Commissions). */
  leftSlot?: React.ReactNode;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  meta,
  page,
  onPageChange,
  leftSlot,
  className,
}) => {
  if (!meta || meta.last_page <= 1) return null;

  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(meta.last_page, page + 1));

  return (
    <div className={cn('flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 rounded-lg shadow', className)}>
      <div className="flex flex-1 justify-between sm:hidden">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={prev}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={next}>Next</Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {leftSlot}
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{meta.current_page}</span> of{' '}
            <span className="font-medium">{meta.last_page}</span>
            {meta.total != null && (
              <>
                {' · '}
                <span className="text-gray-500">{meta.total.toLocaleString()} total</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={prev}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={next}>Next</Button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;