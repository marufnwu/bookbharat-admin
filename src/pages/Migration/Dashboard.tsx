import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  PlayIcon,
  ClockIcon,
  DocumentTextIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import api from '../../api';
import { LoadingSpinner, Badge } from '../../components';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface MigrationStats {
  total_migrations: number;
  successful_migrations: number;
  failed_migrations: number;
  unresolved_conflicts: number;
}

interface MigrationLog {
  id: number;
  migration_type: string;
  status: 'completed' | 'failed' | 'running';
  started_at: string;
  duration: number;
  records_processed: number;
}

interface DashboardData {
  statistics?: MigrationStats;
  recent_logs?: MigrationLog[];
}

const MigrationDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Data Fetching
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['migration', 'dashboard'],
    queryFn: () => api.migration.getDashboard(),
  });

  const { data: healthStatus } = useQuery({
    queryKey: ['migration', 'health'],
    queryFn: () => api.migration.getSystemHealth(),
  });

  // Mutations
  const testConnectionMutation = useMutation({
    mutationFn: () => api.migration.testConnection(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['migration', 'health'] });
    },
  });

  const runSyncMutation = useMutation({
    mutationFn: () => api.migration.runIncrementalSync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration', 'dashboard'] });
    },
  });

  const dashboard = (dashboardData?.data || {}) as DashboardData;
  const stats = dashboard?.statistics;
  const health = healthStatus?.data;
  
  // Helpers
  const isHealthy = health?.overall_status === 'healthy';

  const formatDuration = (seconds: number): string => {
      if (!seconds) return '0s';
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatDate = (dateString: string): string => {
      try {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'MMM dd, HH:mm');
      } catch {
        return 'N/A';
      }
  };

  if (isLoading) {
    return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Migration Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and control your data path from Legacy to V2</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/migration/settings')}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <CogIcon className="w-4 h-4 mr-2" />
            Settings
          </button>
           <button 
            onClick={() => refetch()}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Control Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">System Status</h3>
          
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-full ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <ServerIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">
                {isHealthy ? 'System Operational' : 'Connection Issue'}
              </div>
              <div className="text-sm text-gray-500">
                Legacy API: {health?.services?.legacy_system?.status === 'healthy' ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>

          <div className="space-y-3">
             <button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                className="w-full py-2 px-3 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors text-left flex items-center justify-between"
             >
                {testConnectionMutation.isPending ? 'Testing Connection...' : 'Test Connection Status'}
                <ArrowPathIcon className={`w-4 h-4 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
             </button>
             
             <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Database</span>
                <span className="text-green-600 font-medium">Connected</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500">Queue Worker</span>
                <span className="text-green-600 font-medium">{health?.services?.queue_system?.status === 'healthy' ? 'Active' : 'Idle'}</span>
             </div>
          </div>
        </div>

        {/* Center: Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
           <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Actions</h3>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => runSyncMutation.mutate()}
                disabled={!isHealthy}
                className="relative group p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left disabled:opacity-50"
              >
                 <div className="absolute top-4 right-4 text-blue-500">
                    <ArrowPathIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                 </div>
                 <div className="font-semibold text-gray-900 mb-1">Incremental Sync</div>
                 <p className="text-xs text-gray-500">
                    Pull only new/changed records from Legacy. <br/>
                    <i className="text-blue-600">Recommended for daily use.</i>
                 </p>
              </button>

              <button 
                onClick={() => navigate('/migration/settings')}
                className="relative group p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all text-left"
              >
                 <div className="absolute top-4 right-4 text-purple-500">
                    <PlayIcon className="w-6 h-6" />
                 </div>
                 <div className="font-semibold text-gray-900 mb-1">Full Migration</div>
                 <p className="text-xs text-gray-500">
                    Configure and run a complete data transfer. <br/>
                    <i className="text-purple-600">Use for initial setup.</i>
                 </p>
              </button>

              <button 
                 onClick={() => navigate('/migration/conflicts')}
                 className="relative group p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all text-left"
              >
                 <div className="absolute top-4 right-4 text-orange-500">
                    <ExclamationTriangleIcon className="w-6 h-6" />
                 </div>
                 <div className="font-semibold text-gray-900 mb-1">Resolve Conflicts</div>
                 <p className="text-xs text-gray-500">
                    {stats?.unresolved_conflicts || 0} items need your attention.
                 </p>
              </button>
              
               <button 
                 onClick={() => navigate('/migration/logs')}
                 className="relative group p-4 border border-gray-200 rounded-lg hover:border-gray-500 hover:shadow-md transition-all text-left"
              >
                 <div className="absolute top-4 right-4 text-gray-500">
                    <DocumentTextIcon className="w-6 h-6" />
                 </div>
                 <div className="font-semibold text-gray-900 mb-1">View Logs</div>
                 <p className="text-xs text-gray-500">
                    Check history and debug errors.
                 </p>
              </button>
           </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-xs text-gray-500 uppercase">Total Migrated</div>
          <div className="text-2xl font-bold text-gray-900">{stats?.total_migrations || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <div className="text-xs text-gray-500 uppercase">Success Rate</div>
           <div className="text-2xl font-bold text-green-600">
             {Math.round((stats?.successful_migrations || 0) / Math.max(stats?.total_migrations || 1, 1) * 100)}%
           </div>
        </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <div className="text-xs text-gray-500 uppercase">Errors</div>
           <div className="text-2xl font-bold text-red-600">{stats?.failed_migrations || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <div className="text-xs text-gray-500 uppercase">Pending Conflicts</div>
           <div className="text-2xl font-bold text-orange-600">{stats?.unresolved_conflicts || 0}</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
           <h3 className="font-semibold text-gray-900">Recent Activity</h3>
           <button onClick={() => navigate('/migration/logs')} className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        <div className="divide-y divide-gray-100">
           {dashboard?.recent_logs && dashboard.recent_logs.length > 0 ? (
             dashboard.recent_logs.map((log: MigrationLog) => (
               <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                     {log.status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : 
                      log.status === 'failed' ? <ExclamationTriangleIcon className="w-5 h-5 text-red-500" /> :
                      <ClockIcon className="w-5 h-5 text-blue-500" />}
                     <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">{log.migration_type.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">{formatDate(log.started_at)}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-sm font-medium text-gray-900">{log.records_processed} Records</div>
                     <div className="text-xs text-gray-500 text-right">{formatDuration(log.duration)}</div>
                  </div>
               </div>
             ))
           ) : (
             <div className="p-8 text-center text-gray-500 text-sm">No recent activity found.</div>
           )}
        </div>
      </div>

    </div>
  );
};

export default MigrationDashboard;