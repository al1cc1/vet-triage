export type TriageCategory = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
export type VisitStatus = 'WAITING' | 'IN_PROGRESS' | 'DONE';
export type Gender = 'MALE' | 'FEMALE';
export type Role = 'RECEPTION' | 'DOCTOR';

export interface VisitResponse {
  id: string;
  createdAt: string;
  reason: string;
  triageCategory: TriageCategory;
  waitingMinutes: number;
  status: VisitStatus;
  animalName: string;
  species: string;
  breed: string | null;
  gender: Gender;
  ageYears: number | null;
  color: string | null;
  weightKg: number | null;
  ownerFullName: string;
  ownerPhone: string;
}

export interface AuthResponse {
  token: string;
  role: Role;
  clinicCode: string;
  clinicId: string;
}

export interface RegisterResponse {
  autoLogin: boolean;
  message: string;
  token?: string;
  role?: string;
  clinicCode?: string;
  clinicId?: string;
}

export interface ClinicSettings {
  accentColor: string;
  language: string;
  clinicCode: string;
  name: string;
  mobilePin?: string | null;
  notifyRed: boolean;
  notifyOrange: boolean;
  createdAt: string;
  totalVisits: number;
}

export interface DeviceToken {
  id: string;
  deviceName: string | null;
  lastSeen: string;
  approved: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  role: Role;
}

export interface UpdateVisitPayload {
  triageCategory?: TriageCategory;
  waitingMinutes?: number;
  status?: VisitStatus;
  reason?: string;
}

export interface CreateVisitPayload {
  animalName: string;
  species: string;
  breed?: string;
  gender: Gender;
  ageYears?: number;
  color?: string;
  weightKg?: number;
  ownerFullName: string;
  ownerAddress?: string;
  ownerPhone: string;
  reason: string;
  symptoms: string[];
  manualTriageCategory?: TriageCategory;
  manualWaitingMinutes?: number;
}
