import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  DocumentTextIcon,
  PhotoIcon,
  TagIcon,
  PlayIcon,
  ArrowPathIcon as RefreshIcon,
  EyeIcon,
  CogIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../api';
import { LoadingSpinner, Badge } from '../../components';
import { format } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-md ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
            {subtitle && (
              <dd className="text-xs text-gray-500">{subtitle}</dd>
            )}
          </dl>
        </div>
        {trend && (
          <div className="ml-2 flex items-center">
            <div className={`flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <ArrowPathIcon className="h-4 w-4 mr-1" />
              ) : (
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend.value)}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const MigrationDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = React.useState(false);
  const [selectedEntities, setSelectedEntities] = React.useState([
    'categories', 'products', 'product_images'
  ]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['migration', 'dashboard'],
    queryFn: () => api.migration.getDashboard(),
    // Manual refresh only - no automatic polling
  });

  // Mutations
  const testConnectionMutation = useMutation({
    mutationFn: () => api.migration.testConnection(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration', 'dashboard'] });
    },
  });

  const runFullMigrationMutation = useMutation({
    mutationFn: (entities?: string[]) => api.migration.runFullMigration(entities),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['migration', 'logs'] });
    },
  });

  const runIncrementalSyncMutation = useMutation({
    mutationFn: () => api.migration.runIncrementalSync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['migration', 'logs'] });
    },
  });

  // Preview mutation
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['migration', 'preview'],
    queryFn: () => api.migration.previewMigration(selectedEntities),
    enabled: showPreview,
  });

  // System health monitoring
  const { data: healthStatus } = useQuery({
    queryKey: ['migration', 'health'],
    queryFn: () => api.migration.getSystemHealth(),
    // Manual refresh only - no automatic polling
  });

  // Queue status monitoring
  const { data: queueStatus } = useQuery({
    queryKey: ['migration', 'queue-status'],
    queryFn: () => api.migration.getQueueStatus(),
    // Manual refresh only - no automatic polling
  });

  const dashboard = dashboardData?.data || {
    status: {
      legacy_available: false,
      legacy_version: undefined,
      auto_sync_enabled: false,
      last_sync: undefined,
    },
    statistics: {
      total_migrations: 0,
      successful_migrations: 0,
      failed_migrations: 0,
      total_conflicts: 0,
      unresolved_conflicts: 0,
      last_migration: null,
    },
    recent_logs: [],
    entity_counts: {
      v2: { products: 0, categories: 0, product_images: 0 },
      legacy: { products: 0, categories: 0, product_images: 0 },
    },
    settings: {
      legacy_system_url: '',
      legacy_system_token: '',
      auto_sync_enabled: false,
      auto_sync_interval: 15,
      image_optimization_enabled: true,
      image_quality: 85,
      conflict_resolution: 'old_system_priority',
      max_batch_size: 100,
      syncable_entity_types: ['categories', 'products', 'product_images'],
    },
  };
  const stats = dashboard?.statistics;
  const status = dashboard?.status;
  const entityCounts = dashboard?.entity_counts;
  const settings = dashboard?.settings;
  const lastMigration = stats?.last_migration;

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Migration Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage data migration from legacy system to v2
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ServerIcon className="h-4 w-4 mr-2" />
            {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={() => refetchDashboard()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Status */}
      <div className={`rounded-lg p-4 ${
        healthStatus?.data?.overall_status === 'healthy'
          ? 'bg-green-50 border border-green-200'
          : healthStatus?.data?.overall_status === 'warning'
          ? 'bg-yellow-50 border border-yellow-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {healthStatus?.data?.overall_status === 'healthy' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : healthStatus?.data?.overall_status === 'warning' ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                healthStatus?.data?.overall_status === 'healthy'
                  ? 'text-green-800'
                  : healthStatus?.data?.overall_status === 'warning'
                  ? 'text-yellow-800'
                  : 'text-red-800'
              }`}>
                System Status: {healthStatus?.data?.overall_status?.charAt(0).toUpperCase() + healthStatus?.data?.overall_status?.slice(1) || 'Unknown'}
              </h3>
              <div className={`mt-1 text-sm ${
                healthStatus?.data?.overall_status === 'healthy'
                  ? 'text-green-700'
                  : healthStatus?.data?.overall_status === 'warning'
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {/* Legacy System */}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      healthStatus?.data?.services?.legacy_system?.status === 'healthy'
                        ? 'bg-green-400'
                        : healthStatus?.data?.services?.legacy_system?.status === 'warning'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`} />
                    <span className="text-xs">
                      Legacy: {healthStatus?.data?.services?.legacy_system?.response_time
                        ? `${healthStatus.data.services.legacy_system.response_time}ms`
                        : 'Unknown'
                      }
                    </span>
                  </div>

                  {/* Queue System */}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      healthStatus?.data?.services?.queue_system?.status === 'healthy'
                        ? 'bg-green-400'
                        : healthStatus?.data?.services?.queue_system?.status === 'warning'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`} />
                    <span className="text-xs">
                      Queue: {healthStatus?.data?.services?.queue_system?.pending_jobs || 0} jobs
                    </span>
                  </div>

                  {/* Database */}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      healthStatus?.data?.services?.database?.status === 'healthy'
                        ? 'bg-green-400'
                        : 'bg-red-400'
                    }`} />
                    <span className="text-xs">
                      DB: {healthStatus?.data?.services?.database?.connection || 'Unknown'}
                    </span>
                  </div>

                  {/* File System */}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      healthStatus?.data?.services?.file_system?.status === 'healthy'
                        ? 'bg-green-400'
                        : 'bg-red-400'
                    }`} />
                    <span className="text-xs">
                      Storage: {healthStatus?.data?.services?.file_system?.writable ? 'Writable' : 'Error'}
                    </span>
                  </div>
                </div>

                {/* Show recommendations if any */}
                {healthStatus?.data?.recommendations && healthStatus.data.recommendations.length > 0 && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium">Recommendations:</p>
                    <ul className="list-disc list-inside">
                      {healthStatus.data.recommendations.slice(0, 2).map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                      {healthStatus.data.recommendations.length > 2 && (
                        <li className="text-gray-500">
                          +{healthStatus.data.recommendations.length - 2} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Last checked: {healthStatus?.data?.timestamp
              ? format(new Date(healthStatus.data.timestamp), 'MMM dd, HH:mm:ss')
              : 'Never'
            }
          </div>
        </div>
      </div>

      {/* Migration Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Migrations"
          value={stats?.total_migrations || 0}
          icon={DocumentTextIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Successful"
          value={stats?.successful_migrations || 0}
          subtitle={`${Math.round((stats?.successful_migrations || 0) / Math.max(stats?.total_migrations || 1) * 100)}% success rate`}
          icon={CheckCircleIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Failed"
          value={stats?.failed_migrations || 0}
          icon={ExclamationTriangleIcon}
          color="bg-red-500"
        />
        <StatCard
          title="Conflicts"
          value={stats?.unresolved_conflicts || 0}
          subtitle={`${stats?.total_conflicts || 0} total`}
          icon={ClockIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* Migration Settings Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Migration Configuration</h3>
            <button
              onClick={() => window.open('/migration/settings', '_blank')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Configure
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {settings?.auto_sync_enabled ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-500">Auto Sync</div>
              {settings?.auto_sync_enabled && (
                <div className="text-xs text-gray-400">
                  Every {settings.auto_sync_interval}min
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {settings?.syncable_entity_types?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Entity Types</div>
              <div className="text-xs text-gray-400">
                {settings?.syncable_entity_types?.join(', ') || 'None'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {settings?.max_batch_size || 100}
              </div>
              <div className="text-sm text-gray-500">Batch Size</div>
              <div className="text-xs text-gray-400">
                Records per batch
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {settings?.conflict_resolution?.replace('_', ' ') || 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Conflict Resolution</div>
              <div className="text-xs text-gray-400">
                Handling strategy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Migration Summary */}
      {lastMigration && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Last Migration Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Migration Type</div>
                <div className="font-medium text-gray-900 capitalize">{lastMigration.migration_type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <Badge
                  variant={
                    lastMigration.status === 'completed' ? 'success' :
                    lastMigration.status === 'failed' ? 'error' :
                    lastMigration.status === 'running' ? 'info' : 'warning'
                  }
                  className="mt-1"
                >
                  {lastMigration.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-medium text-gray-900">
                  {lastMigration.duration ? formatDuration(lastMigration.duration) : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Success Rate</div>
                <div className="font-medium text-gray-900">
                  {lastMigration.success_rate ? `${Math.round(lastMigration.success_rate)}%` : 'N/A'}
                </div>
              </div>
            </div>
            {lastMigration && ((lastMigration.records_processed ?? 0) > 0 || (lastMigration.records_created ?? 0) > 0 || (lastMigration.records_failed ?? 0) > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Processed:</span>
                    <span className="ml-2 font-medium">{lastMigration?.records_processed || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 font-medium text-green-600">{lastMigration?.records_created || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 font-medium text-blue-600">{lastMigration?.records_updated || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Failed:</span>
                    <span className="ml-2 font-medium text-red-600">{lastMigration?.records_failed || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entity Counts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Entity Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Products */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TagIcon className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-900">Products</h4>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Legacy:</span>
                  <span className="font-medium">{entityCounts?.legacy?.products || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">V2:</span>
                  <span className="font-medium">{entityCounts?.v2?.products || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">To Migrate:</span>
                  <span className="text-blue-600">
                    {Math.max(0, (entityCounts?.legacy?.products || 0) - (entityCounts?.v2?.products || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TagIcon className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-900">Categories</h4>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Legacy:</span>
                  <span className="font-medium">{entityCounts?.legacy?.categories || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">V2:</span>
                  <span className="font-medium">{entityCounts?.v2?.categories || 0}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">To Migrate:</span>
                  <span className="text-green-600">
                    {Math.max(0, (entityCounts?.legacy?.categories || 0) - (entityCounts?.v2?.categories || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <PhotoIcon className="h-8 w-8 text-purple-500" />
              </div>
              <h4 className="text-sm font-medium text-gray-900">Product Images</h4>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">V2:</span>
                  <span className="font-medium">{entityCounts?.v2?.product_images || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Legacy:</span>
                  <span className="font-medium">N/A</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Status:</span>
                  <span className="text-purple-600">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entity Selection */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Entities to Migrate</h3>
          <div className="space-y-3">
            {['categories', 'products', 'product_images'].map((entity) => (
              <label key={entity} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedEntities.includes(entity)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEntities([...selectedEntities, entity]);
                    } else {
                      setSelectedEntities(selectedEntities.filter(e => e !== entity));
                    }
                  }}
                />
                <span className="ml-3 text-sm text-gray-700 capitalize">
                  {entity.replace('_', ' ')} ({entityCounts?.legacy?.[entity as keyof typeof entityCounts.legacy] || 0} available)
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Queue Status */}
      {queueStatus && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{queueStatus?.data?.pending_jobs || 0}</div>
                <div className="text-sm text-gray-500">Pending Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{queueStatus?.data?.processing_jobs || 0}</div>
                <div className="text-sm text-gray-500">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{queueStatus?.data?.failed_jobs || 0}</div>
                <div className="text-sm text-gray-500">Failed Jobs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Migration Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!healthStatus?.data?.services?.legacy_system?.status || healthStatus?.data?.services?.legacy_system?.status === 'error'}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Preview Migration
            </button>

            <button
              onClick={() => runFullMigrationMutation.mutate(selectedEntities)}
              disabled={runFullMigrationMutation.isPending || !healthStatus?.data?.services?.legacy_system?.status || healthStatus?.data?.services?.legacy_system?.status === 'error' || selectedEntities.length === 0}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runFullMigrationMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Running Migration...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Run Migration ({selectedEntities.length})
                </>
              )}
            </button>

            <button
              onClick={() => runIncrementalSyncMutation.mutate()}
              disabled={runIncrementalSyncMutation.isPending || !healthStatus?.data?.services?.legacy_system?.status || healthStatus?.data?.services?.legacy_system?.status === 'error'}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runIncrementalSyncMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshIcon className="h-5 w-5 mr-2" />
                  Incremental Sync
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={() => window.open('/migration/logs', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              View Logs
            </button>

            <button
              onClick={() => window.open('/migration/conflicts', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Manage Conflicts
            </button>

            <button
              onClick={() => window.open('/migration/settings', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Settings
            </button>

            <button
              onClick={() => window.open('/migration/documentation', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
              Documentation
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <button
              onClick={() => window.open('/migration/logs', '_blank')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {dashboard?.recent_logs?.length > 0 ? (
              dashboard.recent_logs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div className="flex items-center">
                    <Badge
                      variant={
                        log.status === 'completed' ? 'success' :
                        log.status === 'failed' ? 'error' :
                        log.status === 'running' ? 'info' : 'warning'
                      }
                    >
                      {log.status}
                    </Badge>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{log.migration_type}</p>
                      <p className="text-xs text-gray-500">
                        {log.started_at ? formatDate(log.started_at) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {log.records_processed || 0} processed
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.duration ? formatDuration(log.duration) : 'N/A'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Migration logs will appear here once you start the migration process.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      {dashboard?.recent_logs?.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <CogIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-indigo-900">System Insights & Recommendations</h3>
              <p className="text-sm text-indigo-700">
                Actionable items based on current system state
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legacy System Status */}
            {!healthStatus?.data?.services?.legacy_system?.status || healthStatus?.data?.services?.legacy_system?.status === 'error' ? (
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <h4 className="font-medium text-red-900">Legacy System Connection Issue</h4>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Cannot connect to legacy system. Check configuration.
                </p>
                <button
                  onClick={() => window.open('/migration/settings', '_blank')}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                >
                  Fix Connection
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="font-medium text-green-900">Legacy System Connected</h4>
                </div>
                <p className="text-sm text-green-700">
                  System is ready for migration operations.
                </p>
              </div>
            )}

            {/* Queue Status */}
            {healthStatus?.data?.services?.queue_system?.pending_jobs > 50 ? (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <h4 className="font-medium text-yellow-900">High Queue Load</h4>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  {healthStatus?.data?.services?.queue_system?.pending_jobs} jobs pending. Consider running more workers.
                </p>
                <button
                  onClick={() => window.open('/migration/logs', '_blank')}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Monitor Queue
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="font-medium text-green-900">Queue System Healthy</h4>
                </div>
                <p className="text-sm text-green-700">
                  {healthStatus?.data?.services?.queue_system?.pending_jobs || 0} jobs pending.
                </p>
              </div>
            )}

            {/* Conflicts Alert */}
            {stats?.unresolved_conflicts > 0 ? (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <h4 className="font-medium text-yellow-900">Unresolved Conflicts</h4>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  {stats.unresolved_conflicts} conflicts need resolution.
                </p>
                <button
                  onClick={() => window.open('/migration/conflicts', '_blank')}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Resolve Conflicts
                </button>
              </div>
            ) : null}

            {/* Migration Health */}
            {stats?.failed_migrations > 0 && stats?.failed_migrations >= stats?.successful_migrations * 0.1 ? (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <h4 className="font-medium text-yellow-900">Migration Success Rate Low</h4>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  {Math.round((stats.failed_migrations / Math.max(stats.total_migrations, 1)) * 100)}% failure rate detected.
                </p>
                <button
                  onClick={() => window.open('/migration/logs', '_blank')}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
                >
                  Review Logs
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="font-medium text-green-900">Migration Health Good</h4>
                </div>
                <p className="text-sm text-green-700">
                  {Math.round(((stats?.successful_migrations || 0) / Math.max(stats?.total_migrations || 1)) * 100)}% success rate.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Getting Started Guide */}
      {(!dashboard?.recent_logs?.length || stats?.total_migrations === 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-900">Getting Started with Migration</h3>
              <p className="text-sm text-blue-700">
                Follow these steps to set up and run your first migration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2">1</div>
                <h4 className="font-medium text-gray-900">Configure Connection</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Set up your legacy system connection in Migration Settings
              </p>
              <button
                onClick={() => window.open('/migration/settings', '_blank')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Open Settings →
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2">2</div>
                <h4 className="font-medium text-gray-900">Preview Migration</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                See what data will be migrated before making any changes
              </p>
              <button
                onClick={() => setShowPreview(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Preview Data →
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2">3</div>
                <h4 className="font-medium text-gray-900">Read Documentation</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Get detailed instructions and troubleshooting help
              </p>
              <button
                onClick={() => window.open('/migration/documentation', '_blank')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Guide →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Migration Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {previewLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : previewData?.data ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Preview of what will be migrated from the legacy system to v2:
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Legacy Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          V2 Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Will Migrate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(previewData.data).map(([entityType, data]: [string, any]) => (
                        <tr key={entityType}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                            {entityType.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {data.legacy_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {data.v2_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              data.will_migrate > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {data.will_migrate}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      runFullMigrationMutation.mutate(selectedEntities);
                    }}
                    disabled={runFullMigrationMutation.isPending}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {runFullMigrationMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Running Migration...
                      </>
                    ) : (
                      'Proceed with Migration'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No preview data available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please check your connection to the legacy system.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationDashboard;