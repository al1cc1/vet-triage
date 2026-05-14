import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { createVisit, getPreviewTime } from '../api/visits';
import type { Gender, TriageCategory } from '../types';

// Web Speech API type augmentation
declare global {
  interface Window {
    SpeechRecognition?: { new(): SpeechRecognitionInstance };
    webkitSpeechRecognition?: { new(): SpeechRecognitionInstance };
  }
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: ((ev: Event) => void) | null;
}

function useSpeechRecognition(onAppend: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const errorShownRef = useRef(false);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const showToast = (text: string) =>
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'message', text } }));

  const toggle = async () => {
    if (!supported) return;
    if (listening) {
      console.log('[STT] stop requested');
      recogRef.current?.stop();
      return;
    }

    // Explicitly request mic permission before SpeechRecognition.start().
    // Required on HTTPS in Brave/Edge to avoid silent 'network' / 'not-allowed' errors.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // release — SpeechRecognition manages its own stream
      console.log('[STT] getUserMedia: permission granted');
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? '';
      console.error('[STT] getUserMedia error:', name, err);
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        showToast('Brak uprawnień do mikrofonu. Zezwól w ustawieniach przeglądarki.');
      } else {
        showToast('Nie wykryto mikrofonu. Upewnij się że jest podłączony.');
      }
      return;
    }

    const SR = (window.SpeechRecognition ?? window.webkitSpeechRecognition)!;
    const r = new SR();
    const lang = i18n.language?.startsWith('en') ? 'en-US' : 'pl-PL';
    r.lang = lang;
    r.continuous = false;
    r.interimResults = true;
    errorShownRef.current = false;

    r.onstart = () => {
      console.log('[STT] onstart — mikrofon aktywny');
      setListening(true);
      setInterim('');
    };

    r.onresult = (e) => {
      console.log('[STT] onresult', e.resultIndex, e.results.length);
      let final = '';
      let inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else inter += e.results[i][0].transcript;
      }
      setInterim(inter);
      if (final) {
        console.log('[STT] final text:', final);
        onAppend(final);
        setInterim('');
      }
    };

    r.onerror = (e) => {
      console.error('[STT] onerror:', e.error);
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          showToast('Brak uprawnień do mikrofonu. Zezwól w ustawieniach przeglądarki.');
        } else if (e.error === 'audio-capture') {
          showToast('Nie wykryto mikrofonu.');
        } else if (e.error === 'network') {
          showToast('Błąd połączenia z usługą rozpoznawania mowy. Spróbuj ponownie.');
        } else if (e.error === 'no-speech') {
          showToast('Nie wykryto mowy. Spróbuj ponownie.');
        } else {
          showToast(`Błąd rozpoznawania mowy: ${e.error}`);
        }
      }
      setListening(false);
      setInterim('');
    };

    r.onend = () => {
      console.log('[STT] onend — sesja zakończona');
      setListening(false);
      setInterim('');
    };

    recogRef.current = r;
    console.log('[STT] start(), lang:', lang);
    r.start();
  };

  useEffect(() => () => { recogRef.current?.abort(); }, []);

  return { supported, listening, interim, toggle };
}

const SYMPTOM_GROUPS: Array<{
  groupKey: string;
  items: Array<{ key: string; value: string }>;
}> = [
  {
    groupKey: 'symptoms.groupRespiratory',
    items: [
      { key: 'symptoms.noBreathing',        value: 'brak oddechu' },
      { key: 'symptoms.breathingDifficulty', value: 'trudności oddechowe' },
      { key: 'symptoms.cough',              value: 'kaszel' },
      { key: 'symptoms.wheeze',             value: 'świsty' },
    ],
  },
  {
    groupKey: 'symptoms.groupCirculatory',
    items: [
      { key: 'symptoms.shock',       value: 'wstrząs' },
      { key: 'symptoms.hemorrhage',  value: 'krwotok' },
      { key: 'symptoms.paleMucosa',  value: 'bladość błon śluzowych' },
      { key: 'symptoms.tachycardia', value: 'tachykardia' },
    ],
  },
  {
    groupKey: 'symptoms.groupNeurological',
    items: [
      { key: 'symptoms.seizures',       value: 'drgawki' },
      { key: 'symptoms.unconscious',    value: 'utrata przytomności' },
      { key: 'symptoms.disorientation', value: 'dezorientacja' },
    ],
  },
  {
    groupKey: 'symptoms.groupDigestive',
    items: [
      { key: 'symptoms.vomiting',   value: 'wymioty' },
      { key: 'symptoms.noAppetite', value: 'brak apetytu' },
      { key: 'symptoms.diarrhea',   value: 'biegunka' },
      { key: 'symptoms.bloating',   value: 'wzdęcie' },
    ],
  },
  {
    groupKey: 'symptoms.groupTrauma',
    items: [
      { key: 'symptoms.trauma',     value: 'uraz' },
      { key: 'symptoms.severePain', value: 'silny ból' },
      { key: 'symptoms.fracture',   value: 'złamanie' },
      { key: 'symptoms.openWound',  value: 'otwarta rana' },
    ],
  },
  {
    groupKey: 'symptoms.groupUrinaryOther',
    items: [
      { key: 'symptoms.urinaryObstruction', value: 'niedrożność moczowa' },
      { key: 'symptoms.fever',       value: 'gorączka' },
      { key: 'symptoms.lameness',    value: 'kulawizna' },
      { key: 'symptoms.vaccination', value: 'szczepienie' },
      { key: 'symptoms.checkup',     value: 'kontrola' },
      { key: 'symptoms.grooming',    value: 'pielęgnacja' },
    ],
  },
];

const CATEGORIES: TriageCategory[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN'];

interface FormState {
  reason: string;
  animalName: string;
  species: string;
  breed: string;
  gender: Gender;
  ageYears: string;
  color: string;
  weightKg: string;
  ownerFullName: string;
  ownerAddress: string;
  ownerPhone: string;
}

const INITIAL: FormState = {
  reason: '', animalName: '', species: '', breed: '', gender: 'MALE',
  ageYears: '', color: '', weightKg: '',
  ownerFullName: '', ownerAddress: '', ownerPhone: '',
};

function onlyDigits(s: string) { return s.replace(/\D/g, ''); }

export default function NewVisitPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState<TriageCategory | ''>('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [previewMinutes, setPreviewMinutes] = useState<number | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { supported: micSupported, listening, interim, toggle: toggleMic } =
    useSpeechRecognition((text) =>
      setForm(prev => ({
        ...prev,
        reason: prev.reason ? prev.reason + ' ' + text.trim() : text.trim(),
      }))
    );

  useEffect(() => {
    if (!manualCategory) { setPreviewMinutes(null); return; }
    getPreviewTime(manualCategory).then(r => setPreviewMinutes(r.waitingMinutes)).catch(() => {});
  }, [manualCategory]);

  const set = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggleSymptom = (value: string) =>
    setSymptoms(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  // Validation
  const phoneDigits = onlyDigits(form.ownerPhone);
  const fieldErrors = {
    reason:       !form.reason.trim(),
    animalName:   !form.animalName.trim(),
    species:      !form.species.trim(),
    ownerFullName:!form.ownerFullName.trim(),
    ownerPhone:   !form.ownerPhone.trim() || phoneDigits.length < 9,
    ageYears:     form.ageYears !== '' && Number(form.ageYears) < 0,
    weightKg:     form.weightKg !== '' && Number(form.weightKg) < 0,
  };
  const hasErrors = Object.values(fieldErrors).some(Boolean);

  const fieldError = (field: keyof typeof fieldErrors) => {
    if (!submitted) return null;
    if (!fieldErrors[field]) return null;
    if (field === 'ownerPhone' && form.ownerPhone.trim() && phoneDigits.length < 9) {
      return <span className="field-error">{t('newVisit.phoneInvalid')}</span>;
    }
    return <span className="field-error">{t('newVisit.fieldRequired')}</span>;
  };

  const inputClass = (field: keyof typeof fieldErrors) =>
    submitted && fieldErrors[field] ? 'field-invalid' : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    setLoading(true);
    setError('');
    try {
      await createVisit({
        reason: form.reason,
        symptoms: [...symptoms],
        animalName: form.animalName,
        species: form.species,
        breed: form.breed || undefined,
        gender: form.gender,
        ageYears: form.ageYears ? Number(form.ageYears) : undefined,
        color: form.color || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        ownerFullName: form.ownerFullName,
        ownerAddress: form.ownerAddress || undefined,
        ownerPhone: form.ownerPhone,
        manualTriageCategory: manualCategory || undefined,
        manualWaitingMinutes: manualMinutes ? Number(manualMinutes) : undefined,
      });
      navigate('/triage');
    } catch {
      setError(t('newVisit.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">{t('newVisit.title')}</h1>
      <form onSubmit={handleSubmit} noValidate>

        <div className="card mb-4">
          <h2 className="section-title">{t('newVisit.sectionReason')}</h2>
          <div className="field">
            <label>{t('newVisit.reasonLabel')}</label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={form.reason + (interim ? (form.reason ? ' ' : '') + interim : '')}
                onChange={e => {
                  // strip interim from end if listening, otherwise update normally
                  if (listening && interim) {
                    const base = e.target.value.slice(0, e.target.value.length - interim.length - (form.reason ? 1 : 0));
                    setForm(prev => ({ ...prev, reason: base }));
                  } else {
                    set('reason')(e);
                  }
                }}
                rows={3}
                className={inputClass('reason')}
                style={listening ? { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59,130,246,.15)', paddingRight: 44 } : { paddingRight: micSupported ? 44 : undefined }}
                placeholder={t('newVisit.reasonPlaceholder')}
              />
              {micSupported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  title={listening ? 'Zatrzymaj nagrywanie' : 'Dyktuj tekst'}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 30, height: 30, borderRadius: '50%', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    background: listening ? '#ef4444' : '#e2e8f0',
                    color: listening ? '#fff' : '#64748b',
                    animation: listening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                    transition: 'background .15s, color .15s',
                  }}
                >
                  {listening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              )}
            </div>
            {fieldError('reason')}
          </div>
          <div className="symptom-groups">
            {SYMPTOM_GROUPS.map(group => (
              <div key={group.groupKey} className="symptom-group">
                <p className="symptom-group-label">{t(group.groupKey)}</p>
                <div className="symptom-list">
                  {group.items.map(item => (
                    <label key={item.value} className={`symptom-chip${symptoms.has(item.value) ? ' checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={symptoms.has(item.value)}
                        onChange={() => toggleSymptom(item.value)}
                      />
                      {t(item.key)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-4">
          <h2 className="section-title">{t('newVisit.sectionAnimal')}</h2>
          <div className="form-grid">
            <div className="field">
              <label>{t('newVisit.animalName')}</label>
              <input value={form.animalName} onChange={set('animalName')}
                className={inputClass('animalName')}
                placeholder={t('newVisit.animalNamePlaceholder')} />
              {fieldError('animalName')}
            </div>
            <div className="field">
              <label>{t('newVisit.species')}</label>
              <input value={form.species} onChange={set('species')}
                className={inputClass('species')}
                placeholder={t('newVisit.speciesPlaceholder')} />
              {fieldError('species')}
            </div>
            <div className="field">
              <label>{t('newVisit.breed')}</label>
              <input value={form.breed} onChange={set('breed')} placeholder={t('newVisit.breedPlaceholder')} />
            </div>
            <div className="field">
              <label>{t('newVisit.gender')}</label>
              <select value={form.gender} onChange={set('gender')}>
                <option value="MALE">{t('newVisit.genderMale')}</option>
                <option value="FEMALE">{t('newVisit.genderFemale')}</option>
              </select>
            </div>
            <div className="field">
              <label>{t('newVisit.ageYears')}</label>
              <input type="number" min={0} max={50} value={form.ageYears} onChange={set('ageYears')} placeholder="3" />
            </div>
            <div className="field">
              <label>{t('newVisit.color')}</label>
              <input value={form.color} onChange={set('color')} placeholder={t('newVisit.colorPlaceholder')} />
            </div>
            <div className="field">
              <label>{t('newVisit.weightKg')}</label>
              <input type="number" min={0} step="0.1" value={form.weightKg} onChange={set('weightKg')} placeholder="12.5" />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <h2 className="section-title">{t('newVisit.sectionOwner')}</h2>
          <div className="form-grid">
            <div className="field field-wide">
              <label>{t('newVisit.ownerFullName')}</label>
              <input value={form.ownerFullName} onChange={set('ownerFullName')}
                className={inputClass('ownerFullName')}
                placeholder={t('newVisit.ownerFullNamePlaceholder')} />
              {fieldError('ownerFullName')}
            </div>
            <div className="field field-wide">
              <label>{t('newVisit.ownerAddress')}</label>
              <input value={form.ownerAddress} onChange={set('ownerAddress')} placeholder={t('newVisit.ownerAddressPlaceholder')} />
            </div>
            <div className="field">
              <label>{t('newVisit.ownerPhone')}</label>
              <input type="tel" value={form.ownerPhone} onChange={set('ownerPhone')}
                className={inputClass('ownerPhone')}
                placeholder="600 000 000" />
              {fieldError('ownerPhone')}
            </div>
          </div>
        </div>

        <div className="card mb-4" style={overrideOpen ? { borderColor: '#f59e0b', background: '#fffbeb' } : {}}>
          <button
            type="button"
            onClick={() => setOverrideOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, color: '#b45309', fontWeight: 600, fontSize: 15,
            }}
          >
            <AlertTriangle size={18} />
            {t('newVisit.overrideTitle')}
            {overrideOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {overrideOpen && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: '#92400e', marginBottom: 14 }}>
                {t('newVisit.overrideWarning')}
              </p>
              <div className="form-grid">
                <div className="field">
                  <label>{t('newVisit.overrideCategoryLabel')}</label>
                  <select value={manualCategory} onChange={e => setManualCategory(e.target.value as TriageCategory | '')}>
                    <option value="">{t('newVisit.overrideCategoryAuto')}</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat} — {t(`cat.${cat}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>
                    {t('newVisit.overrideMinutesLabel')}
                    {previewMinutes !== null && !manualMinutes && (
                      <span style={{ fontWeight: 400, color: '#78716c', marginLeft: 6, fontSize: 13 }}>
                        {t('newVisit.overrideEstimated', { min: previewMinutes })}
                      </span>
                    )}
                  </label>
                  <input
                    type="number" min={1} max={999}
                    value={manualMinutes} onChange={e => setManualMinutes(e.target.value)}
                    placeholder={previewMinutes !== null ? String(previewMinutes) : 'np. 30'}
                  />
                </div>
              </div>
              {(manualCategory || manualMinutes) && (
                <button
                  type="button"
                  onClick={() => { setManualCategory(''); setManualMinutes(''); }}
                  style={{
                    marginTop: 8, background: 'none', border: '1px solid #d97706',
                    color: '#b45309', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}
                >
                  {t('newVisit.overrideClear')}
                </button>
              )}
            </div>
          )}
        </div>

        {error && <p className="form-error mb-4">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              {t('newVisit.loading')}
            </span>
          ) : t('newVisit.submit')}
        </button>
      </form>
    </div>
  );
}
