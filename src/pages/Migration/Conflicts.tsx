import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api, { type MigrationConflict } from '../../api';
import { LoadingSpinner, Badge } from '../../components';
import { format } from 'date-fns';

const MigrationConflicts: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    resolved: undefined as boolean | undefined,
    entity_type: '',
    conflict_type: '',
    per_page: 20,
    page: 1,
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState('created_at');

  const { data: conflictsResponse, isLoading, refetch } = useQuery({
    queryKey: ['migration', 'conflicts', filters, sortBy, sortOrder],
    queryFn: () => api.migration.getConflicts({
      ...filters,
    }),
  });

  const resolveConflictMutation = useMutation({
    mutationFn: ({ conflictId, data }: { conflictId: number; data: any }) =>
      api.migration.resolveConflict(conflictId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration', 'conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['migration', 'dashboard'] });
    },
  });

  const conflicts = conflictsResponse?.data?.data || [];
  const pagination = conflictsResponse?.data?.pagination;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'resolved' ? (value === '' ? undefined : value === 'true') : value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const handleResolveConflict = (conflictId: number, resolution: string, notes?: string) => {
    resolveConflictMutation.mutate({
      conflictId,
      data: {
        resolution,
        resolution_notes: notes,
      },
    });
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const getConflictIcon = (conflictType: string) => {
    switch (conflictType) {
      case 'duplicate':
        return <XMarkIcon className="h-5 w-5 text-orange-500" />;
      case 'field_mismatch':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'validation_error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'relation_error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-purple-500" />;
      case 'image_error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getConflictTypeColor = (conflictType: string) => {
    switch (conflictType) {
      case 'duplicate':
        return 'warning';
      case 'field_mismatch':
        return 'info';
      case 'validation_error':
        return 'error';
      case 'relation_error':
        return 'info';
      case 'image_error':
        return 'info';
      default:
        return 'warning';
    }
  };

  const getConflictSummary = (conflict: MigrationConflict): string => {
    if (conflict.conflict_details?.summary) {
      return conflict.conflict_details.summary;
    }

    const conflicts = conflict.conflict_details?.conflicts || [];
    if (conflicts.length > 0) {
      return `${conflicts.length} field${conflicts.length > 1 ? 's' : ''} need attention`;
    }

    return 'Unknown conflict';
  };

  const getResolutionIcon = (resolution: string | null | undefined) => {
    switch (resolution) {
      case 'skip':
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
      case 'overwrite':
        return <ArrowDownIcon className="h-4 w-4 text-blue-500" />;
      case 'manual':
        return <EyeIcon className="h-4 w-4 text-purple-500" />;
      case 'merge':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getResolutionLabel = (resolution: string | null | undefined): string => {
    switch (resolution) {
      case 'skip':
        return 'Skipped';
      case 'overwrite':
        return 'Overwritten';
      case 'manual':
        return 'Manual Review';
      case 'merge':
        return 'Merged';
      default:
        return 'Not Resolved';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Migration Conflicts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage and resolve data conflicts during migration
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Resolution Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resolution Status
            </label>
            <select
              value={filters.resolved === undefined ? '' : filters.resolved ? 'true' : 'false'}
              onChange={(e) => handleFilterChange('resolved', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="product">Product</option>
              <option value="category">Category</option>
              <option value="product_image">Product Image</option>
              <option value="product_variant">Product Variant</option>
            </select>
          </div>

          {/* Conflict Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conflict Type
            </label>
            <select
              value={filters.conflict_type}
              onChange={(e) => handleFilterChange('conflict_type', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-0 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="duplicate">Duplicate</option>
              <option value="field_mismatch">Field Mismatch</option>
              <option value="validation_error">Validation Error</option>
              <option value="relation_error">Relation Error</option>
              <option value="image_error">Image Error</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                resolved: undefined,
                entity_type: '',
                conflict_type: '',
                per_page: 20,
                page: 1,
              })}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {conflicts.length} of {pagination?.total || 0} conflicts found
          </div>
          <div className="text-sm text-gray-500">
            <span className={filters.resolved === true ? 'text-green-600' : ''}>
              {filters.resolved === true ? 'Resolved' : filters.resolved === false ? 'Unresolved' : ''}
            </span>
            {filters.resolved === true && filters.entity_type && ' • '}
            {filters.entity_type && (
              <span className="text-blue-600">{filters.entity_type}</span>
            )}
          </div>
        </div>
      </div>

      {/* Conflicts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Conflicts List
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : conflicts.length > 0 ? (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center">
                      ID
                      {sortBy === 'id' && (
                        sortOrder === 'asc'
                          ? <ArrowUpIcon className="h-4 w-4 ml-1" />
                          : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('entity_type')}>
                    <div className="flex items-center">
                      Entity
                      {sortBy === 'entity_type' && (
                        sortOrder === 'asc'
                          ? <ArrowUpIcon className="h-4 w-4 ml-1" />
                          : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('conflict_type')}>
                    <div className="flex items-center">
                      Type
                      {sortBy === 'conflict_type' && (
                        sortOrder === 'asc'
                          ? <ArrowUpIcon className="h-4 w-4 ml-1" />
                          : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Created
                      {sortBy === 'created_at' && (
                        sortOrder === 'asc'
                          ? <ArrowUpIcon className="h-4 w-4 ml-1" />
                          : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conflicts.map((conflict: MigrationConflict) => (
                  <tr key={conflict.id} className={`hover:bg-gray-50 ${conflict.resolved ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{conflict.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={conflict.resolved ? 'success' : 'warning'}>
                        {conflict.entity_type}
                      </Badge>
                      {conflict.entity_id && (
                        <span className="ml-2 text-sm text-gray-500">
                          ID: {conflict.entity_id}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getConflictIcon(conflict.conflict_type)}
                        <Badge
                          variant={getConflictTypeColor(conflict.conflict_type)}
                          className="ml-2"
                        >
                          {conflict.conflict_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {getConflictSummary(conflict)}
                      </div>
                      {conflict.resolution_notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {conflict.resolution_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {conflict.resolved ? (
                          <>
                            {getResolutionIcon(conflict.resolution)}
                            <Badge
                              variant="success"
                              className="ml-2"
                            >
                              {getResolutionLabel(conflict.resolution)}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                            <span className="ml-2 text-sm font-medium text-orange-700">
                              Not Resolved
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(conflict.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {!conflict.resolved && (
                          <>
                            <button
                              onClick={() => handleResolveConflict(
                                conflict.id,
                                'overwrite',
                                'Auto-resolved: Legacy system takes priority'
                              )}
                              disabled={resolveConflictMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              {resolveConflictMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                'Overwrite'
                              )}
                            </button>

                            <button
                              onClick={() => handleResolveConflict(
                                conflict.id,
                                'skip',
                                'Skipped by admin'
                              )}
                              disabled={resolveConflictMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                            >
                              {resolveConflictMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                'Skip'
                              )}
                            </button>

                            <button
                              onClick={() => {
                                // Open modal for manual resolution
                                // This would typically open a modal with more details
                                handleResolveConflict(
                                  conflict.id,
                                  'manual',
                                  'Manual resolution required'
                                );
                              }}
                              disabled={resolveConflictMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                            >
                              {resolveConflictMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                'Manual'
                              )}
                            </button>
                          </>
                        )}

                        {/* View Details */}
                        <button
                          onClick={() => {
                            // This would typically open a modal with full conflict details
                            console.log('View conflict details:', conflict);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
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
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No conflicts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Great! No conflicts detected in the current migration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationConflicts;