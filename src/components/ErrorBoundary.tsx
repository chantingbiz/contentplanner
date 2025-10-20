import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string } | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-6">
              <h1 className="text-2xl font-bold text-red-400 mb-4">
                ⚠️ Application Error
              </h1>
              <p className="text-gray-300 mb-4">
                Something went wrong. Please refresh the page or contact support if the problem persists.
              </p>
              
              <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-4">
                <h2 className="text-lg font-semibold text-red-400 mb-2">Error Message:</h2>
                <p className="text-red-300 font-mono text-sm">{this.state.error.message}</p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded p-4">
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Stack Trace:</h2>
                <pre className="text-xs text-gray-400 overflow-auto max-h-96 whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors font-medium"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


