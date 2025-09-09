"use client";

import React from "react";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>

        <p className="text-gray-600 mb-4">
          An unexpected error occurred while processing your request.
        </p>

        {error && (
          <details className="mb-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Technical details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex space-x-3 justify-center">
          <Button onClick={resetError} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button onClick={() => (window.location.href = "/")}>
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}
