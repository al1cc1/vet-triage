import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../api/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
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
      const data = await apiRegister({ name, email, password });
      login({ token: data.token, role: data.role, clinicCode: data.clinicCode, clinicId: data.clinicId });
      navigate('/triage');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? t('register.error'));
    } finally {
      setLoading(false);
    }
  };

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
              onChange={e => setPassword(e.target.value)}
              required minLength={6} placeholder={t('register.passwordPlaceholder')}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? t('register.loading') : t('register.submit')}
          </button>
        </form>
        <p className="auth-footer">
          {t('register.hasAccount')} <Link to="/login">{t('register.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
