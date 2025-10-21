import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string } | null;
}

/**
 * AppErrorBoundary - Global error boundary for production crashes
 * 
 * - Catches React errors and renders fallback UI
 * - Logs error details to console and sessionStorage
 * - Provides "Copy details" button for easy error reporting
 */
export default class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error('[crash]', error, errorInfo);
    
    // Store crash details in sessionStorage
    const crashData = {
      type: 'react-error',
      message: error.message,
      stack: error.stack || '',
      componentStack: errorInfo.componentStack || '',
      href: window.location.href,
      at: new Date().toISOString(),
    };
    
    sessionStorage.setItem('lastCrash', JSON.stringify(crashData));
    
    this.setState({ errorInfo });
  }

  handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    
    const details = [
      'ERROR DETAILS',
      '=============',
      '',
      `Message: ${error?.message || 'Unknown error'}`,
      '',
      'Stack:',
      error?.stack || 'No stack trace',
      '',
      'Component Stack:',
      errorInfo?.componentStack || 'No component stack',
      '',
      `URL: ${window.location.href}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n');

    navigator.clipboard.writeText(details).then(() => {
      alert('Error details copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  static clearCrash() {
    sessionStorage.removeItem('lastCrash');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0c0f] text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            {/* Crash Panel */}
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              
              <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
              
              <p className="text-white/70 mb-6">
                The app encountered an unexpected error. You can try reloading the page or copy the error details below.
              </p>

              {/* Error Message */}
              {this.state.error && (
                <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
                  <div className="text-xs text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-brand hover:bg-brand/90 text-white font-semibold rounded-lg transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={this.handleCopyDetails}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
                >
                  Copy Details
                </button>
              </div>

              {/* Dev Hint */}
              <p className="text-xs text-white/40 mt-6">
                Error details are stored in <code className="px-1 py-0.5 bg-white/10 rounded">sessionStorage.lastCrash</code>
              </p>
            </div>

            {/* Stack Trace (collapsed) */}
            {this.state.error?.stack && (
              <details className="bg-white/5 border border-white/10 rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-medium text-white/70 hover:text-white">
                  Stack Trace (click to expand)
                </summary>
                <pre className="mt-3 text-xs text-white/60 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {this.state.error.stack}
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

