import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface WebhookDetailModalProps {
  webhook: any;
  onClose: () => void;
}

const WebhookDetailModal = ({ webhook, onClose }: WebhookDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Webhook Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold">{webhook.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-semibold">{webhook.payment_transaction_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gateway</p>
                <p className="font-semibold uppercase">{webhook.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  webhook.payment_status === 'paid' || webhook.payment_status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : webhook.payment_status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {webhook.payment_status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Received At</p>
                <p className="font-semibold">
                  {format(new Date(webhook.updated_at), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
          </div>

          {/* Gateway Response/Request */}
          {webhook.parsed_response && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gateway Response</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(webhook.parsed_response, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This data represents the webhook/callback received from the payment gateway.
              Webhook signatures are validated on the backend before processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WebhookLog() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [gateway, setGateway] = useState('');
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['webhook-logs', page, perPage, gateway],
    queryFn: async () => {
      const params: any = { page, per_page: perPage };
      if (gateway) params.gateway = gateway;

      const response = await axios.get(`${API_URL}/admin/payment-transactions/webhooks`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    }
  });

  const getStatusIcon = (status: string) => {
    if (status === 'paid' || status === 'success' || status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (status === 'failed' || status === 'cancelled') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Webhook Logs</h1>
        <p className="mt-2 text-gray-600">Monitor webhook events from payment gateways</p>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Gateways</option>
              <option value="razorpay">Razorpay</option>
              <option value="payu">PayU</option>
              <option value="phonepe">PhonePe</option>
              <option value="cashfree">Cashfree</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Webhook Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : data && data.data && data.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.map((webhook: any) => (
                    <tr key={webhook.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusIcon(webhook.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {webhook.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {webhook.payment_transaction_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                        {webhook.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          webhook.payment_status === 'paid' || webhook.payment_status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : webhook.payment_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {webhook.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(webhook.updated_at), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedWebhook(webhook)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{data.pagination.from}</span> to{' '}
                  <span className="font-medium">{data.pagination.to}</span> of{' '}
                  <span className="font-medium">{data.pagination.total}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-1 text-sm font-medium">
                    Page {page} of {data.pagination.last_page}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.last_page}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No webhook logs found</p>
          </div>
        )}
      </div>

      {/* Webhook Detail Modal */}
      {selectedWebhook && (
        <WebhookDetailModal
          webhook={selectedWebhook}
          onClose={() => setSelectedWebhook(null)}
        />
      )}
    </div>
  );
}

