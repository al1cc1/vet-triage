import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Copy, CheckCheck, ExternalLink, Smartphone, Trash2,
  Building2, Palette, Bell, Shield, Database, Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  reauthenticateWithCredential, EmailAuthProvider, updatePassword as fbUpdatePassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import i18n from '../i18n';
import { getSettings, updateSettings, getDevices, deleteDevice, deleteAccount, getAllHistory } from '../api/clinic';
import { exportVisitsCSV } from '../utils/csvExport';
import type { ClinicSettings, DeviceToken } from '../types';

const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ClinicSettings | null>(null);

  // ── Profil ──
  const [profileName, setProfileName] = useState('');
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // ── Wygląd ──
  const [appearanceSaving, setAppearanceSaving] = useState(false);

  // ── Powiadomienia ──
  const [notifyRed, setNotifyRed] = useState(true);
  const [notifyOrange, setNotifyOrange] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // ── Bezpieczeństwo ──
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'saving' | 'changed' | 'error' | 'wrongOld'>('idle');

  // ── Dane & eksport ──
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Aplikacja mobilna ──
  const [copied, setCopied] = useState(false);
  const [iframeCopied, setIframeCopied] = useState(false);
  const [mobilePinInput, setMobilePinInput] = useState('');
  const [mobilePinSaving, setMobilePinSaving] = useState(false);
  const [mobilePinStatus, setMobilePinStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [devices, setDevices] = useState<DeviceToken[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setProfileName(s.name);
      setNotifyRed(s.notifyRed);
      setNotifyOrange(s.notifyOrange);
      setMobilePinInput(s.mobilePin ?? '');
      document.documentElement.style.setProperty('--accent', s.accentColor);
      loadDevices(s.clinicCode);
    }).catch(() => {});
  }, []);

  const loadDevices = (clinicCode: string) => {
    setDevicesLoading(true);
    getDevices(clinicCode)
      .then(setDevices)
      .catch(() => setDevices([]))
      .finally(() => setDevicesLoading(false));
  };

  // ── Profil ──
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings || !profileName.trim()) return;
    setProfileStatus('saving');
    try {
      const updated = await updateSettings({ name: profileName.trim() });
      setSettings(updated);
      setProfileStatus('saved');
      setTimeout(() => setProfileStatus('idle'), 2000);
    } catch {
      setProfileStatus('idle');
    }
  };

  // ── Wygląd ──
  const handleSaveAppearance = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setAppearanceSaving(true);
    try {
      const updated = await updateSettings({ accentColor: settings.accentColor, language: settings.language });
      setSettings(updated);
      document.documentElement.style.setProperty('--accent', updated.accentColor);
      i18n.changeLanguage(updated.language);
      localStorage.setItem('i18nextLng', updated.language);
    } finally {
      setAppearanceSaving(false);
    }
  };

  // ── Powiadomienia ──
  const handleSaveNotifications = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setNotifStatus('saving');
    try {
      const updated = await updateSettings({ notifyRed, notifyOrange });
      setSettings(updated);
      setNotifStatus('saved');
      setTimeout(() => setNotifStatus('idle'), 2000);
    } catch {
      setNotifStatus('idle');
    }
  };

  // ── Hasło ──
  const pwdValid = PWD_RE.test(newPwd);
  const pwdMatch = newPwd === confirmPwd;

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!pwdValid || !pwdMatch) return;
    const user = auth.currentUser;
    if (!user || !user.email) return;
    setPwdStatus('saving');
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPwd);
      await reauthenticateWithCredential(user, credential);
      await fbUpdatePassword(user, newPwd);
      setPwdStatus('changed');
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdStatus('idle'), 2500);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setPwdStatus(code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'wrongOld' : 'error');
    }
  };

  // ── Eksport ──
  const handleExportAll = async () => {
    setExporting(true);
    try {
      const visits = await getAllHistory();
      exportVisitsCSV(visits, {
        date: t('history.csvDate'), animalName: t('history.csvAnimalName'),
        species: t('history.csvSpecies'), breed: t('history.csvBreed'),
        gender: t('history.csvGender'), age: t('history.csvAge'),
        weight: t('history.csvWeight'), owner: t('history.csvOwner'),
        phone: t('history.csvPhone'), reason: t('history.csvReason'),
        category: t('history.csvCategory'), waitMin: t('history.csvWaitMin'),
        status: t('history.csvStatus'),
      });
    } finally {
      setExporting(false);
    }
  };

  // ── Usuń konto ──
  const deleteWord = t('settings.deleteConfirmPlaceholder');
  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== deleteWord) return;
    setDeleting(true);
    try {
      await deleteAccount();
      localStorage.clear();
      navigate('/login');
    } finally {
      setDeleting(false);
    }
  };

  // ── Mobile PIN ──
  const handleSaveMobilePin = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const pin = mobilePinInput.trim();
    if (pin && !/^\d{4,6}$/.test(pin)) return;
    setMobilePinSaving(true);
    setMobilePinStatus('idle');
    try {
      const updated = await updateSettings({ mobilePin: pin });
      setSettings(updated);
      setMobilePinStatus('saved');
      setTimeout(() => setMobilePinStatus('idle'), 2000);
    } catch {
      setMobilePinStatus('error');
    } finally {
      setMobilePinSaving(false);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    if (!settings) return;
    setDisconnecting(deviceId);
    try {
      await deleteDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } finally {
      setDisconnecting(null);
    }
  };

  const handleCopy = () => {
    if (!settings) return;
    navigator.clipboard.writeText(settings.clinicCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!settings) return <div className="page"><div className="empty-state">{t('history.loading')}</div></div>;

  const SectionHeader = ({ icon, title }: { icon: ReactNode; title: string }) => (
    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}{title}
    </h2>
  );

  return (
    <div className="page">
      <h1 className="page-title">{t('settings.title')}</h1>

      {/* ═══ 1. PROFIL KLINIKI ═══ */}
      <div className="card mb-4">
        <SectionHeader icon={<Building2 size={18} />} title={t('settings.profileSection')} />
        <form onSubmit={handleSaveProfile} className="inline-form">
          <div className="field" style={{ flex: 1 }}>
            <label>{t('settings.profileName')}</label>
            <input
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={profileStatus === 'saving'}>
            {profileStatus === 'saving' ? t('settings.profileSaving')
              : profileStatus === 'saved' ? t('settings.profileSaved')
              : t('settings.profileSave')}
          </button>
        </form>
      </div>

      {/* ═══ 2. WYGLĄD ═══ */}
      <div className="card mb-4">
        <SectionHeader icon={<Palette size={18} />} title={t('settings.appearanceSection')} />
        <form onSubmit={handleSaveAppearance}>
          <div className="form-grid">
            <div className="field">
              <label>{t('settings.accentColor')}</label>
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
              <label>{t('settings.language')}</label>
              <select
                value={settings.language}
                onChange={e => {
                  const lang = e.target.value;
                  setSettings(s => s ? { ...s, language: lang } : s);
                  i18n.changeLanguage(lang);
                  localStorage.setItem('i18nextLng', lang);
                }}
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={appearanceSaving}>
            {appearanceSaving ? t('settings.saving') : t('settings.save')}
          </button>
        </form>
      </div>

      {/* ═══ 3. POWIADOMIENIA ═══ */}
      <div className="card mb-4">
        <SectionHeader icon={<Bell size={18} />} title={t('settings.notificationsSection')} />
        <p className="text-muted mb-4">{t('settings.notificationsDesc')}</p>
        <form onSubmit={handleSaveNotifications}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyRed}
                onChange={e => setNotifyRed(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#ef4444' }}
              />
              <span style={{ fontWeight: 500, color: '#ef4444' }}>{t('settings.notifyRed')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyOrange}
                onChange={e => setNotifyOrange(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#f97316' }}
              />
              <span style={{ fontWeight: 500, color: '#f97316' }}>{t('settings.notifyOrange')}</span>
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={notifStatus === 'saving'}>
            {notifStatus === 'saving' ? t('settings.notificationsSaving')
              : notifStatus === 'saved' ? t('settings.notificationsSaved')
              : t('settings.notificationsSave')}
          </button>
        </form>
      </div>

      {/* ═══ 4. BEZPIECZEŃSTWO ═══ */}
      <div className="card mb-4">
        <SectionHeader icon={<Shield size={18} />} title={t('settings.securitySection')} />
        <form onSubmit={handleChangePassword} style={{ maxWidth: 380 }}>
          <div className="field">
            <label>{t('settings.oldPassword')}</label>
            <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required />
          </div>
          <div className="field">
            <label>{t('settings.newPassword')}</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
          </div>
          <div className="field mb-2">
            <label>{t('settings.confirmPassword')}</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
          </div>

          {newPwd.length > 0 && (
            <div style={{ fontSize: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { ok: newPwd.length >= 8,        label: t('settings.pwdLength') },
                { ok: /[A-Z]/.test(newPwd),      label: t('settings.pwdUpper') },
                { ok: /[a-z]/.test(newPwd),      label: t('settings.pwdLower') },
                { ok: /\d/.test(newPwd),         label: t('settings.pwdDigit') },
                { ok: pwdMatch && confirmPwd.length > 0, label: t('settings.pwdMatch') },
              ].map(r => (
                <span key={r.label} style={{ color: r.ok ? '#22c55e' : '#94a3b8' }}>
                  {r.ok ? '✓' : '○'} {r.label}
                </span>
              ))}
            </div>
          )}

          {pwdStatus === 'wrongOld' && <p className="form-error mb-2">{t('settings.passwordWrong')}</p>}
          {pwdStatus === 'error'    && <p className="form-error mb-2">{t('settings.passwordError')}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={pwdStatus === 'saving' || !pwdValid || !pwdMatch || !oldPwd}
          >
            {pwdStatus === 'saving'  ? t('settings.changingPassword')
              : pwdStatus === 'changed' ? t('settings.passwordChanged')
              : t('settings.changePassword')}
          </button>
        </form>
      </div>

      {/* ═══ 5. DANE I EKSPORT ═══ */}
      <div className="card mb-4">
        <SectionHeader icon={<Database size={18} />} title={t('settings.dataSection')} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <p className="text-muted" style={{ margin: 0 }}>
            {t('settings.registeredSince')}{' '}
            <strong>{new Date(settings.createdAt).toLocaleDateString()}</strong>
          </p>
          <p className="text-muted" style={{ margin: 0 }}>
            {t('settings.totalVisits')} <strong>{settings.totalVisits}</strong>
          </p>
        </div>

        <button
          className="btn-secondary btn-icon"
          onClick={handleExportAll}
          disabled={exporting}
          style={{ marginBottom: 32 }}
        >
          {exporting ? t('settings.exporting') : t('settings.exportAll')}
        </button>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
          <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>{t('settings.deleteAccount')}</p>
          <p className="text-muted mb-4" style={{ fontSize: 13 }}>{t('settings.deleteAccountDesc')}</p>
          <form onSubmit={handleDeleteAccount} className="inline-form">
            <div className="field">
              <label style={{ fontSize: 13 }}>{t('settings.deleteConfirmLabel')}</label>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={t('settings.deleteConfirmPlaceholder')}
                style={{ width: 140 }}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
              disabled={deleteConfirm !== deleteWord || deleting}
            >
              {deleting ? t('settings.deleting') : t('settings.deleteConfirmBtn')}
            </button>
          </form>
        </div>
      </div>

      {/* ═══ POCZEKALNA / LOBBY ═══ */}
      <div className="card mb-4">
        <h2 className="section-title">{t('settings.lobbySection')}</h2>
        <p className="text-muted mb-4">{t('settings.lobbyDesc')}</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            className="btn-primary btn-icon"
            onClick={() => window.open(`/queue/${settings.clinicCode}`, '_blank')}
          >
            <ExternalLink size={16} />
            {t('settings.openLobby')}
          </button>
        </div>
        <div className="field">
          <label>{t('settings.iframeLabel')}</label>
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
              {iframeCopied ? t('settings.copied') : t('settings.copyCode')}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ APLIKACJA MOBILNA ═══ */}
      <div className="card mb-4">
        <SectionHeader icon={<Smartphone size={18} />} title={t('settings.mobileSection')} />
        <p className="text-muted mb-4">{t('settings.mobileDesc')}</p>

        <div className="field mb-4">
          <label style={{ fontWeight: 600 }}>{t('settings.clinicCodeSection')}</label>
          <div className="code-display" style={{ marginTop: 6 }}>
            <span className="clinic-code" style={{ fontSize: 22, letterSpacing: 3 }}>
              {settings.clinicCode}
            </span>
            <button className="btn-secondary btn-icon" onClick={handleCopy} title={t('settings.copy')}>
              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
              {copied ? t('settings.copied') : t('settings.copy')}
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveMobilePin} className="inline-form mb-4">
          <div className="field">
            <label>{t('settings.mobilePinLabel')}</label>
            <input
              type="password"
              inputMode="numeric"
              value={mobilePinInput}
              onChange={e => setMobilePinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('settings.mobilePinPlaceholder')}
              pattern="\d{4,6}"
            />
          </div>
          <button type="submit" className="btn-primary btn-icon" disabled={mobilePinSaving}>
            {mobilePinSaving
              ? t('settings.mobilePinSaving')
              : mobilePinStatus === 'saved'
              ? t('settings.mobilePinSaved')
              : t('settings.mobilePinSave')}
          </button>
          {mobilePinInput && (
            <button
              type="button"
              className="btn-secondary btn-icon"
              onClick={() => setMobilePinInput('')}
              title={t('settings.mobilePinClear')}
            >
              <Trash2 size={14} />
              {t('settings.mobilePinClear')}
            </button>
          )}
        </form>
        {mobilePinStatus === 'error' && (
          <p className="form-error mb-2">{t('settings.mobilePinError')}</p>
        )}

        <h3 className="section-title" style={{ fontSize: 14, marginBottom: 8 }}>
          {t('settings.devicesSection')}
        </h3>
        {devicesLoading ? (
          <p className="text-muted">{t('settings.devicesLoading')}</p>
        ) : devices.length === 0 ? (
          <p className="text-muted">{t('settings.devicesNone')}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Device</th>
                <th>{t('settings.devicesLastSeen').replace(': ', '')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id}>
                  <td>{d.deviceName ?? '—'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(d.lastSeen).toLocaleString()}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      disabled={disconnecting === d.id}
                      onClick={() => handleDisconnect(d.id)}
                    >
                      {disconnecting === d.id
                        ? t('settings.devicesDisconnecting')
                        : t('settings.devicesDisconnect')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══ 6. O APLIKACJI ═══ */}
      <div className="card">
        <SectionHeader icon={<Info size={18} />} title={t('settings.aboutSection')} />
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', alignItems: 'center' }}>
          <span className="text-muted">{t('settings.aboutVersion')}</span>
          <strong>1.0.0</strong>
          <span className="text-muted">{t('settings.aboutAlgorithm')}</span>
          <strong>{t('settings.aboutAlgorithmValue')}</strong>
        </div>
        <div style={{ marginTop: 16 }}>
          <a
            href="http://localhost:8081/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-icon"
            style={{ display: 'inline-flex', textDecoration: 'none' }}
          >
            <ExternalLink size={14} />
            {t('settings.aboutDocs')}
          </a>
        </div>
      </div>
    </div>
  );
}
