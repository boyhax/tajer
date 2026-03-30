import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              We encountered an unexpected error. Please try refreshing the page or contact support if the issue persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white py-4 rounded-2xl font-black hover:bg-gray-900 transition-all active:scale-95"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-8 p-4 bg-gray-100 rounded-xl text-left text-xs overflow-auto max-h-40 text-red-600">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
