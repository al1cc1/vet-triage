import api from './axios';
import type { CreateVisitPayload, UpdateVisitPayload, TriageCategory, VisitStatus, VisitResponse } from '../types';

export const createVisit = (data: CreateVisitPayload) =>
  api.post<VisitResponse>('/visits', data).then(r => r.data);

export const updateVisit = (id: string, data: UpdateVisitPayload) =>
  api.put<VisitResponse>(`/visits/${id}`, data).then(r => r.data);

export const removeVisit = (id: string) =>
  api.delete(`/visits/${id}`);

export const acceptVisit = (id: string) =>
  api.patch<VisitResponse>(`/visits/${id}/accept`).then(r => r.data);

export const getQueue = (clinicCode: string) =>
  api.get<VisitResponse[]>(`/visits/queue/${clinicCode}`).then(r => r.data);

export const getHistory = (clinicCode: string) =>
  api.get<VisitResponse[]>(`/visits/history/${clinicCode}`).then(r => r.data);

export const getPreviewTime = (category: TriageCategory) =>
  api.get<{ category: string; waitingMinutes: number }>(`/visits/preview-time/${category}`).then(r => r.data);

export interface HistoryFilter {
  dateFrom?: string;
  dateTo?: string;
  category?: TriageCategory[];
  species?: string;
  status?: VisitStatus;
  search?: string;
}

export const getFilteredHistory = (params: HistoryFilter) => {
  const p = new URLSearchParams();
  if (params.dateFrom) p.set('dateFrom', params.dateFrom);
  if (params.dateTo) p.set('dateTo', params.dateTo);
  params.category?.forEach(c => p.append('category', c));
  if (params.species) p.set('species', params.species);
  if (params.status) p.set('status', params.status);
  if (params.search) p.set('search', params.search);
  const qs = p.toString();
  return api.get<VisitResponse[]>(`/visits/history${qs ? '?' + qs : ''}`).then(r => r.data);
};
