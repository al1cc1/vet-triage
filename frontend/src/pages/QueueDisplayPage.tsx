import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import type { VisitResponse, TriageCategory } from '../types';
import api from '../api/axios';
import { useMinuteTick } from '../hooks/useMinuteTick';
import { formatWaitTime } from '../utils/waitTime';

const CAT: Record<TriageCategory, { label: string; bg: string; rowBg: string }> = {
  RED:    { label: 'KRYTYCZNY',   bg: '#ef4444', rowBg: '#fff5f5' },
  ORANGE: { label: 'PILNY',       bg: '#f97316', rowBg: '#fff7ed' },
  YELLOW: { label: 'MNIEJ PILNY', bg: '#eab308', rowBg: '#fefce8' },
  GREEN:  { label: 'PLANOWY',     bg: '#22c55e', rowBg: '#f0fdf4' },
};

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
      {time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function QueueDisplayPage() {
  const { clinicCode } = useParams<{ clinicCode: string }>();
  const [visits, setVisits] = useState<VisitResponse[]>([]);
  const [clinicName, setClinicName] = useState('');
  const [accentColor, setAccentColor] = useState('#1e293b');
  const clientRef = useRef<Client | null>(null);

  useMinuteTick();

  const fetchQueue = useCallback(() => {
    if (!clinicCode) return;
    api.get<VisitResponse[]>(`/public/queue/${clinicCode}`).then(r => setVisits(r.data)).catch(() => {});
  }, [clinicCode]);

  useEffect(() => {
    if (!clinicCode) return;

    api.get<{ name: string; accentColor: string }>(`/public/clinic/${clinicCode}/settings`)
      .then(r => { setClinicName(r.data.name); setAccentColor(r.data.accentColor); })
      .catch(() => {});

    fetchQueue();

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/queue/${clinicCode}`, frame => {
          setVisits(JSON.parse(frame.body) as VisitResponse[]);
        });
      },
    });
    client.activate();
    clientRef.current = client;

    const poll = setInterval(fetchQueue, 5000);
    return () => { client.deactivate(); clearInterval(poll); };
  }, [clinicCode, fetchQueue]);

  const isLight = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };
  const textOnAccent = isLight(accentColor) ? '#0f172a' : '#ffffff';

  const s: Record<string, React.CSSProperties> = {
    page:   { minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' },
    header: { background: accentColor, color: textOnAccent, padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo:   { display: 'flex', alignItems: 'center', gap: 18 },
    main:   { flex: 1, padding: '36px 48px', maxWidth: 1300, margin: '0 auto', width: '100%', boxSizing: 'border-box' as const },
    th:     { textAlign: 'left' as const, padding: '10px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#64748b' },
    empty:  { textAlign: 'center' as const, padding: '100px 40px', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 24, color: '#94a3b8', fontWeight: 500 },
    footer: { background: accentColor, opacity: 0.85, height: 6 },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.logo}>
          <span style={{ fontSize: 40 }}>🐾</span>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>VetTriage</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{clinicName || clinicCode}</div>
          </div>
        </div>
        <Clock />
      </header>

      <main style={s.main}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#334155', marginBottom: 24 }}>
          Aktualna kolejka &nbsp;
          <span style={{ fontSize: 16, fontWeight: 500, color: '#64748b' }}>
            ({visits.length} {visits.length === 1 ? 'pacjent' : 'pacjentów'})
          </span>
        </div>

        {visits.length === 0 ? (
          <div style={s.empty}>Brak pacjentów w kolejce</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ borderBottom: `3px solid ${accentColor}` }}>
                {['Lp.', 'Imię zwierzęcia', 'Gatunek / Rasa', 'Kategoria triażu', 'Czas oczekiwania'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visits.map((v, i) => {
                const cat = CAT[v.triageCategory];
                return (
                  <tr key={v.id} style={{ background: cat.rowBg }}>
                    <td style={{ padding: '20px 20px', fontSize: 22, fontWeight: 700, color: '#94a3b8', borderRadius: '12px 0 0 12px', width: 64 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '20px 20px', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
                      {v.animalName}
                    </td>
                    <td style={{ padding: '20px 20px', fontSize: 20, color: '#334155' }}>
                      {v.species}{v.breed ? ` · ${v.breed}` : ''}
                    </td>
                    <td style={{ padding: '20px 20px' }}>
                      <span style={{
                        display: 'inline-block', background: cat.bg, color: '#fff',
                        padding: '10px 24px', borderRadius: 10,
                        fontSize: 20, fontWeight: 800, letterSpacing: '0.06em',
                      }}>
                        {cat.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 20px', fontSize: 24, fontWeight: 600, color: '#0f172a', borderRadius: '0 12px 12px 0' }}>
                      {v.triageCategory === 'RED'
                        ? <span style={{ color: '#ef4444', fontWeight: 800 }}>Teraz</span>
                        : <span style={formatWaitTime(v) === '<5 min' ? { color: '#f97316', fontWeight: 700 } : {}}>
                            {formatWaitTime(v)}
                          </span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>

      <footer style={s.footer} />
    </div>
  );
}
