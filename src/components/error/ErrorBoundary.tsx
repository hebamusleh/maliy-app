"use client";

import React, { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary Component
 * Catches errors in child components and displays error UI
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error("Error caught by boundary:", error, errorInfo);

    // In production, you could send to error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: sendToErrorTracker(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
                <h1 className="text-2xl font-heading font-bold text-center text-gray-900 mb-2">
                  حدث خطأ ما
                </h1>
                <p className="text-gray-600 text-center mb-4">
                  نعتذر عن الإزعاج. حدث خطأ غير متوقع. يرجى محاولة إعادة
                  التحميل.
                </p>
                <details className="mb-6 p-3 bg-gray-50 rounded text-sm text-gray-600">
                  <summary className="cursor-pointer font-semibold mb-2">
                    تفاصيل الخطأ
                  </summary>
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {this.state.error?.toString()}
                  </pre>
                </details>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition"
                  >
                    حاول مرة أخرى
                  </button>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 transition"
                  >
                    الصفحة الرئيسية
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
