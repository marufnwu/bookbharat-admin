import React, { useState } from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components';
import { ErrorLog } from '../api/errorLogApi';
import errorLogApi from '../api/errorLogApi';
import { useNotificationStore } from '../store/notificationStore';

interface ErrorDetailModalProps {
  error: ErrorLog;
  onClose: () => void;
  onCopy: (text: string) => void;
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ error, onClose, onCopy }) => {
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  const resolveMutation = useMutation({
    mutationFn: () => errorLogApi.resolveError(error.id, notes),
    onSuccess: () => {
      showSuccess('Error marked as resolved');
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      onClose();
    },
    onError: (err: any) => showError('Failed to resolve', err.message),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Error Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Error Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Error Message</label>
                <button
                  onClick={() => onCopy(error.message)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
              <div className="bg-gray-50 rounded p-3 border">
                <p className="text-sm text-gray-900 font-mono whitespace-pre-wrap">{error.message}</p>
              </div>
            </div>

            {/* Error Type & Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-sm text-gray-900">{error.type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Level</label>
                <p className="mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                    {error.level.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Location */}
            {error.file && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <button
                    onClick={() => onCopy(`${error.file}:${error.line}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
                <div className="bg-gray-50 rounded p-3 border">
                  <p className="text-sm font-mono text-gray-900">{error.file}</p>
                  {error.line && <p className="text-sm text-gray-600 mt-1">Line {error.line}</p>}
                </div>
              </div>
            )}

            {/* Stack Trace */}
            {error.trace && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Stack Trace</label>
                  <button
                    onClick={() => onCopy(error.trace)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Full Trace
                  </button>
                </div>
                <div className="bg-gray-900 rounded p-3 border max-h-64 overflow-y-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{error.trace}</pre>
                </div>
              </div>
            )}

            {/* RequestInfo */}
            {(error.url || error.method) && (
              <div className="grid grid-cols-2 gap-4">
                {error.url && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">URL</label>
                    <p className="mt-1 text-sm text-gray-900 break-all">{error.url}</p>
                  </div>
                )}
                {error.method && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Method</label>
                    <p className="mt-1 text-sm text-gray-900">{error.method}</p>
                  </div>
                )}
              </div>
            )}

            {/* User & IP */}
            <div className="grid grid-cols-2 gap-4">
              {error.user && (
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {error.user.name} ({error.user.email})
                  </p>
                </div>
              )}
              {error.ip_address && (
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900">{error.ip_address}</p>
                </div>
              )}
            </div>

            {/* Context */}
            {error.context && Object.keys(error.context).length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Context</label>
                <div className="bg-gray-50 rounded p-3 border max-h-48 overflow-y-auto">
                  <pre className="text-xs text-gray-900 font-mono whitespace-pre-wrap">
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Tags */}
            {error.tags && error.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {error.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution */}
            {!error.is_resolved && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mark as Resolved
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about the resolution..."
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            )}

            {error.is_resolved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Resolved</span>
                </div>
                {error.resolution_notes && <p className="text-sm text-green-700">{error.resolution_notes}</p>}
                {error.resolver && (
                  <p className="text-xs text-green-600 mt-2">Resolved by {error.resolver.name}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!error.is_resolved && (
              <Button
                variant="primary"
                onClick={() => resolveMutation.mutate()}
                disabled={resolveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDetailModal;
