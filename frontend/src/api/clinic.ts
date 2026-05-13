import api from './axios';
import type { ClinicSettings, DeviceToken, VisitResponse } from '../types';

export const getSettings = () =>
  api.get<ClinicSettings>('/clinic/settings').then(r => r.data);

export const updateSettings = (data: {
  name?: string;
  accentColor?: string;
  language?: string;
  mobilePin?: string | null;
  notifyRed?: boolean;
  notifyOrange?: boolean;
}) => api.put<ClinicSettings>('/clinic/settings', data).then(r => r.data);

export const deleteAccount = () =>
  api.delete('/clinic');

export const getDevices = (clinicCode: string) =>
  api.get<DeviceToken[]>(`/devices/${clinicCode}`).then(r => r.data);

export const deleteDevice = (id: string) =>
  api.delete(`/devices/${id}`);

export const getAllHistory = () =>
  api.get<VisitResponse[]>('/visits/history').then(r => r.data);
