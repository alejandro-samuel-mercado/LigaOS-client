/**
 * User-related type definitions.
 * Covers authentication DTOs, profile data, and role-based permissions.
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PRESIDENT = 'PRESIDENT',
  COACH = 'COACH',
  PLAYER = 'PLAYER',
  REFEREE = 'REFEREE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  dni: string | null;
  phone: string | null;
  birthdate: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  publicFields: string[];
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  lastName: string;
  dni?: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
  lastName?: string;
  phone?: string;
  image?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  publicFields?: string[];
}
