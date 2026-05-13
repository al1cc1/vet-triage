import api from './axios';
import type { AuthResponse } from '../types';

export const doctorLogin = (data: { clinicCode: string; doctorPin: string }) =>
  api.post<AuthResponse>('/auth/doctor-login', data).then(r => r.data);

export const mobileLogin = (data: { clinicCode: string; clinicPin: string }) =>
  api.post<AuthResponse>('/auth/mobile-login', data).then(r => r.data);

export const registerClinic = (data: { clinicName: string }) =>
  api.post<{ clinicId: string; clinicCode: string }>('/auth/register', data).then(r => r.data);

export const verifySession = () =>
  api.post<{ clinicId: string; clinicCode: string }>('/auth/verify-session').then(r => r.data);
