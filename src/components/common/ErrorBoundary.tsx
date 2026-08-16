import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Durga Mandal Application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-2xl)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-danger-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-md)',
            color: 'var(--color-danger)'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
            काहीतरी अनपेक्षित त्रुटी आली आहे
          </h2>
          <p style={{ maxWidth: '480px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
            आपल्या विनंतीवर प्रक्रिया करताना अडचण आली. कृपया हे पृष्ठ रीलोड करा किंवा पुन्हा प्रयत्न करा.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={18} />
            <span>पृष्ठ रीलोड करा (Reload)</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
