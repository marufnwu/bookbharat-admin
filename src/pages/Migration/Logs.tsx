import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import api, { type MigrationLog } from '../../api';
import { LoadingSpinner, Badge } from '../../components';
import { format } from 'date-fns';

const MigrationLogs: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    migration_type: '',
    date_from: '',
    date_to: '',
    per_page: 20,
    page: 1,
  });

  const { data: logsResponse, isLoading, refetch } = useQuery({
    queryKey: ['migration', 'logs', filters],
    queryFn: () => api.migration.getLogs(filters),
  });

  const logs = logsResponse?.data?.data || [];
  const pagination = logsResponse?.data?.pagination;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Migration Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and filter migration history and logs
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Migration Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Migration Type
            </label>
            <select
              value={filters.migration_type}
              onChange={(e) => handleFilterChange('migration_type', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="full_migration">Full Migration</option>
              <option value="incremental_sync">Incremental Sync</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Search
            </button>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {logs.length} of {pagination?.total || 0} logs found
          </div>
          <button
            onClick={() => setFilters({
              status: '',
              migration_type: '',
              date_from: '',
              date_to: '',
              per_page: 20,
              page: 1,
            })}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Migration Logs
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : logs.length > 0 ? (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conflicts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log: MigrationLog) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{log.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.migration_type?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(log.status)}
                        <Badge
                          variant={getStatusColor(log.status)}
                          className="ml-2"
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>Processed: {log.records_processed || 0}</div>
                        <div>Created: {log.records_created || 0}</div>
                        <div>Updated: {log.records_updated || 0}</div>
                        {log.records_failed && log.records_failed > 0 && (
                          <div className="text-red-600">Failed: {log.records_failed}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.duration ? formatDuration(log.duration) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="text-gray-900">
                          {Math.round(log.success_rate || 0)}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2 ml-2">
                          <div
                            className={`h-2 rounded-full ${
                              (log.success_rate || 0) >= 90
                                ? 'bg-green-500'
                                : (log.success_rate || 0) >= 70
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${log.success_rate || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDate(log.started_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.completed_at ? (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(log.completed_at)}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.conflicts_count && log.conflicts_count > 0 ? (
                        <span className="text-red-600 font-medium">
                          {log.conflicts_count} conflicts
                        </span>
                      ) : (
                        <span className="text-green-600">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total > pagination.per_page && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.current_page - 1) * pagination.per_page + 1}
                    </span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex">
                      {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.current_page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page >= pagination.last_page}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationLogs;