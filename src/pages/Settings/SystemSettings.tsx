import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ServerIcon,
  CircleStackIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button, LoadingSpinner, Badge } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { settingsApi } from '../../api/extended';

const SystemSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('health');
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Mock data for now - would come from actual system APIs
  const mockHealthData = {
    status: 'healthy',
    uptime: '5 days, 12 hours',
    memory_usage: { used: 512, total: 2048, percentage: 25 },
    disk_usage: { used: 45, total: 100, percentage: 45 },
    database_status: 'connected',
    cache_status: 'connected',
    queue_status: 'running',
    jobs_pending: 12,
    jobs_processed: 1245,
    last_backup: '2024-01-15 02:00:00',
  };

  // Fetch system health - using mock data for now until backend APIs are implemented
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => Promise.resolve({ success: true, data: mockHealthData }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation - would call actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: 'Cache cleared successfully' };
    },
    onSuccess: (data) => {
      showSuccess(data.message);
    },
    onError: (error: any) => {
      showError('Failed to clear cache', error.message);
    },
  });

  const optimizeSystemMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation - would call actual API
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true, message: 'System optimized successfully' };
    },
    onSuccess: (data) => {
      showSuccess(data.message);
    },
    onError: (error: any) => {
      showError('Failed to optimize system', error.message);
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation - would call actual API
      await new Promise(resolve => setTimeout(resolve, 5000));
      return { success: true, message: 'Backup created successfully' };
    },
    onSuccess: (data) => {
      showSuccess(data.message);
    },
    onError: (error: any) => {
      showError('Failed to create backup', error.message);
    },
  });

  const sections = [
    { id: 'health', name: 'System Health', icon: ServerIcon },
    { id: 'cache', name: 'Cache Management', icon: CircleStackIcon },
    { id: 'backups', name: 'Backups', icon: DocumentDuplicateIcon },
    { id: 'logs', name: 'System Logs', icon: DocumentTextIcon },
    { id: 'queue', name: 'Queue Status', icon: ClockIcon },
  ];

  const systemData = healthData?.data || mockHealthData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
        return <Badge variant="success">Healthy</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'error':
      case 'disconnected':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const renderHealthSection = () => (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          {getStatusBadge(systemData.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ServerIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Uptime</p>
                <p className="text-sm text-gray-500">{systemData.uptime}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CircleStackIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Memory</p>
                <p className="text-sm text-gray-500">
                  {systemData.memory_usage.used}MB / {systemData.memory_usage.total}MB
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${systemData.memory_usage.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DocumentDuplicateIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Disk Usage</p>
                <p className="text-sm text-gray-500">
                  {systemData.disk_usage.used}GB / {systemData.disk_usage.total}GB
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${systemData.disk_usage.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Queue Jobs</p>
                <p className="text-sm text-gray-500">
                  {systemData.jobs_pending} pending
                </p>
                <p className="text-xs text-gray-400">
                  {systemData.jobs_processed} processed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center">
              <CircleStackIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="font-medium">Database</span>
            </div>
            {getStatusBadge(systemData.database_status)}
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center">
              <ServerIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="font-medium">Cache</span>
            </div>
            {getStatusBadge(systemData.cache_status)}
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="font-medium">Queue</span>
            </div>
            {getStatusBadge(systemData.queue_status)}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCacheSection = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Management</h3>
        <p className="text-gray-600 mb-6">
          Clear application cache to ensure users see the latest content and configuration changes.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Application Cache</h4>
              <p className="text-sm text-gray-500">Cached views, routes, and configuration</p>
            </div>
            <Button
              onClick={() => clearCacheMutation.mutate()}
              disabled={clearCacheMutation.isPending}
              variant="outline"
            >
              {clearCacheMutation.isPending ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">System Optimization</h4>
              <p className="text-sm text-gray-500">Optimize routes, views, and autoloader</p>
            </div>
            <Button
              onClick={() => optimizeSystemMutation.mutate()}
              disabled={optimizeSystemMutation.isPending}
              variant="outline"
            >
              {optimizeSystemMutation.isPending ? 'Optimizing...' : 'Optimize'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupsSection = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Database Backups</h3>
          <Button
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
          >
            {createBackupMutation.isPending ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Last backup: <span className="font-medium">{systemData.last_backup}</span>
          </p>
        </div>

        <div className="space-y-3">
          {/* Mock backup list */}
          {[
            { name: 'backup_2024_01_15_020000.sql', size: '125 MB', date: '2024-01-15 02:00:00' },
            { name: 'backup_2024_01_14_020000.sql', size: '124 MB', date: '2024-01-14 02:00:00' },
            { name: 'backup_2024_01_13_020000.sql', size: '123 MB', date: '2024-01-13 02:00:00' },
          ].map((backup, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <DocumentDuplicateIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{backup.name}</p>
                  <p className="text-sm text-gray-500">{backup.size} • {backup.date}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Download</Button>
                <Button variant="outline" size="sm">Restore</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLogsSection = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent System Logs</h3>
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 max-h-96 overflow-y-auto">
        {/* Mock log entries */}
        <div className="space-y-1">
          <div>[2024-01-15 10:30:15] INFO: Application cache cleared successfully</div>
          <div>[2024-01-15 10:28:42] INFO: User login: admin@bookbharat.com</div>
          <div>[2024-01-15 10:25:13] INFO: Payment processed for order #1234</div>
          <div>[2024-01-15 10:20:55] WARNING: High memory usage detected (85%)</div>
          <div>[2024-01-15 10:15:32] INFO: Database backup completed successfully</div>
          <div>[2024-01-15 10:10:18] INFO: Queue job processed: SendEmailNotification</div>
          <div>[2024-01-15 10:05:44] ERROR: Failed to connect to external API (timeout)</div>
          <div>[2024-01-15 10:00:12] INFO: System health check passed</div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="outline">Download Full Log</Button>
      </div>
    </div>
  );

  const renderQueueSection = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Status</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Pending Jobs</p>
              <p className="text-2xl font-bold text-blue-600">{systemData.jobs_pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Processed</p>
              <p className="text-2xl font-bold text-green-600">{systemData.jobs_processed}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Failed</p>
              <p className="text-2xl font-bold text-red-600">3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Recent Jobs</h4>
        {/* Mock recent jobs */}
        {[
          { name: 'SendEmailNotification', status: 'completed', time: '2 minutes ago' },
          { name: 'ProcessOrderPayment', status: 'running', time: '5 minutes ago' },
          { name: 'GenerateReport', status: 'pending', time: '10 minutes ago' },
          { name: 'BackupDatabase', status: 'failed', time: '15 minutes ago' },
        ].map((job, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{job.name}</p>
              <p className="text-sm text-gray-500">{job.time}</p>
            </div>
            <Badge variant={
              job.status === 'completed' ? 'success' :
              job.status === 'running' ? 'warning' :
              job.status === 'failed' ? 'destructive' : 'default'
            }>
              {job.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'health':
        return renderHealthSection();
      case 'cache':
        return renderCacheSection();
      case 'backups':
        return renderBackupsSection();
      case 'logs':
        return renderLogsSection();
      case 'queue':
        return renderQueueSection();
      default:
        return renderHealthSection();
    }
  };

  if (healthLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {section.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Section Content */}
      {renderContent()}
    </div>
  );
};

export default SystemSettings;