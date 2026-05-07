import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CAT_INFO = [
  { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', key: 'RED' },
  { color: '#f97316', bg: '#fff7ed', border: '#fed7aa', key: 'ORANGE' },
  { color: '#ca8a04', bg: '#fefce8', border: '#fde68a', key: 'YELLOW' },
  { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', key: 'GREEN' },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-logo">🐾</div>
        <h1 className="landing-title">VetTriage</h1>
        <p className="landing-tagline">{t('landing.tagline')}</p>
        <div className="landing-actions">
          <Link to="/login" className="btn-primary btn-lg">{t('landing.loginBtn')}</Link>
          <Link to="/register" className="btn-secondary btn-lg">{t('landing.registerBtn')}</Link>
          <Link to="/about" className="btn-ghost btn-lg">{t('landing.aboutBtn')}</Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="landing-features">
        {(['fast', 'live', 'history'] as const).map(key => (
          <div key={key} className="feature-card">
            <div className="feature-icon">{t(`landing.features.${key}.icon`)}</div>
            <h3>{t(`landing.features.${key}.title`)}</h3>
            <p>{t(`landing.features.${key}.desc`)}</p>
          </div>
        ))}
      </section>

      {/* Triage categories footer */}
      <section className="landing-categories">
        <h2>{t('landing.categoriesTitle')}</h2>
        <div className="categories-grid">
          {CAT_INFO.map(c => (
            <div key={c.key} className="category-card"
              style={{ borderTopColor: c.color, background: c.bg, borderColor: c.border }}>
              <div className="category-badge" style={{ background: c.color }}>{c.key}</div>
              <h4 style={{ color: c.color }}>{t(`landing.cat.${c.key}.name`)}</h4>
              <p>{t(`landing.cat.${c.key}.desc`)}</p>
              <p className="category-examples">{t(`landing.cat.${c.key}.examples`)}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 VetTriage · {t('landing.footerDesc')}</p>
      </footer>
    </div>
  );
}
