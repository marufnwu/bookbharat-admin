import React from 'react';
import { History, Mail, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface RecoveryHistoryProps {
  cartId: number;
}

interface RecoveryEvent {
  id: number;
  type: 'email' | 'sms' | 'push' | 'manual';
  channel: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'recovered' | 'failed';
  subject?: string;
  content?: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: {
    template?: string;
    discount?: string;
    recoveryLink?: string;
  };
}

const RecoveryHistory: React.FC<RecoveryHistoryProps> = ({ cartId }) => {
  const {
    data: history,
    isLoading,
    error
  } = useQuery({
    queryKey: ['recovery-history', cartId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/recovery-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch recovery history');
      }
      return response.json() as Promise<{ success: boolean; data: RecoveryEvent[] }>;
    },
    select: (result) => result.data,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'opened':
        return <Mail className="h-4 w-4 text-green-600" />;
      case 'clicked':
        return <MessageSquare className="h-4 w-4 text-green-700" />;
      case 'recovered':
        return <CheckCircle className="h-4 w-4 text-green-800" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-green-200 text-green-900';
      case 'clicked':
        return 'bg-green-300 text-green-900';
      case 'recovered':
        return 'bg-green-500 text-white';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading recovery history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Failed to load recovery history</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No recovery history found</p>
        <p className="text-gray-400 text-sm mt-1">No recovery attempts have been made for this cart</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recovery History</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <History className="h-4 w-4" />
          <span>{history.length} events</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {history.map((event, index) => (
            <div key={event.id} className="relative flex items-start">
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white rounded-full border-2 border-gray-200">
                {getChannelIcon(event.type)}
              </div>

              {/* Event content */}
              <div className="flex-1 ml-6 pb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                          <span className="ml-1 capitalize">{event.status}</span>
                        </span>

                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                          {getChannelIcon(event.type)}
                          <span className="ml-1 capitalize">{event.type}</span>
                        </span>

                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(event.sentAt), { addSuffix: true })}
                        </span>
                      </div>

                      {event.subject && (
                        <p className="font-medium text-gray-900 mb-1">{event.subject}</p>
                      )}

                      {event.content && (
                        <p className="text-sm text-gray-600 mb-3">{event.content}</p>
                      )}

                      {/* Metadata */}
                      {event.metadata && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                          {event.metadata.template && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-500">Template:</span>
                              <span className="ml-2 text-gray-900 font-medium">{event.metadata.template}</span>
                            </div>
                          )}

                          {event.metadata.discount && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-500">Discount:</span>
                              <span className="ml-2 text-green-600 font-medium">{event.metadata.discount}</span>
                            </div>
                          )}

                          {event.metadata.recoveryLink && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-500">Recovery Link:</span>
                              <a
                                href={event.metadata.recoveryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800 font-medium truncate max-w-xs"
                              >
                                {event.metadata.recoveryLink}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Error details */}
                      {event.status === 'failed' && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-start">
                            <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-red-800">
                                {event.errorCode && `Error ${event.errorCode}`}
                              </p>
                              <p className="text-sm text-red-600 mt-1">
                                {event.errorMessage || 'An unknown error occurred'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <span>Sent:</span>
                          <span className="ml-1">{new Date(event.sentAt).toLocaleString()}</span>
                        </div>

                        {event.deliveredAt && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span>Delivered:</span>
                            <span className="ml-1">{new Date(event.deliveredAt).toLocaleString()}</span>
                          </div>
                        )}

                        {event.openedAt && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span>Opened:</span>
                            <span className="ml-1">{new Date(event.openedAt).toLocaleString()}</span>
                          </div>
                        )}

                        {event.clickedAt && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span>Clicked:</span>
                            <span className="ml-1">{new Date(event.clickedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {history.filter(e => e.type === 'email').length}
            </div>
            <div className="text-sm text-gray-600">Emails Sent</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {history.filter(e => e.status === 'delivered' || e.status === 'opened' || e.status === 'clicked').length}
            </div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {history.filter(e => e.status === 'clicked').length}
            </div>
            <div className="text-sm text-gray-600">Clicked</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {history.filter(e => e.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryHistory;