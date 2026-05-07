import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Toast { id: number; type: 'network' | 'server'; }

export default function NetworkErrorBanner() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: Event) => {
      const { type } = (e as CustomEvent).detail as { type: 'network' | 'server' };
      const id = Date.now();
      setToasts(prev => [...prev, { id, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(toast => (
        <div key={toast.id} className="app-toast">
          <span>{toast.type === 'network' ? t('errors.network') : t('errors.server')}</span>
          <button
            style={{ pointerEvents: 'auto' }}
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
