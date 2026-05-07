import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 96, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 48, margin: '8px 0' }}>🐾</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>{t('notFound.title')}</h1>
      <p style={{ color: '#64748b', marginBottom: 28 }}>{t('notFound.desc')}</p>
      <Link to="/" className="btn-primary">{t('notFound.home')}</Link>
    </div>
  );
}
