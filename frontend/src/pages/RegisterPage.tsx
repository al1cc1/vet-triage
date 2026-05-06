import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      setError(msg ?? 'Rejestracja nie powiodła się');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">🐾 VetTriage</div>
        <h1 className="auth-title">Rejestracja kliniki</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Nazwa kliniki</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required autoFocus placeholder="Klinika Weterynaryjna XYZ"
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="kontakt@klinika.pl"
            />
          </div>
          <div className="field">
            <label>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required minLength={6} placeholder="Minimum 6 znaków"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Rejestracja…' : 'Załóż konto'}
          </button>
        </form>
        <p className="auth-footer">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}
