'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-bg-primary">
          <div className="bg-bg-card border-2 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center">
            <div className="h-20 w-20 mx-auto mb-6 bg-red-600/10 border-2 border-red-600 flex items-center justify-center">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-text-primary uppercase italic tracking-tighter mb-2">
              Error Inesperado
            </h2>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mb-6">
              Algo salió mal. Intentá recargar la sección.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-accent-primary transition-colors border-b-4 border-accent-primary active:translate-y-1"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
