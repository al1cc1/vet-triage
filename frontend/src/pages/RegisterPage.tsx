import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { registerClinic } from '../api/auth';

interface PwdRule {
  key: string;
  test: (pw: string) => boolean;
}

const PWD_RULES: PwdRule[] = [
  { key: 'pwdLength', test: pw => pw.length >= 8 },
  { key: 'pwdUpper',  test: pw => /[A-Z]/.test(pw) },
  { key: 'pwdLower',  test: pw => /[a-z]/.test(pw) },
  { key: 'pwdDigit',  test: pw => /\d/.test(pw) },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdTouched, setPwdTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  const { t } = useTranslation();

  const pwdValid = PWD_RULES.every(r => r.test(password));
  const pwdMatch = password === confirm;
  const canSubmit = pwdValid && pwdMatch && name.trim() && email.trim() && confirm.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      // Register clinic in backend while still signed in (token available)
      await registerClinic({ clinicName: name });
      await signOut(auth);
      setSuccessEmail(email);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (code === 'auth/email-already-in-use') {
        setError(t('register.error') + ' — email już istnieje');
      } else {
        setError(msg ?? t('register.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (successEmail) {
    return (
      <div className="auth-bg">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>📧</div>
          <h1 className="auth-title">{t('register.successTitle')}</h1>
          <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, margin: '12px 0 0' }}>
            {t('register.successMsg', { email: successEmail })}
          </p>
          <p style={{ marginTop: 28 }}>
            <Link to="/login" className="btn-primary"
              style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}>
              {t('register.goToLogin')}
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
        <h1 className="auth-title">{t('register.title')}</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>{t('register.clinicName')}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required autoFocus placeholder={t('register.clinicNamePlaceholder')}
            />
          </div>
          <div className="field">
            <label>{t('register.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="kontakt@klinika.pl"
            />
          </div>
          <div className="field">
            <label>{t('register.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPwdTouched(true); }}
              required placeholder={t('register.passwordPlaceholder')}
            />
            {pwdTouched && (
              <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', fontSize: 13 }}>
                {PWD_RULES.map(r => {
                  const ok = r.test(password);
                  return (
                    <li key={r.key} style={{ color: ok ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, width: 12 }}>{ok ? '✓' : '✗'}</span>
                      {t(`register.${r.key}`)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="field">
            <label>{t('register.confirmPassword')}</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setConfirmTouched(true); }}
              required placeholder={t('register.confirmPasswordPlaceholder')}
            />
            {confirmTouched && confirm && !pwdMatch && (
              <p style={{ margin: '6px 0 0', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>✗</span>{t('register.pwdMatch')}
              </p>
            )}
            {confirmTouched && confirm && pwdMatch && (
              <p style={{ margin: '6px 0 0', color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>✓</span>{t('register.pwdMatch')}
              </p>
            )}
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={loading || !canSubmit}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner /> {t('register.loading')}
              </span>
            ) : t('register.submit')}
          </button>
        </form>
        <p className="auth-footer">
          {t('register.hasAccount')} <Link to="/login">{t('register.loginLink')}</Link>
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
