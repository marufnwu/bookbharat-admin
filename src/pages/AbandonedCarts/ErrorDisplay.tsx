import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  title = "Error"
}) => {
  if (!error) return null;

  // Extract error details
  const getErrorMessage = (error: any) => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.response?.data?.errors) {
      // Handle validation errors
      const errors = error.response.data.errors;
      if (typeof errors === 'object') {
        return Object.values(errors).flat().join(', ');
      }
      return errors;
    }
    if (error?.message) return error.message;
    if (error?.status === 401) return 'Authentication failed. Please log in again.';
    if (error?.status === 403) return 'You do not have permission to perform this action.';
    if (error?.status === 404) return 'The requested resource was not found.';
    if (error?.status === 422) return 'Validation failed. Please check your input.';
    if (error?.status === 500) return 'Server error. Please try again later.';
    return 'An unexpected error occurred.';
  };

  const getErrorDetails = (error: any) => {
    const details: string[] = [];

    if (error?.response?.data?.errors && typeof error.response.data.errors === 'object') {
      Object.entries(error.response.data.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          details.push(`${field}: ${messages.join(', ')}`);
        } else {
          details.push(`${field}: ${messages}`);
        }
      });
    }

    if (error?.response?.data?.debug) {
      details.push(`Debug: ${error.response.data.debug}`);
    }

    if (error?.response?.status) {
      details.push(`Status: ${error.response.status} ${error.response.statusText || ''}`);
    }

    return details;
  };

  const getErrorType = (error: any) => {
    if (error?.response?.status === 422) return 'validation';
    if (error?.response?.status === 401) return 'auth';
    if (error?.response?.status === 403) return 'permission';
    if (error?.response?.status === 404) return 'not-found';
    if (error?.response?.status >= 500) return 'server';
    return 'network';
  };

  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(error);
  const errorDetails = getErrorDetails(error);

  const errorTypeStyles = {
    validation: 'border-yellow-500 bg-yellow-50 text-yellow-800',
    auth: 'border-red-500 bg-red-50 text-red-800',
    permission: 'border-orange-500 bg-orange-50 text-orange-800',
    'not-found': 'border-blue-500 bg-blue-50 text-blue-800',
    server: 'border-purple-500 bg-purple-50 text-purple-800',
    network: 'border-gray-500 bg-gray-50 text-gray-800',
  };

  const errorIcons = {
    validation: AlertCircle,
    auth: AlertCircle,
    permission: AlertCircle,
    'not-found': AlertCircle,
    server: AlertCircle,
    network: AlertCircle,
  };

  const Icon = errorIcons[errorType as keyof typeof errorIcons] || AlertCircle;

  return (
    <div className={`rounded-lg border p-4 ${errorTypeStyles[errorType as keyof typeof errorTypeStyles]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm mt-1">{errorMessage}</p>

            {errorDetails.length > 0 && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer hover:underline">Show details</summary>
                <div className="mt-2 space-y-1">
                  {errorDetails.map((detail, index) => (
                    <div key={index} className="pl-4 border-l-2 border-current opacity-75">
                      {detail}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;