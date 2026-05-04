import React from "react";
import { Link } from "react-router-dom";
import MainLogo from "./MainLogo";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
    this.setState({ error, errorInfo });
    // You can hook up remote logging here (Sentry, LogRocket, etc.)
  }

  reset = () => this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });

  toggleDetails = () => this.setState((s) => ({ showDetails: !s.showDetails }));

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      return (
        <div className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center gap-3 bg-gray-700 px-6 py-4 text-white">
                <MainLogo size={32} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-200">Team Chords</p>
                  <h2 className="text-xl font-bold">Something went wrong</h2>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <p className="max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                  An unexpected error interrupted the app. You can try again, reload the page, or contact support if the issue keeps happening.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={this.reset}
                    className="rounded bg-gray-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-600"
                  >
                    Try again
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Reload page
                  </button>

                  <Link
                    to="/library"
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Go to Library
                  </Link>

                  <a
                    href={`mailto:support@teamchords.com?subject=Team%20Chords%20Error%20Report&body=${encodeURIComponent(String(error))}`}
                    className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Contact support
                  </a>

                  <button
                    onClick={this.toggleDetails}
                    className="ml-auto rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                  >
                    {showDetails ? "Hide details" : "Show details"}
                  </button>
                </div>

                {showDetails && (
                  <details className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <summary className="cursor-pointer font-medium text-gray-800">Error details</summary>
                    <pre className="mt-3 whitespace-pre-wrap wrap-break-word text-xs leading-5 text-gray-600">
{String(error)}
{errorInfo ? "\n\n" + (errorInfo.componentStack || JSON.stringify(errorInfo)) : ""}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
