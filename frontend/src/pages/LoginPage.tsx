import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiLogin({ email, password });
      login({ token: data.token, role: data.role, clinicCode: data.clinicCode, clinicId: data.clinicId });
      navigate('/triage');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">🐾 VetTriage</div>
        <h1 className="auth-title">{t('login.title')}</h1>
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
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>
        <p className="auth-footer">
          {t('login.noAccount')} <Link to="/register">{t('login.registerLink')}</Link>
        </p>
      </div>
    </div>
  );
}
