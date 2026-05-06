import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#ef4444' }}>Błąd aplikacji</h1>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fee2e2', padding: 16, borderRadius: 8 }}>
            {(error as Error).message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666', marginTop: 8 }}>
            {(error as Error).stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
