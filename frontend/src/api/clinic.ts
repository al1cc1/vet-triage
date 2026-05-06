import api from './axios';
import type { ClinicSettings } from '../types';

export const getSettings = () =>
  api.get<ClinicSettings>('/clinic/settings').then(r => r.data);

export const updateSettings = (data: { accentColor?: string; language?: string }) =>
  api.put<ClinicSettings>('/clinic/settings', data).then(r => r.data);
