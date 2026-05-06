import { useEffect, useRef, useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getFilteredHistory } from '../api/visits';
import { exportVisitsCSV } from '../utils/csvExport';
import type { VisitResponse, TriageCategory, VisitStatus } from '../types';

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

export default function HistoryPage() {
  const { clinicCode } = useAuth();
  const { t } = useTranslation();
  const [visits, setVisits] = useState<VisitResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalSet = useRef(false);

  const [dateMode, setDateMode] = useState<DateMode>('range');
  const [singleDate, setSingleDate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categories, setCategories] = useState<Set<TriageCategory>>(new Set());
  const [species, setSpecies] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | ''>('');

  const hasFilters = !!(
    (dateMode === 'single' ? singleDate : dateFrom || dateTo) ||
    categories.size > 0 || species || statusFilter
  );

  useEffect(() => {
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

    getFilteredHistory(params)
      .then(data => {
        setVisits(data);
        if (!totalSet.current) { setTotal(data.length); totalSet.current = true; }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clinicCode, dateMode, singleDate, dateFrom, dateTo, categories, species, statusFilter]);

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
  };

  const stats = useMemo(() => ({
    RED:    visits.filter(v => v.triageCategory === 'RED').length,
    ORANGE: visits.filter(v => v.triageCategory === 'ORANGE').length,
    YELLOW: visits.filter(v => v.triageCategory === 'YELLOW').length,
    GREEN:  visits.filter(v => v.triageCategory === 'GREEN').length,
  }), [visits]);

  const handleExport = () => {
    exportVisitsCSV(visits, {
      date:       t('history.csvDate'),
      animalName: t('history.csvAnimalName'),
      species:    t('history.csvSpecies'),
      breed:      t('history.csvBreed'),
      gender:     t('history.csvGender'),
      age:        t('history.csvAge'),
      weight:     t('history.csvWeight'),
      owner:      t('history.csvOwner'),
      phone:      t('history.csvPhone'),
      reason:     t('history.csvReason'),
      category:   t('history.csvCategory'),
      waitMin:    t('history.csvWaitMin'),
      status:     t('history.csvStatus'),
    });
  };

  return (
    <div className="page">
      <h1 className="page-title">{t('history.title')}</h1>

      {/* Stats line */}
      <div style={{ fontSize: 14, color: '#475569', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: '0 16px', alignItems: 'center' }}>
        <span>
          {t('history.found', { count: visits.length }).replace('<bold>', '').replace('</bold>', '')}
        </span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        {CATEGORIES.map(cat => (
          <span key={cat}>
            <strong style={{ color: CAT_COLOR[cat] }}>{cat}: {stats[cat]}</strong>
          </span>
        ))}
        {hasFilters && (
          <>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ color: '#64748b' }}>{t('history.showingOf', { current: visits.length, total })}</span>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['range', 'single'] as DateMode[]).map(m => (
            <button
              key={m}
              type="button"
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
              {STATUSES.map(s => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category chips */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 4 }}>{t('history.categoryLabel')}</span>
          {CATEGORIES.map(cat => {
            const active = categories.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '4px 14px', borderRadius: 99, border: '2px solid',
                  borderColor: active ? CAT_COLOR[cat] : '#e2e8f0',
                  background: active ? CAT_COLOR[cat] : '#fff',
                  color: active ? '#fff' : CAT_COLOR[cat],
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                {cat}
              </button>
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
          <button
            type="button"
            className="btn-secondary btn-icon"
            onClick={handleExport}
            disabled={visits.length === 0}
          >
            <Download size={15} />
            {t('history.export')}
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
                <th>{t('history.colOwner')}</th>
                <th>{t('history.colReason')}</th>
                <th>{t('history.colCategory')}</th>
                <th>{t('history.colWaitTime')}</th>
                <th>{t('history.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id}>
                  <td className="text-muted text-sm">{formatDateTime(v.createdAt)}</td>
                  <td>
                    <strong>{v.animalName}</strong>
                    <br />
                    <span className="text-muted text-sm">{v.species}{v.breed ? ` · ${v.breed}` : ''}</span>
                  </td>
                  <td>
                    {v.ownerFullName}
                    <br />
                    <span className="text-muted text-sm">{v.ownerPhone}</span>
                  </td>
                  <td className="reason-cell">{v.reason}</td>
                  <td><span className={`pill pill-${v.triageCategory.toLowerCase()}`}>{t(`cat.${v.triageCategory}`)}</span></td>
                  <td>{v.triageCategory === 'RED' ? '—' : `${v.waitingMinutes} min`}</td>
                  <td><span className={`status-badge status-${v.status.toLowerCase()}`}>{t(`status.${v.status}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
