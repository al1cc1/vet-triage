import type { VisitResponse } from '../types';

export function formatWaitTime(visit: VisitResponse): string {
  if (visit.triageCategory === 'RED') return 'Teraz';
  const elapsedMin = Math.floor((Date.now() - new Date(visit.createdAt).getTime()) / 60000);
  const remaining = visit.waitingMinutes - elapsedMin;
  if (remaining <= 5) return '<5 min';
  return `${remaining} min`;
}
