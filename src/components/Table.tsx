import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { TableProps } from '../types';
import LoadingSpinner from './LoadingSpinner';
import Button from './Button';

function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  onSort,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    if (!onSort) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
    onSort(key, direction);
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }

    return sortConfig.direction === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 text-sm text-gray-900 ${
                        column.wrap ? '' : 'whitespace-nowrap'
                      }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => pagination.onChange(pagination.current - 1)}
              disabled={pagination.current <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => pagination.onChange(pagination.current + 1)}
              disabled={pagination.current * pagination.pageSize >= pagination.total}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.current - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onChange(pagination.current - 1)}
                  disabled={pagination.current <= 1}
                  className="rounded-r-none"
                >
                  Previous
                </Button>

                {/* Page numbers */}
                {Array.from(
                  { length: Math.ceil(pagination.total / pagination.pageSize) },
                  (_, i) => i + 1
                )
                  .filter((page) => {
                    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
                    const current = pagination.current;

                    // Always show first page, last page, current page, and adjacent pages
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= current - 1 && page <= current + 1)
                    );
                  })
                  .map((page, index, filteredPages) => {
                    const shouldShowEllipsis = index > 0 && page - filteredPages[index - 1] > 1;

                    return (
                      <React.Fragment key={page}>
                        {shouldShowEllipsis && (
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <Button
                          variant={page === pagination.current ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => pagination.onChange(page)}
                          className="rounded-none"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onChange(pagination.current + 1)}
                  disabled={pagination.current * pagination.pageSize >= pagination.total}
                  className="rounded-l-none"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;