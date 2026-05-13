import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../config';
import { CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getQueue, acceptVisit } from '../api/visits';
import type { VisitResponse, TriageCategory } from '../types';
import { useMinuteTick } from '../hooks/useMinuteTick';
import { formatWaitTime } from '../utils/waitTime';
import Modal from '../components/Modal';

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
  const [wsEverConnected, setWsEverConnected] = useState(false);
  const [confirmVisit, setConfirmVisit] = useState<VisitResponse | null>(null);
  const [accepting, setAccepting] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useTranslation();
  useMinuteTick();

  const fetchQueue = useCallback(() => {
    if (!clinicCode) return;
    getQueue(clinicCode).then(setVisits).catch(() => {});
  }, [clinicCode]);

  useEffect(() => {
    if (!clinicCode) return;
    fetchQueue();
    pollRef.current = setInterval(fetchQueue, 5000);

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        setWsEverConnected(true);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        client.subscribe(`/topic/queue/${clinicCode}`, frame => {
          setVisits(JSON.parse(frame.body) as VisitResponse[]);
        });
      },
      onDisconnect: () => {
        setConnected(false);
        if (!pollRef.current) pollRef.current = setInterval(fetchQueue, 5000);
      },
      onStompError: () => {
        setConnected(false);
        if (!pollRef.current) pollRef.current = setInterval(fetchQueue, 5000);
      },
    });

    client.activate();
    clientRef.current = client;
    return () => {
      client.deactivate();
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [clinicCode, fetchQueue]);

  const handleConfirmAccept = async () => {
    if (!confirmVisit) return;
    setAccepting(true);
    const id = confirmVisit.id;
    try {
      await acceptVisit(id);
      setVisits(prev => prev.filter(v => v.id !== id));
      setConfirmVisit(null);
    } catch { /* broadcast will update the list */ } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{t('triage.title')}</h1>
        {wsEverConnected && (
          <span className={`ws-badge${connected ? ' connected' : ''}`}>
            {connected
              ? <><Wifi size={14} /> {t('common.live')}</>
              : <><WifiOff size={14} /> {t('common.disconnected')}</>}
          </span>
        )}
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
                <th className="col-hide-mobile">{t('triage.colReason')}</th>
                <th>{t('triage.colCategory')}</th>
                <th>{t('triage.colWaitTime')}</th>
                <th className="col-hide-mobile">{t('triage.colTime')}</th>
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
                  <td className="reason-cell col-hide-mobile">{v.reason}</td>
                  <td><TriagePill cat={v.triageCategory} /></td>
                  <td>
                    {v.triageCategory === 'RED'
                      ? <span className="text-urgent">{t('triage.now')}</span>
                      : formatWaitTime(v)}
                  </td>
                  <td className="text-muted col-hide-mobile">{formatTime(v.createdAt)}</td>
                  <td>
                    <button
                      className="btn-accept"
                      onClick={() => setConfirmVisit(v)}
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

      {confirmVisit && (
        <Modal
          title={t('triage.confirmTitle')}
          onClose={() => setConfirmVisit(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setConfirmVisit(null)}>
                {t('triage.confirmNo')}
              </button>
              <button className="btn-primary" onClick={handleConfirmAccept} disabled={accepting}>
                {accepting ? '…' : t('triage.confirmYes')}
              </button>
            </>
          }
        >
          <p style={{ color: '#475569', lineHeight: 1.7 }}>
            {t('triage.confirmMsg', { name: confirmVisit.animalName })}
          </p>
        </Modal>
      )}
    </div>
  );
}
