import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Eye, Mail, MessageSquare, Phone, AlertCircle, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';

interface MessageLog {
  id: number;
  channel: string;
  template_code: string;
  recipient: string;
  status: string;
  sent_at: string;
  error_message?: string;
  created_at: string;
  user?: { name: string };
  metadata?: any;
}

const MessageLogs: React.FC = () => {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, channelFilter, statusFilter, templateFilter, dateFrom, dateTo]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        per_page: rowsPerPage,
        channel: channelFilter,
        status: statusFilter,
        template_code: templateFilter,
        date_from: dateFrom,
        date_to: dateTo,
      };

      const response = await api.get('/settings/messaging/logs', { params });
      setLogs(response.data.logs.data);
      setTotal(response.data.logs.total);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load message logs');
    } finally {
      setLoading(false);
    }
  };

  const retryMessage = async (id: number) => {
    try {
      const response = await api.post(`/settings/messaging/logs/${id}/retry`);
      if (response.data.success) {
        toast.success('Message resent successfully');
        loadLogs();
        setSelectedLog(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry');
    }
  };

  const exportLogs = async () => {
    try {
      const params = {
        channel: channelFilter,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
      };

      const response = await api.get('/settings/messaging/logs/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `message-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      queued: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4 text-gray-500" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Message Logs</h1>
        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <input
              type="text"
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              placeholder="e.g. login_otp"
              className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? 'Loading...' : 'No logs found matching your filters.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(log.channel)}
                        <span className="capitalize">{log.channel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.template_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.recipient}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.sent_at ? format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {log.status === 'failed' && (
                        <button
                          onClick={() => retryMessage(log.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Retry"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * rowsPerPage >= total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * rowsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * rowsPerPage, total)}</span> of <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * rowsPerPage >= total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedLog(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Message Details
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">ID</label>
                        <p className="text-sm text-gray-900">{selectedLog.id}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Channel</label>
                          <p className="text-sm text-gray-900 capitalize">{selectedLog.channel}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                          <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Recipient</label>
                        <p className="text-sm text-gray-900">{selectedLog.recipient}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Template</label>
                        <p className="text-sm text-gray-900">{selectedLog.template_code}</p>
                      </div>
                      {selectedLog.error_message && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Error</label>
                          <p className="text-sm text-red-600">{selectedLog.error_message}</p>
                        </div>
                      )}
                      {selectedLog.metadata && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Metadata</label>
                          <div className="mt-1 bg-gray-50 p-2 rounded text-xs font-mono overflow-auto max-h-40">
                             <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedLog.status === 'failed' && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => retryMessage(selectedLog.id)}
                  >
                    Retry Sending
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageLogs;
