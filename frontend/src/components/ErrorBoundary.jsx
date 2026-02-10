import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      const isDevelopment = import.meta.env?.DEV === true;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-100 text-red-800 p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="text-lg text-center mb-4">We&apos;re sorry for the inconvenience. Please try refreshing the page.</p>
          {this.props.children} 
          {isDevelopment && this.state.errorInfo && (
            <details className="mt-4 p-2 bg-red-200 rounded-md text-sm text-red-900">
              <summary>Error Details</summary>
              <pre className="whitespace-pre-wrap break-all">{this.state.error && this.state.error.toString()}</pre>
              <pre className="whitespace-pre-wrap break-all">{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;