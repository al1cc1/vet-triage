import api from './axios';
import type { AuthResponse } from '../types';

export const register = (data: { name: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data).then(r => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data);

export const doctorLogin = (data: { clinicCode: string; doctorPin: string }) =>
  api.post<AuthResponse>('/auth/doctor-login', data).then(r => r.data);
