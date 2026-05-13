import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const sessionExpired = searchParams.get('session') === 'expired';

  useEffect(() => {
    if (isAuthenticated) navigate('/triage', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmailNotVerified(false);
    setMigrated(false);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        setEmailNotVerified(true);
        await auth.signOut();
        setLoading(false);
        return;
      }
      // keep spinner running; useEffect navigates when isAuthenticated becomes true
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
        setMigrated(true);
      } else {
        setError(t('login.error'));
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !password) return;
    setResendLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await auth.signOut();
      setResendSent(true);
    } catch {
      // ignore
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">🐾 VetTriage</div>
        <h1 className="auth-title">{t('login.title')}</h1>

        {sessionExpired && <Banner type="error">{t('login.sessionExpiredBanner')}</Banner>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required autoFocus placeholder="klinika@example.com"
            />
          </div>
          <div className="field">
            <label>{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
            />
          </div>

          {emailNotVerified && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#9a3412' }}>
              <p style={{ margin: '0 0 8px' }}>{t('login.emailNotVerified')}</p>
              {resendSent ? (
                <p style={{ margin: 0, color: '#15803d', fontWeight: 600 }}>{t('login.resendSent')}</p>
              ) : (
                <button type="button" onClick={handleResend} disabled={resendLoading || !password}
                  style={{ background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', padding: 0, fontSize: 14, fontWeight: 600, textDecoration: 'underline' }}>
                  {resendLoading ? t('login.resendLoading') : t('login.resendVerification')}
                </button>
              )}
            </div>
          )}

          {migrated && (
            <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#854d0e' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{t('login.migratedTitle')}</p>
              <p style={{ margin: '0 0 10px' }}>{t('login.migratedMsg')}</p>
              <Link to="/register" style={{ display: 'inline-block', background: '#ca8a04', color: '#fff', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                {t('login.migratedBtn')}
              </Link>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner /> {t('login.loading')}
              </span>
            ) : t('login.submit')}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 12 }}>
          <Link to="/forgot-password" style={{ color: '#64748b', fontSize: 13 }}>
            {t('login.forgotPassword')}
          </Link>
        </p>
        <p className="auth-footer">
          {t('login.noAccount')} <Link to="/register">{t('login.registerLink')}</Link>
        </p>
      </div>
    </div>
  );
}

function Banner({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  const isSuccess = type === 'success';
  return (
    <div style={{
      background: isSuccess ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`,
      borderRadius: 8, padding: '10px 14px', marginBottom: 16,
      color: isSuccess ? '#15803d' : '#dc2626', fontSize: 14,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>{isSuccess ? '✓' : '✗'}</span>{children}
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
