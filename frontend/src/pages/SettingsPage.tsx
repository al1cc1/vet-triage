import { useEffect, useState, type FormEvent } from 'react';
import { Copy, CheckCheck, Plus, ExternalLink } from 'lucide-react';
import { getSettings, updateSettings } from '../api/clinic';
import { getDoctors, createDoctor } from '../api/users';
import type { ClinicSettings, UserResponse } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [doctors, setDoctors] = useState<UserResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPin, setDoctorPin] = useState('');
  const [doctorError, setDoctorError] = useState('');
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [iframeCopied, setIframeCopied] = useState(false);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      document.documentElement.style.setProperty('--accent', s.accentColor);
    }).catch(() => {});
    getDoctors().then(setDoctors).catch(() => {});
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateSettings({ accentColor: settings.accentColor, language: settings.language });
      setSettings(updated);
      document.documentElement.style.setProperty('--accent', updated.accentColor);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!settings) return;
    navigator.clipboard.writeText(settings.clinicCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddDoctor = async (e: FormEvent) => {
    e.preventDefault();
    setDoctorError('');
    setDoctorLoading(true);
    try {
      const doc = await createDoctor({ email: doctorEmail, pin: doctorPin });
      setDoctors(prev => [...prev, doc]);
      setDoctorEmail('');
      setDoctorPin('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDoctorError(msg ?? 'Nie udało się dodać lekarza');
    } finally {
      setDoctorLoading(false);
    }
  };

  if (!settings) return <div className="page"><div className="empty-state">Ładowanie…</div></div>;

  return (
    <div className="page">
      <h1 className="page-title">Ustawienia</h1>

      {/* Clinic settings */}
      <div className="card mb-4">
        <h2 className="section-title">Wygląd i język</h2>
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="field">
              <label>Kolor akcentu</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={e => {
                    setSettings(s => s ? { ...s, accentColor: e.target.value } : s);
                    document.documentElement.style.setProperty('--accent', e.target.value);
                  }}
                  className="color-input"
                />
                <span className="color-value">{settings.accentColor}</span>
              </div>
            </div>
            <div className="field">
              <label>Język</label>
              <select
                value={settings.language}
                onChange={e => setSettings(s => s ? { ...s, language: e.target.value } : s)}
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Zapisywanie…' : 'Zapisz ustawienia'}
          </button>
        </form>
      </div>

      {/* Clinic code */}
      <div className="card mb-4">
        <h2 className="section-title">Kod kliniki</h2>
        <p className="text-muted mb-2">Przekaż ten kod lekarzom, aby mogli się zalogować.</p>
        <div className="code-display">
          <span className="clinic-code">{settings.clinicCode}</span>
          <button className="btn-secondary btn-icon" onClick={handleCopy} title="Kopiuj">
            {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
            {copied ? 'Skopiowano' : 'Kopiuj'}
          </button>
        </div>
      </div>

      {/* Lobby screen */}
      <div className="card mb-4">
        <h2 className="section-title">Ekran poczekalni</h2>
        <p className="text-muted mb-4">Wyświetl kolejkę triażu na dużym ekranie w poczekalni.</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            className="btn-primary btn-icon"
            onClick={() => window.open(`/queue/${settings.clinicCode}`, '_blank')}
          >
            <ExternalLink size={16} />
            Otwórz ekran poczekalni
          </button>
        </div>
        <div className="field">
          <label>Kod iframe do osadzenia na stronie kliniki</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 4 }}>
            <textarea
              readOnly
              rows={3}
              value={`<iframe src="${window.location.origin}/queue/${settings.clinicCode}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, background: '#f8fafc', resize: 'none' }}
            />
            <button
              className="btn-secondary btn-icon"
              onClick={() => {
                navigator.clipboard.writeText(
                  `<iframe src="${window.location.origin}/queue/${settings.clinicCode}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`
                );
                setIframeCopied(true);
                setTimeout(() => setIframeCopied(false), 2000);
              }}
            >
              {iframeCopied ? <CheckCheck size={16} /> : <Copy size={16} />}
              {iframeCopied ? 'Skopiowano' : 'Kopiuj kod'}
            </button>
          </div>
        </div>
      </div>

      {/* Doctors */}
      <div className="card">
        <h2 className="section-title">Lekarze</h2>
        <form onSubmit={handleAddDoctor} className="inline-form mb-4">
          <div className="field">
            <label>Email lekarza</label>
            <input
              type="email"
              value={doctorEmail}
              onChange={e => setDoctorEmail(e.target.value)}
              required placeholder="dr.kowalski@klinika.pl"
            />
          </div>
          <div className="field">
            <label>PIN (6 cyfr)</label>
            <input
              value={doctorPin}
              onChange={e => setDoctorPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required pattern="\d{6}" placeholder="123456"
            />
          </div>
          <button type="submit" className="btn-primary btn-icon" disabled={doctorLoading}>
            <Plus size={16} />
            {doctorLoading ? 'Dodawanie…' : 'Dodaj'}
          </button>
        </form>
        {doctorError && <p className="form-error mb-2">{doctorError}</p>}

        {doctors.length === 0 ? (
          <p className="text-muted">Brak lekarzy. Dodaj pierwszego powyżej.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Email</th><th>Rola</th></tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id}>
                  <td>{d.email}</td>
                  <td><span className="pill pill-green">Lekarz</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
