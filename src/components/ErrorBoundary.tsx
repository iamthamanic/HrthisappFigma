import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('Error details:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      return (
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Etwas ist schiefgelaufen
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Die Anwendung hat einen unerwarteten Fehler festgestellt.
                  </p>
                </div>
              </div>

              {/* Error Details */}
              {error && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-xs font-medium text-gray-700 mb-2">Fehlerdetails:</p>
                  <div className="text-xs text-gray-600 font-mono">
                    <p className="font-semibold text-red-600 mb-1">{error.name}: {error.message}</p>
                    {error.stack && (
                      <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32 mt-2 p-2 bg-white rounded border border-gray-200">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Component Stack */}
              {errorInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-xs font-medium text-gray-700 mb-2">Component Stack:</p>
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono overflow-auto max-h-32 p-2 bg-white rounded border border-gray-200">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Zur Startseite
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Seite neu laden
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Wenn das Problem weiterhin besteht, öffne die Browser-Konsole (F12) für weitere Details
                  oder kontaktiere den Support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
