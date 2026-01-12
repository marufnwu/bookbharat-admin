import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { communicationApi } from '../../services/communicationApi';
import { CommunicationLog } from '../../types/communication';
import { format } from 'date-fns';
import { 
  Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, 
  Mail, MessageSquare, Smartphone, Bell 
} from 'lucide-react';

const CommunicationLogs = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    channel: '',
    status: '',
    event_type: ''
  });

  // Fetch Logs
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['communication-logs', page, filters],
    queryFn: () => communicationApi.getLogs({ page, ...filters }),
    keepPreviousData: true
  });

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['communication-stats'],
    queryFn: () => communicationApi.getStats('30d')
  });

  const logs = data?.data?.data?.data || [];
  const meta = data?.data?.data;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'sent':
      case 'delivered':
      case 'read':
      case 'opened':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch(channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'whatsapp': return <Smartphone className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      case 'in_app': return <Bell className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Communication Logs</h1>
        <button onClick={() => refetch()} className="p-2 hover:bg-gray-100 rounded-full">
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">Total Sent (30d)</div>
          <div className="text-2xl font-semibold">{statsData?.data?.data?.total || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">Success Rate</div>
          <div className="text-2xl font-semibold text-green-600">
            {statsData?.data?.data?.total ? Math.round((statsData.data.data.successful / statsData.data.data.total) * 100) : 0}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">Failed</div>
          <div className="text-2xl font-semibold text-red-600">{statsData?.data?.data?.failed || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search recipient, subject..." 
            className="pl-9 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          />
        </div>
        
        <select 
          className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.channel}
          onChange={(e) => setFilters({...filters, channel: e.target.value})}
        >
          <option value="">All Channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <select 
          className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event / Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-gray-500">No logs found</td></tr>
            ) : (
              logs.map((log: CommunicationLog) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(log.created_at), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium flex items-center gap-2">
                    {getChannelIcon(log.channel)}
                    <span className="capitalize">{log.channel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>{log.recipient}</div>
                    {log.user && <div className="text-xs text-gray-400">{log.user.name}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    <div className="font-semibold text-xs text-blue-600 mb-0.5 uppercase">{log.event_type}</div>
                    <div className="truncate">{log.subject || log.message_preview || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-1.5 capitalize">
                      {getStatusIcon(log.status)}
                      {log.status}
                    </div>
                    {log.error_message && <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={log.error_message}>{log.error_message}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {log.provider}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination - Simplified */}
        {meta && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
             <div className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page} ({meta.total} records)
             </div>
             <div className="flex gap-2">
               <button 
                 disabled={meta.current_page === 1}
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 className="px-3 py-1 border rounded bg-white disabled:opacity-50"
               >
                 Previous
               </button>
               <button 
                 disabled={meta.current_page === meta.last_page}
                 onClick={() => setPage(p => p + 1)}
                 className="px-3 py-1 border rounded bg-white disabled:opacity-50"
               >
                 Next
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationLogs;
