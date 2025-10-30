import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  X,
  Filter,
  Clock,
  DollarSign,
  Package,
} from 'lucide-react';
import { api } from '../../api/axios';

interface ValidationLog {
  id: number;
  created_at: string;
  is_valid: boolean;
  issues_count: number;
  issue_summary: string;
  price_changes: {
    increase: number;
    decrease: number;
  };
  notification_sent: boolean;
  notification_message: string;
  action_taken: string;
}

interface IssueBreakdown {
  type: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ValidationLogs: React.FC = () => {
  const [cartId, setCartId] = useState<number | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterValid, setFilterValid] = useState<'all' | 'valid' | 'invalid'>('all');

  // Fetch validation statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['validation-stats'],
    queryFn: async () => {
      const response = await api.get('/cart/validation/stats');
      return response.data.data;
    },
  });

  // Fetch validation history for specific cart
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['validation-history', cartId],
    enabled: !!cartId,
    queryFn: async () => {
      const response = await api.get(`/cart/${cartId}/validation-history`);
      return response.data.data.validations;
    },
  });

  const stats = statsData || {};

  const getIssueBreakdown = (): IssueBreakdown[] => [
    {
      type: 'Products Deleted',
      count: stats?.by_issue_type?.product_deleted || 0,
      icon: <Package className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      type: 'Products Inactive',
      count: stats?.by_issue_type?.product_inactive || 0,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      type: 'Out of Stock',
      count: stats?.by_issue_type?.out_of_stock || 0,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      type: 'Limited Stock',
      count: stats?.by_issue_type?.insufficient_stock || 0,
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      type: 'Price Changes',
      count: stats?.by_issue_type?.price_changes || 0,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const filteredLogs = historyData?.filter((log: ValidationLog) => {
    if (filterValid === 'all') return true;
    if (filterValid === 'valid') return log.is_valid;
    return !log.is_valid;
  }) || [];

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Validation Logs</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor cart validations and stock changes</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Validations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total_validations || 0}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Invalid Carts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.invalid_carts || 0}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.notifications_pending || 0}
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Issue Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {getIssueBreakdown().map((issue, idx) => (
            <div key={idx} className={`${issue.bgColor} rounded-lg p-4 border-l-4 ${issue.color.replace('text', 'border')}`}>
              <div className={`${issue.color} mb-2`}>
                {issue.icon}
              </div>
              <p className="text-sm font-medium text-gray-700">{issue.type}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{issue.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Price Increases</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                ₹{stats.financial_impact?.total_price_increases || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Price Decreases</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ₹{stats.financial_impact?.total_price_decreases || 0}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Impact</p>
              <p className={`text-2xl font-bold mt-2 ${
                (stats.financial_impact?.net_impact || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                ₹{stats.financial_impact?.net_impact || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Search for Cart History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation History</h3>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            value={cartId || ''}
            onChange={(e) => setCartId(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Enter cart ID to view validation history..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filterValid}
            onChange={(e) => setFilterValid(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>

        {cartId && historyLoading && (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {cartId && !historyLoading && filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No validation history found for this cart
          </div>
        )}

        {filteredLogs.length > 0 && (
          <div className="space-y-3">
            {filteredLogs.map((log: ValidationLog, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  log.is_valid
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {log.is_valid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {log.is_valid ? 'Valid Cart' : `${log.issues_count} Issues`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {log.issue_summary}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(log.created_at).toLocaleString()}
                    </p>

                    {/* Price Changes */}
                    {(log.price_changes.increase > 0 || log.price_changes.decrease > 0) && (
                      <div className="flex gap-4 mt-3">
                        {log.price_changes.increase > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-600">Price ↑ </span>
                            <span className="font-semibold text-red-600">₹{log.price_changes.increase}</span>
                          </div>
                        )}
                        {log.price_changes.decrease > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-600">Price ↓ </span>
                            <span className="font-semibold text-green-600">₹{log.price_changes.decrease}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notification Status */}
                    <div className="mt-3">
                      {log.notification_sent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Notified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏱ Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLog(log);
                      setShowDetailsModal(true);
                    }}
                    className="ml-4 text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Validation Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedLog.is_valid ? (
                        <span className="text-green-600">✓ Valid</span>
                      ) : (
                        <span className="text-red-600">✗ Invalid ({selectedLog.issues_count} issues)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Checked</label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                    {selectedLog.issue_summary}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Message</label>
                  <p className="text-sm text-gray-600 bg-blue-50 rounded p-3">
                    {selectedLog.notification_message || 'No message'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price Increase</label>
                    <p className="mt-1 text-lg font-semibold text-red-600">
                      ₹{selectedLog.price_changes.increase}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price Decrease</label>
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      ₹{selectedLog.price_changes.decrease}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notification</label>
                    <p className="mt-1">
                      {selectedLog.notification_sent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏱ Pending
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

export default ValidationLogs;
