import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              The character editor encountered an error. Please check the browser console for details.
            </p>
            
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
            >
              Reload Page
            </button>

            <details className="mt-6 bg-gray-800 p-4 rounded">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 text-sm text-red-300 whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;