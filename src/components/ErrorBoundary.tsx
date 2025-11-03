'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="border-4 border-black bg-white p-6 max-w-md"
               style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
            <div className="text-2xl font-bold mb-2">
              ⚠ SYSTEM ERROR
            </div>
            <div className="text-sm text-gray-700 mb-4 font-mono">
              {this.state.error?.message || 'AN UNEXPECTED ERROR OCCURRED'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
            >
              ↻ RELOAD PAGE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

