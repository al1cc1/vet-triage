import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createVisit, getPreviewTime } from '../api/visits';
import type { Gender, TriageCategory } from '../types';

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

export default function NewVisitPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState<TriageCategory | ''>('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [previewMinutes, setPreviewMinutes] = useState<number | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      <form onSubmit={handleSubmit}>

        <div className="card mb-4">
          <h2 className="section-title">{t('newVisit.sectionReason')}</h2>
          <div className="field">
            <label>{t('newVisit.reasonLabel')}</label>
            <textarea value={form.reason} onChange={set('reason')} required rows={3}
              placeholder={t('newVisit.reasonPlaceholder')} />
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
              <input value={form.animalName} onChange={set('animalName')} required placeholder={t('newVisit.animalNamePlaceholder')} />
            </div>
            <div className="field">
              <label>{t('newVisit.species')}</label>
              <input value={form.species} onChange={set('species')} required placeholder={t('newVisit.speciesPlaceholder')} />
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
              <input value={form.ownerFullName} onChange={set('ownerFullName')} required placeholder={t('newVisit.ownerFullNamePlaceholder')} />
            </div>
            <div className="field field-wide">
              <label>{t('newVisit.ownerAddress')}</label>
              <input value={form.ownerAddress} onChange={set('ownerAddress')} placeholder={t('newVisit.ownerAddressPlaceholder')} />
            </div>
            <div className="field">
              <label>{t('newVisit.ownerPhone')}</label>
              <input type="tel" value={form.ownerPhone} onChange={set('ownerPhone')} required placeholder="600 000 000" />
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
                  <select
                    value={manualCategory}
                    onChange={e => setManualCategory(e.target.value as TriageCategory | '')}
                  >
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
                    type="number"
                    min={1}
                    max={999}
                    value={manualMinutes}
                    onChange={e => setManualMinutes(e.target.value)}
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
          {loading ? t('newVisit.loading') : t('newVisit.submit')}
        </button>
      </form>
    </div>
  );
}
