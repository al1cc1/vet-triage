import api from './axios';
import type { AuthResponse, RegisterResponse } from '../types';

export const register = (data: { name: string; email: string; password: string }) =>
  api.post<RegisterResponse>('/auth/register', data).then(r => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data);

export const doctorLogin = (data: { clinicCode: string; doctorPin: string }) =>
  api.post<AuthResponse>('/auth/doctor-login', data).then(r => r.data);

export const resendVerification = (email: string) =>
  api.post('/auth/resend-verification', { email }).then(r => r.data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }).then(r => r.data);

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword }).then(r => r.data);
