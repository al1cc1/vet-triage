import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch {
      setError(t('forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-bg">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>📬</div>
          <h1 className="auth-title">{t('forgotPassword.successTitle')}</h1>
          <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, margin: '12px 0 0' }}>
            {t('forgotPassword.successMsg')}
          </p>
          <p style={{ marginTop: 28 }}>
            <Link to="/login" className="btn-primary"
              style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}>
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">🐾 VetTriage</div>
        <h1 className="auth-title">{t('forgotPassword.title')}</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>{t('forgotPassword.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required autoFocus placeholder="kontakt@klinika.pl"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner /> {t('forgotPassword.loading')}
              </span>
            ) : t('forgotPassword.submit')}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">{t('forgotPassword.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
