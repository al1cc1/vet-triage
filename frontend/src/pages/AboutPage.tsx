import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  {
    key: 'RED', color: '#ef4444', bg: '#fef2f2', border: '#fecaca',
    symptoms: ['Brak oddechu / zatrzymanie krążenia', 'Wstrząs', 'Drgawki', 'Krwotok masywny', 'Utrata przytomności'],
    multiplier: 1,
  },
  {
    key: 'ORANGE', color: '#f97316', bg: '#fff7ed', border: '#fed7aa',
    symptoms: ['Trudności oddechowe', 'Bladość błon śluzowych', 'Silny ból', 'Uraz wielomiejscowy', 'Niedrożność moczowa'],
    multiplier: 2,
  },
  {
    key: 'YELLOW', color: '#ca8a04', bg: '#fefce8', border: '#fde68a',
    symptoms: ['Wymioty / biegunka', 'Kulawizna', 'Gorączka', 'Dezorientacja', 'Otwarta rana'],
    multiplier: 4,
  },
  {
    key: 'GREEN', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    symptoms: ['Szczepienie / kontrola', 'Pielęgnacja', 'Brak apetytu (łagodny)', 'Kaszl bez duszności'],
    multiplier: 8,
  },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <div className="about-container">
        <Link to="/" className="btn-secondary btn-icon" style={{ marginBottom: 24, display: 'inline-flex' }}>
          ← {t('about.back')}
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48 }}>🐾</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 4px' }}>VetTriage</h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>{t('about.subtitle')}</p>
        </div>

        <div className="card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{t('about.whatIsTitle')}</h2>
          <p style={{ color: '#475569', lineHeight: 1.8 }}>{t('about.whatIsDesc')}</p>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('about.categoriesTitle')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.key} className="card" style={{ borderTopColor: cat.color, borderTop: `4px solid ${cat.color}`, background: cat.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ background: cat.color, color: '#fff', fontWeight: 800, fontSize: 13, padding: '3px 12px', borderRadius: 99 }}>{cat.key}</span>
                <span style={{ color: cat.color, fontWeight: 700, fontSize: 16 }}>{t(`about.cat.${cat.key}.name`)}</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
                  {t('about.baseWait')} × {cat.multiplier}
                </span>
              </div>
              <p style={{ color: '#475569', marginBottom: 10, lineHeight: 1.7 }}>{t(`about.cat.${cat.key}.desc`)}</p>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748b' }}>
                  {t('about.examplesLabel')}
                </span>
                <ul style={{ marginTop: 6, paddingLeft: 18, color: '#475569' }}>
                  {cat.symptoms.map(s => <li key={s} style={{ fontSize: 13, marginBottom: 2 }}>{s}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 32, background: '#f8fafc' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{t('about.algorithmTitle')}</h2>
          <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: 12 }}>{t('about.algorithmDesc')}</p>
          <code style={{ background: '#e2e8f0', padding: '8px 14px', borderRadius: 6, fontSize: 13, display: 'block', fontFamily: 'monospace' }}>
            {t('about.algorithmFormula')}
          </code>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/register" className="btn-primary" style={{ marginRight: 12 }}>{t('landing.registerBtn')}</Link>
          <Link to="/login" className="btn-secondary">{t('landing.loginBtn')}</Link>
        </div>
      </div>
    </div>
  );
}
