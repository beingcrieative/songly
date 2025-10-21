"use client";

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fffbf7] via-[#fef4ef] to-[#ffeae3] p-4">
          <div className="w-full max-w-2xl surface-card p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Er ging iets mis
            </h1>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-semibold text-red-800 mb-2">Error:</p>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </div>

              {this.state.errorInfo && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Stack:</p>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-full bg-gradient-to-r from-[#7f5af0] to-[#ff6aa2] px-6 py-3 text-sm font-semibold text-white shadow-lg"
              >
                Pagina herladen
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="w-full rounded-full border border-white/60 bg-white/80 px-6 py-3 text-sm text-[rgba(31,27,45,0.6)]"
              >
                Probeer opnieuw
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
