import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Download, Edit2, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getFilteredHistory, updateVisit } from '../api/visits';
import { exportVisitsCSV } from '../utils/csvExport';
import type { VisitResponse, TriageCategory, VisitStatus, UpdateVisitPayload } from '../types';
import Modal from '../components/Modal';

const CATEGORIES: TriageCategory[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN'];
const CAT_COLOR: Record<TriageCategory, string> = {
  RED: '#ef4444', ORANGE: '#f97316', YELLOW: '#ca8a04', GREEN: '#16a34a',
};
const STATUSES: VisitStatus[] = ['WAITING', 'IN_PROGRESS', 'DONE'];

type DateMode = 'range' | 'single';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function printVisit(v: VisitResponse, clinicCode: string) {
  const w = window.open('', '_blank', 'width=800,height=600');
  if (!w) return;
  const catColor: Record<TriageCategory, string> = {
    RED: '#ef4444', ORANGE: '#f97316', YELLOW: '#eab308', GREEN: '#22c55e',
  };
  const catLabel: Record<TriageCategory, string> = {
    RED: 'CZERWONY – KRYTYCZNY', ORANGE: 'POMARAŃCZOWY – PILNY',
    YELLOW: 'ŻÓŁTY – MNIEJ PILNY', GREEN: 'ZIELONY – PLANOWY',
  };
  w.document.write(`<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8">
    <title>Karta pacjenta – ${v.animalName}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:32px}
      h1{font-size:20px;font-weight:800;margin-bottom:4px}
      .logo{font-size:16px;font-weight:700;color:#22c55e;margin-bottom:16px}
      .badge{display:inline-block;padding:4px 14px;border-radius:99px;color:#fff;font-weight:700;font-size:13px;margin-bottom:8px}
      .section{margin:16px 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#888;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      .row{display:flex;gap:32px;flex-wrap:wrap;margin-bottom:6px}
      .field label{font-size:11px;color:#64748b;display:block}
      .field span{font-size:13px;font-weight:500}
      @media print{body{padding:0}button{display:none}}
    </style>
  </head><body>
    <div class="logo">🐾 VetTriage — ${clinicCode}</div>
    <h1>Karta pacjenta</h1>
    <p style="color:#64748b;font-size:12px;margin-bottom:16px">${formatDateTime(v.createdAt)}</p>
    <span class="badge" style="background:${catColor[v.triageCategory]}">${catLabel[v.triageCategory]}</span>
    <div class="section">Dane zwierzęcia</div>
    <div class="row">
      <div class="field"><label>Imię</label><span>${v.animalName}</span></div>
      <div class="field"><label>Gatunek</label><span>${v.species}</span></div>
      ${v.breed ? `<div class="field"><label>Rasa</label><span>${v.breed}</span></div>` : ''}
      <div class="field"><label>Płeć</label><span>${v.gender === 'MALE' ? 'Samiec' : 'Samica'}</span></div>
      ${v.ageYears != null ? `<div class="field"><label>Wiek</label><span>${v.ageYears} lat</span></div>` : ''}
      ${v.color ? `<div class="field"><label>Maść</label><span>${v.color}</span></div>` : ''}
      ${v.weightKg != null ? `<div class="field"><label>Masa</label><span>${v.weightKg} kg</span></div>` : ''}
    </div>
    <div class="section">Dane właściciela</div>
    <div class="row">
      <div class="field"><label>Imię i nazwisko</label><span>${v.ownerFullName}</span></div>
      <div class="field"><label>Telefon</label><span>${v.ownerPhone}</span></div>
    </div>
    <div class="section">Wizyta</div>
    <div style="margin-bottom:10px"><label style="font-size:11px;color:#64748b">Powód wizyty</label><br><span style="font-size:13px">${v.reason}</span></div>
    <div class="row">
      <div class="field"><label>Czas oczekiwania</label><span>${v.triageCategory === 'RED' ? 'Natychmiast' : v.waitingMinutes + ' min'}</span></div>
      <div class="field"><label>Status</label><span>${v.status}</span></div>
    </div>
    <script>window.onload=function(){window.print();}<\/script>
  </body></html>`);
  w.document.close();
}

export default function HistoryPage() {
  const { clinicCode } = useAuth();
  const { t } = useTranslation();
  const [visits, setVisits] = useState<VisitResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalSet = useRef(false);

  // Filters
  const [dateMode, setDateMode] = useState<DateMode>('range');
  const [singleDate, setSingleDate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categories, setCategories] = useState<Set<TriageCategory>>(new Set());
  const [species, setSpecies] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Edit modal
  const [editVisit, setEditVisit] = useState<VisitResponse | null>(null);
  const [editForm, setEditForm] = useState<UpdateVisitPayload>({});
  const [editSaving, setEditSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasFilters = !!(
    (dateMode === 'single' ? singleDate : dateFrom || dateTo) ||
    categories.size > 0 || species || statusFilter || search
  );

  const fetchVisits = useCallback(() => {
    if (!clinicCode) return;
    setLoading(true);
    const params: Parameters<typeof getFilteredHistory>[0] = {};
    if (dateMode === 'single' && singleDate) {
      params.dateFrom = singleDate; params.dateTo = singleDate;
    } else {
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
    }
    if (categories.size > 0) params.category = [...categories];
    if (species) params.species = species;
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;

    getFilteredHistory(params)
      .then(data => {
        setVisits(data);
        if (!totalSet.current) { setTotal(data.length); totalSet.current = true; }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clinicCode, dateMode, singleDate, dateFrom, dateTo, categories, species, statusFilter, search]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const toggleCategory = (cat: TriageCategory) => {
    setCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const clearFilters = () => {
    setSingleDate(''); setDateFrom(''); setDateTo('');
    setCategories(new Set()); setSpecies(''); setStatusFilter('');
    setSearchInput(''); setSearch('');
  };

  const stats = useMemo(() => ({
    RED:    visits.filter(v => v.triageCategory === 'RED').length,
    ORANGE: visits.filter(v => v.triageCategory === 'ORANGE').length,
    YELLOW: visits.filter(v => v.triageCategory === 'YELLOW').length,
    GREEN:  visits.filter(v => v.triageCategory === 'GREEN').length,
  }), [visits]);

  const handleExport = () => {
    exportVisitsCSV(visits, {
      date: t('history.csvDate'), animalName: t('history.csvAnimalName'),
      species: t('history.csvSpecies'), breed: t('history.csvBreed'),
      gender: t('history.csvGender'), age: t('history.csvAge'),
      weight: t('history.csvWeight'), owner: t('history.csvOwner'),
      phone: t('history.csvPhone'), reason: t('history.csvReason'),
      category: t('history.csvCategory'), waitMin: t('history.csvWaitMin'),
      status: t('history.csvStatus'),
    });
  };

  const openEdit = (v: VisitResponse) => {
    setEditVisit(v);
    setEditForm({
      triageCategory: v.triageCategory,
      waitingMinutes: v.waitingMinutes,
      status: v.status,
      reason: v.reason,
    });
  };

  const handleSaveEdit = async () => {
    if (!editVisit) return;
    setEditSaving(true);
    try {
      await updateVisit(editVisit.id, editForm);
      setEditVisit(null);
      fetchVisits();
    } catch { /* error toast via interceptor */ } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">{t('history.title')}</h1>

      {/* Stats line */}
      <div style={{ fontSize: 14, color: '#475569', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: '0 16px', alignItems: 'center' }}>
        <span>{t('history.found', { count: visits.length }).replace('<bold>', '').replace('</bold>', '')}</span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        {CATEGORIES.map(cat => (
          <span key={cat}><strong style={{ color: CAT_COLOR[cat] }}>{cat}: {stats[cat]}</strong></span>
        ))}
        {hasFilters && (
          <><span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#64748b' }}>{t('history.showingOf', { current: visits.length, total })}</span></>
        )}
      </div>

      {/* Filters card */}
      <div className="card mb-4">
        {/* Search */}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>{t('history.search')}</label>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('history.searchPlaceholder')}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['range', 'single'] as DateMode[]).map(m => (
            <button key={m} type="button"
              onClick={() => { setDateMode(m); setSingleDate(''); setDateFrom(''); setDateTo(''); }}
              style={{
                padding: '5px 16px', borderRadius: 6, border: '1px solid',
                borderColor: dateMode === m ? '#3b82f6' : '#e2e8f0',
                background: dateMode === m ? '#eff6ff' : '#fff',
                color: dateMode === m ? '#1d4ed8' : '#64748b',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              {t(m === 'range' ? 'history.dateRange' : 'history.singleDay')}
            </button>
          ))}
        </div>

        <div className="filter-row" style={{ flexWrap: 'wrap', gap: 12 }}>
          {dateMode === 'single' ? (
            <div className="field">
              <label>{t('history.day')}</label>
              <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
            </div>
          ) : (
            <>
              <div className="field">
                <label>{t('history.from')}</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="field">
                <label>{t('history.to')}</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </>
          )}
          <div className="field">
            <label>{t('history.speciesLabel')}</label>
            <select value={species} onChange={e => setSpecies(e.target.value)}>
              <option value="">{t('history.speciesAll')}</option>
              <option value="pies">{t('history.speciesDog')}</option>
              <option value="kot">{t('history.speciesCat')}</option>
              <option value="królik">{t('history.speciesRabbit')}</option>
              <option value="inne">{t('history.speciesOther')}</option>
            </select>
          </div>
          <div className="field">
            <label>{t('history.statusLabel')}</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as VisitStatus | '')}>
              <option value="">{t('history.statusAll')}</option>
              {STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
            </select>
          </div>
        </div>

        {/* Category chips */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 4 }}>{t('history.categoryLabel')}</span>
          {CATEGORIES.map(cat => {
            const active = categories.has(cat);
            return (
              <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                style={{
                  padding: '4px 14px', borderRadius: 99, border: '2px solid',
                  borderColor: active ? CAT_COLOR[cat] : '#e2e8f0',
                  background: active ? CAT_COLOR[cat] : '#fff',
                  color: active ? '#fff' : CAT_COLOR[cat],
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >{cat}</button>
            );
          })}
        </div>

        {/* Actions row */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {hasFilters && (
            <button type="button" className="btn-secondary" onClick={clearFilters}>
              {t('history.clearFilters')}
            </button>
          )}
          <button type="button" className="btn-secondary btn-icon" onClick={handleExport} disabled={visits.length === 0}>
            <Download size={15} /> {t('history.export')}
          </button>
          <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }}>
            {t('history.showingOf', { current: visits.length, total })}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">{t('history.loading')}</div>
      ) : visits.length === 0 ? (
        <div className="empty-state">{t('history.noResults')}</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{t('history.colDate')}</th>
                <th>{t('history.colPatient')}</th>
                <th className="col-hide-mobile">{t('history.colOwner')}</th>
                <th className="col-hide-mobile">{t('history.colReason')}</th>
                <th>{t('history.colCategory')}</th>
                <th className="col-hide-mobile">{t('history.colWaitTime')}</th>
                <th>{t('history.colStatus')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id}>
                  <td className="text-muted text-sm">{formatDateTime(v.createdAt)}</td>
                  <td>
                    <strong>{v.animalName}</strong><br />
                    <span className="text-muted text-sm">{v.species}{v.breed ? ` · ${v.breed}` : ''}</span>
                  </td>
                  <td className="col-hide-mobile">
                    {v.ownerFullName}<br />
                    <span className="text-muted text-sm">{v.ownerPhone}</span>
                  </td>
                  <td className="reason-cell col-hide-mobile">{v.reason}</td>
                  <td><span className={`pill pill-${v.triageCategory.toLowerCase()}`}>{t(`cat.${v.triageCategory}`)}</span></td>
                  <td className="col-hide-mobile">{v.triageCategory === 'RED' ? '—' : `${v.waitingMinutes} min`}</td>
                  <td><span className={`status-badge status-${v.status.toLowerCase()}`}>{t(`status.${v.status}`)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary btn-icon" style={{ padding: '4px 8px', fontSize: 12 }}
                        onClick={() => openEdit(v)} title={t('history.editBtn')}>
                        <Edit2 size={13} /> <span className="col-hide-mobile">{t('history.editBtn')}</span>
                      </button>
                      <button className="btn-secondary btn-icon" style={{ padding: '4px 8px', fontSize: 12 }}
                        onClick={() => printVisit(v, clinicCode ?? '')} title={t('history.printBtn')}>
                        <Printer size={13} /> <span className="col-hide-mobile">{t('history.printBtn')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editVisit && (
        <Modal
          title={t('history.editTitle')}
          onClose={() => setEditVisit(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setEditVisit(null)}>
                {t('triage.confirmNo')}
              </button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? t('history.editSaving') : t('history.editSave')}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>{t('history.editCategory')}</label>
              <select value={editForm.triageCategory ?? ''}
                onChange={e => setEditForm(f => ({ ...f, triageCategory: e.target.value as TriageCategory }))}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat} — {t(`cat.${cat}`)}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('history.editWaitMinutes')}</label>
              <input type="number" min={0}
                value={editForm.waitingMinutes ?? ''}
                onChange={e => setEditForm(f => ({ ...f, waitingMinutes: Number(e.target.value) }))} />
            </div>
            <div className="field">
              <label>{t('history.editStatus')}</label>
              <select value={editForm.status ?? ''}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value as VisitStatus }))}>
                {STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('history.editReason')}</label>
              <textarea rows={3}
                value={editForm.reason ?? ''}
                onChange={e => setEditForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
