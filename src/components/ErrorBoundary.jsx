import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("React Error Boundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #f44336',
          borderRadius: '4px',
          backgroundColor: '#ffebee'
        }}>
          <h2 style={{ color: '#d32f2f' }}>Something went wrong</h2>
          <p>The app encountered an error and couldn't continue. Here are the details:</p>
          <details style={{
            whiteSpace: 'pre-wrap',
            margin: '10px 0',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: '4px'
          }}>
            <summary>Show Error Details</summary>
            <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
            <p><strong>Component Stack:</strong> {this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 