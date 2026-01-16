import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Copy,
  Trash2,
  Search,
  Code,
} from 'lucide-react';
import { Button, LoadingSpinner } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import errorLogApi, { ErrorLog, ErrorLogFilters } from '../../api/errorLogApi';
import ErrorDetailModal from '../../components/ErrorDetailModal';

const ErrorLogs: React.FC = () => {
  const [filters, setFilters] = useState<ErrorLogFilters>({});
  const [selectedErrors, setSelectedErrors] = useState<number[]>([]);
  const [detailError, setDetailError] = useState<ErrorLog | null>(null);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Fetch errors
  const { data, isLoading } = useQuery({
    queryKey: ['error-logs', filters],
    queryFn: () => errorLogApi.getErrorLogs(filters),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['error-logs-stats'],
    queryFn: () => errorLogApi.getStats('24h'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: errorLogApi.deleteError,
    onSuccess: () => {
      showSuccess('Error log deleted');
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
    onError: (error: any) => showError('Failed to delete', error.message),
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: errorLogApi.bulkDelete,
    onSuccess: () => {
      showSuccess('Selected errors deleted');
      setSelectedErrors([]);
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
    onError: (error: any) => showError('Failed to delete', error.message),
  });

  // Bulk resolve mutation
  const bulkResolveMutation = useMutation({
    mutationFn: ({ ids, notes }: { ids: number[]; notes?: string }) =>
      errorLogApi.bulkResolve(ids, notes),
    onSuccess: () => {
      showSuccess('Selected errors marked as resolved');
      setSelectedErrors([]);
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
    onError: (error: any) => showError('Failed to resolve', error.message),
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard');
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'emergency':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (level: string) => {
    const colors: Record<string, string> = {
      emergency: 'bg-red-100 text-red-800',
      critical: 'bg-orange-100 text-orange-800',
      error: 'bg-yellow-100 text-yellow-800',
      warning: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[level] || colors.warning}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  const errors = data?.data?.data || [];
  const stats = statsData?.data || {};

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unresolved</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unresolved || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical || 0}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.total - stats.unresolved || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search errors..."
                className="pl-10 w-full px-3 py-2 border rounded-md"
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              onChange={(e) => setFilters({ ...filters, level: e.target.value || undefined })}
            >
              <option value="">All Levels</option>
              <option value="emergency">Emergency</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  is_resolved: e.target.value === '' ? undefined : e.target.value === 'true',
                })
              }
            >
              <option value="">All</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFilters({})}
              className="flex-1"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedErrors.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedErrors.length} error{selectedErrors.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkResolveMutation.mutate({ ids: selectedErrors })}
              disabled={bulkResolveMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Resolved
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm(`Delete ${selectedErrors.length} error(s)?`)) {
                  bulkDeleteMutation.mutate(selectedErrors);
                }
              }}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Error List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedErrors.length === errors.length && errors.length > 0}
                  onChange={(e) =>
                    setSelectedErrors(e.target.checked ? errors.map((err: ErrorLog) => err.id) : [])
                  }
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {errors.map((error: ErrorLog) => (
              <tr key={error.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedErrors.includes(error.id)}
                    onChange={(e) =>
                      setSelectedErrors(
                        e.target.checked
                          ? [...selectedErrors, error.id]
                          : selectedErrors.filter((id) => id !== error.id)
                      )
                    }
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(error.level)}
                    {getSeverityBadge(error.level)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => copyToClipboard(error.message)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1"
                      title="Copy error message"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-900 max-w-md truncate">
                        {error.message}
                      </p>
                      {error.type && (
                        <p className="text-xs text-gray-500 mt-1">{error.type}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {error.file && (
                    <div className="text-xs">
                      <p className="text-gray-900 font-mono truncate max-w-xs" title={error.file}>
                        {error.short_file || error.file}
                      </p>
                      {error.line && <p className="text-gray-500">Line {error.line}</p>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(error.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {error.is_resolved ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      Resolved
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                      Unresolved
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailError(error)}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Delete this error log?')) {
                          deleteMutation.mutate(error.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {errors.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No errors found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailError && (
        <ErrorDetailModal
          error={detailError}
          onClose={() => setDetailError(null)}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  );
};

export default ErrorLogs;
