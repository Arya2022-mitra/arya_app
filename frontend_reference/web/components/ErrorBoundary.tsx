import React, { Component, ReactNode } from 'react';
import Button from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In development, also log the component stack
    if (process.env.NODE_ENV === 'development') {
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-deep-blue to-royal-blue p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-700 dark:text-gray-300">
                We encountered an unexpected error. Please try refreshing the page or going back to the home page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm">
                <summary className="cursor-pointer font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Error Details (Development Mode)
                </summary>
                <div className="space-y-2 mt-2">
                  <div>
                    <strong className="text-red-600 dark:text-red-400">Error:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong className="text-red-600 dark:text-red-400">Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  // Use window.location for navigation in error state
                  // since router context may be unavailable
                  if (typeof window !== 'undefined') {
                    window.location.href = '/';
                  }
                }}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
