import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { createVisit, getPreviewTime } from '../api/visits';
import type { Gender, TriageCategory } from '../types';

const SYMPTOM_GROUPS = [
  {
    label: 'Oddechowe',
    items: ['brak oddechu', 'trudności oddechowe', 'kaszel', 'świsty'],
  },
  {
    label: 'Krążeniowe',
    items: ['wstrząs', 'krwotok', 'bladość błon śluzowych', 'tachykardia'],
  },
  {
    label: 'Neurologiczne',
    items: ['drgawki', 'utrata przytomności', 'dezorientacja'],
  },
  {
    label: 'Pokarmowe',
    items: ['wymioty', 'brak apetytu', 'biegunka', 'wzdęcie'],
  },
  {
    label: 'Urazowe',
    items: ['uraz', 'silny ból', 'złamanie', 'otwarta rana'],
  },
  {
    label: 'Moczowe / Inne',
    items: ['niedrożność moczowa', 'gorączka', 'kulawizna', 'szczepienie', 'kontrola', 'pielęgnacja'],
  },
];

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

const CATEGORY_LABELS: Record<TriageCategory, string> = {
  RED: 'RED — Krytyczny',
  ORANGE: 'ORANGE — Pilny',
  YELLOW: 'YELLOW — Mniej pilny',
  GREEN: 'GREEN — Planowy',
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

  useEffect(() => {
    if (!manualCategory) { setPreviewMinutes(null); return; }
    getPreviewTime(manualCategory).then(r => setPreviewMinutes(r.waitingMinutes)).catch(() => {});
  }, [manualCategory]);

  const set = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggleSymptom = (s: string) =>
    setSymptoms(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
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
      setError('Nie udało się zarejestrować wizyty. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Nowa wizyta</h1>
      <form onSubmit={handleSubmit}>

        <div className="card mb-4">
          <h2 className="section-title">Powód wizyty i objawy</h2>
          <div className="field">
            <label>Powód wizyty *</label>
            <textarea value={form.reason} onChange={set('reason')} required rows={3}
              placeholder="Opisz powód wizyty…" />
          </div>
          <div className="symptom-groups">
            {SYMPTOM_GROUPS.map(group => (
              <div key={group.label} className="symptom-group">
                <p className="symptom-group-label">{group.label}</p>
                <div className="symptom-list">
                  {group.items.map(s => (
                    <label key={s} className={`symptom-chip${symptoms.has(s) ? ' checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={symptoms.has(s)}
                        onChange={() => toggleSymptom(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-4">
          <h2 className="section-title">Dane zwierzęcia</h2>
          <div className="form-grid">
            <div className="field">
              <label>Imię *</label>
              <input value={form.animalName} onChange={set('animalName')} required placeholder="Burek" />
            </div>
            <div className="field">
              <label>Gatunek *</label>
              <input value={form.species} onChange={set('species')} required placeholder="Pies" />
            </div>
            <div className="field">
              <label>Rasa</label>
              <input value={form.breed} onChange={set('breed')} placeholder="Labrador" />
            </div>
            <div className="field">
              <label>Płeć *</label>
              <select value={form.gender} onChange={set('gender')}>
                <option value="MALE">Samiec</option>
                <option value="FEMALE">Samica</option>
              </select>
            </div>
            <div className="field">
              <label>Wiek (lata)</label>
              <input type="number" min={0} max={50} value={form.ageYears} onChange={set('ageYears')} placeholder="3" />
            </div>
            <div className="field">
              <label>Maść / umaszczenie</label>
              <input value={form.color} onChange={set('color')} placeholder="Czarny" />
            </div>
            <div className="field">
              <label>Masa ciała (kg)</label>
              <input type="number" min={0} step="0.1" value={form.weightKg} onChange={set('weightKg')} placeholder="12.5" />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <h2 className="section-title">Dane właściciela</h2>
          <div className="form-grid">
            <div className="field field-wide">
              <label>Imię i nazwisko *</label>
              <input value={form.ownerFullName} onChange={set('ownerFullName')} required placeholder="Jan Kowalski" />
            </div>
            <div className="field field-wide">
              <label>Adres</label>
              <input value={form.ownerAddress} onChange={set('ownerAddress')} placeholder="ul. Kwiatowa 1, Warszawa" />
            </div>
            <div className="field">
              <label>Telefon *</label>
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
            Ręczne nadpisanie triażu (opcjonalne)
            {overrideOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {overrideOpen && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: '#92400e', marginBottom: 14 }}>
                Uwaga: ręczne nadpisanie zastąpi automatyczny wynik algorytmu.
              </p>
              <div className="form-grid">
                <div className="field">
                  <label>Kategoria triażu</label>
                  <select
                    value={manualCategory}
                    onChange={e => setManualCategory(e.target.value as TriageCategory | '')}
                  >
                    <option value="">Automatyczna (algorytm)</option>
                    {(Object.keys(CATEGORY_LABELS) as TriageCategory[]).map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>
                    Czas oczekiwania (min)
                    {previewMinutes !== null && !manualMinutes && (
                      <span style={{ fontWeight: 400, color: '#78716c', marginLeft: 6, fontSize: 13 }}>
                        szacowany: {previewMinutes} min
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
                  Wyczyść
                </button>
              )}
            </div>
          )}
        </div>

        {error && <p className="form-error mb-4">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Rejestracja…' : 'Zarejestruj wizytę'}
        </button>
      </form>
    </div>
  );
}
