/**
 * ADVANCED ERROR BOUNDARY
 * =======================
 * Enhanced error boundary with recovery and logging
 * 
 * Part of Phase 3 - Priority 4 - Error Handling
 * 
 * Features:
 * - Automatic error logging
 * - User-friendly error UI
 * - Recovery mechanisms
 * - Error details toggle
 * - Retry functionality
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw, Home, Bug } from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { logError, getErrorLogger } from '../utils/errors/ErrorLogger';
import { getErrorSeverity } from '../utils/errors/ErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorCount: number;
}

/**
 * Advanced Error Boundary Component
 */
export class ErrorBoundaryAdvanced extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: props.showDetails ?? false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error
    logError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Update state
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/dashboard';
  };

  toggleDetails = (): void => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Get error severity
      const severity = getErrorSeverity(this.state.error);
      const isCritical = severity === 'critical' || severity === 'high';

      return (
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center">
              {/* Error Icon */}
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  isCritical
                    ? 'bg-red-100 text-red-600'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                <AlertTriangle className="w-8 h-8" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl mb-2">
                {isCritical ? 'Kritischer Fehler' : 'Ein Fehler ist aufgetreten'}
              </h1>

              {/* Error Message */}
              <p className="text-gray-600 mb-6">
                {this.state.error.message ||
                  'Beim Laden der Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.'}
              </p>

              {/* Error Count Warning */}
              {this.state.errorCount > 1 && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    ⚠️ Dieser Fehler ist bereits{' '}
                    <strong>{this.state.errorCount} Mal</strong> aufgetreten.
                    {this.state.errorCount >= 3 &&
                      ' Bitte kontaktieren Sie den Support.'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Erneut versuchen
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Seite neu laden
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Zum Dashboard
                </Button>
              </div>

              {/* Toggle Details Button */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={this.toggleDetails}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 mx-auto mb-4"
                >
                  <Bug className="w-4 h-4" />
                  {this.state.showDetails
                    ? 'Details ausblenden'
                    : 'Details anzeigen'}
                </Button>
              )}

              {/* Error Details (Development Only) */}
              {this.state.showDetails && this.state.errorInfo && (
                <div className="mt-6 text-left">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <h3 className="text-sm mb-2">
                      Error Message:
                    </h3>
                    <pre className="text-xs text-red-600 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                      {this.state.error.message}
                    </pre>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <h3 className="text-sm mb-2">
                      Stack Trace:
                    </h3>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                      {this.state.error.stack}
                    </pre>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <h3 className="text-sm mb-2">
                      Component Stack:
                    </h3>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>

                  {/* Error Statistics */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm mb-2">
                      📊 Error Statistics:
                    </h3>
                    <div className="text-xs text-gray-700">
                      {(() => {
                        const stats = getErrorLogger().getStatistics();
                        return (
                          <>
                            <p>Total Errors: {stats.total}</p>
                            <p>
                              Critical: {stats.bySeverity.critical}, High:{' '}
                              {stats.bySeverity.high}, Medium:{' '}
                              {stats.bySeverity.medium}, Low:{' '}
                              {stats.bySeverity.low}
                            </p>
                            <p>Last 24 Hours: {stats.last24Hours}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Support Info */}
              <div className="mt-6 text-sm text-gray-500">
                <p>
                  Wenn das Problem weiterhin besteht, kontaktieren Sie bitte den
                  Support.
                </p>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of Error Boundary (using React.createElement)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryAdvanced {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundaryAdvanced>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

export default ErrorBoundaryAdvanced;
