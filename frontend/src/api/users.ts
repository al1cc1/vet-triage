import api from './axios';
import type { UserResponse } from '../types';

export const createDoctor = (data: { email: string; pin: string }) =>
  api.post<UserResponse>('/users/doctors', data).then(r => r.data);

export const getDoctors = () =>
  api.get<UserResponse[]>('/users/doctors').then(r => r.data);
