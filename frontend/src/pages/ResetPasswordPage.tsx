import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword as apiResetPassword } from '../api/auth';

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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdTouched, setPwdTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalidToken, setInvalidToken] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const token = searchParams.get('token') ?? '';
  const pwdValid = PWD_RULES.every(r => r.test(password));
  const pwdMatch = password === confirm;
  const canSubmit = pwdValid && pwdMatch && confirm.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;
    setLoading(true);
    setError('');
    try {
      await apiResetPassword(token, password);
      navigate('/login?reset=true');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      if (msg === 'INVALID_RESET_TOKEN') {
        setInvalidToken(true);
      } else {
        setError(t('resetPassword.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token || invalidToken) {
    return (
      <div className="auth-bg">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>⚠️</div>
          <h1 className="auth-title" style={{ color: '#dc2626' }}>{t('resetPassword.invalidToken')}</h1>
          <p style={{ marginTop: 28 }}>
            <Link to="/forgot-password" className="btn-primary"
              style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}>
              {t('resetPassword.invalidTokenLink')}
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
        <h1 className="auth-title">{t('resetPassword.title')}</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>{t('resetPassword.newPassword')}</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPwdTouched(true); }}
              required autoFocus placeholder="••••••••"
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
            <label>{t('resetPassword.confirmPassword')}</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setConfirmTouched(true); }}
              required placeholder="••••••••"
            />
            {confirmTouched && confirm && !pwdMatch && (
              <p style={{ margin: '6px 0 0', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>✗</span>{t('resetPassword.pwdMatch')}
              </p>
            )}
            {confirmTouched && confirm && pwdMatch && (
              <p style={{ margin: '6px 0 0', color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700 }}>✓</span>{t('resetPassword.pwdMatch')}
              </p>
            )}
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={loading || !canSubmit}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner /> {t('resetPassword.loading')}
              </span>
            ) : t('resetPassword.submit')}
          </button>
        </form>
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
