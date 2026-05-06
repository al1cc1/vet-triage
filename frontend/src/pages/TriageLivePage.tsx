import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getQueue, acceptVisit } from '../api/visits';
import type { VisitResponse, TriageCategory } from '../types';
import { useMinuteTick } from '../hooks/useMinuteTick';
import { formatWaitTime } from '../utils/waitTime';

function TriagePill({ cat }: { cat: TriageCategory }) {
  const { t } = useTranslation();
  return <span className={`pill pill-${cat.toLowerCase()}`}>{t(`cat.${cat}`)}</span>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export default function TriageLivePage() {
  const { clinicCode } = useAuth();
  const [visits, setVisits] = useState<VisitResponse[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const { t } = useTranslation();
  useMinuteTick();

  useEffect(() => {
    if (!clinicCode) return;
    getQueue(clinicCode).then(setVisits).catch(() => {});

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/queue/${clinicCode}`, frame => {
          setVisits(JSON.parse(frame.body) as VisitResponse[]);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); };
  }, [clinicCode]);

  const handleAccept = async (id: string) => {
    try {
      await acceptVisit(id);
    } catch {
      /* broadcast will update the list */
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{t('triage.title')}</h1>
        <span className={`ws-badge${connected ? ' connected' : ''}`}>
          {connected ? <><Wifi size={14} /> {t('common.live') ?? 'Na żywo'}</> : <><WifiOff size={14} /> {t('common.disconnected') ?? 'Rozłączony'}</>}
        </span>
      </div>

      {visits.length === 0 ? (
        <div className="empty-state">{t('triage.noPatients')}</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{t('triage.colNo')}</th>
                <th>{t('triage.colPatient')}</th>
                <th>{t('triage.colReason')}</th>
                <th>{t('triage.colCategory')}</th>
                <th>{t('triage.colWaitTime')}</th>
                <th>{t('triage.colTime')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v, i) => (
                <tr key={v.id} className={`row-${v.triageCategory.toLowerCase()}`}>
                  <td className="text-muted">{i + 1}</td>
                  <td>
                    <strong>{v.animalName}</strong>
                    <br />
                    <span className="text-muted text-sm">{v.species}{v.breed ? ` · ${v.breed}` : ''}</span>
                  </td>
                  <td className="reason-cell">{v.reason}</td>
                  <td><TriagePill cat={v.triageCategory} /></td>
                  <td>
                    {v.triageCategory === 'RED'
                      ? <span className="text-urgent">{t('triage.now')}</span>
                      : formatWaitTime(v)}
                  </td>
                  <td className="text-muted">{formatTime(v.createdAt)}</td>
                  <td>
                    <button
                      className="btn-accept"
                      onClick={() => handleAccept(v.id)}
                      title={t('triage.accept')}
                    >
                      <CheckCircle size={16} />
                      <span>{t('triage.accept')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
