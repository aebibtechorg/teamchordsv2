import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // You can hook up remote logging here (Sentry, LogRocket, etc.)
  }

  reset = () => this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });

  toggleDetails = () => this.setState((s) => ({ showDetails: !s.showDetails }));

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 text-gray-900">
          <div className="max-w-2xl w-full bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="mb-4">An unexpected error occurred. You can try reloading or report the issue to the team.</p>

            <div className="flex gap-3 items-center">
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:opacity-95"
              >
                Try again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:opacity-95"
              >
                Reload page
              </button>

              <a
                href={`mailto:support@example.com?subject=Error%20Report&body=${encodeURIComponent(String(error))}`}
                className="px-4 py-2 bg-red-600 text-white rounded hover:opacity-95"
              >
                Report
              </a>

              <button
                onClick={this.toggleDetails}
                className="px-3 py-2 ml-auto border rounded text-sm"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>

            {showDetails && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-sm overflow-auto">
                <summary className="cursor-pointer mb-2">Details</summary>
                <pre className="whitespace-pre-wrap">
{String(error)}
{errorInfo ? '\n\n' + (errorInfo.componentStack || JSON.stringify(errorInfo)) : ''}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
