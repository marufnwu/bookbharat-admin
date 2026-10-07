import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level crash guard for the admin app. A render error in any page used to
 * white-screen the whole panel; with this mounted around the routed content,
 * the rest of the shell (sidebar, header) stays usable and the admin gets a
 * recovery action. Route changes clear the error automatically so users can
 * navigate away without a full reload.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Surface in the console; a reporting hook (Sentry etc.) can attach here.
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error, errorInfo.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Clear the crash state when the user navigates elsewhere
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-error-100 p-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            This page failed to render. You can try again or navigate elsewhere — the rest of the
            admin panel is unaffected.
          </p>
          {this.state.error && (
            <pre className="mt-3 max-w-xl overflow-auto rounded-lg bg-gray-50 p-3 text-left text-xs text-gray-600">
              {this.state.error.message}
            </pre>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/dashboard')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
