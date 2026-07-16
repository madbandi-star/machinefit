import type {
  ExperienceLevel,
  Gender,
  RoleCode,
  UnitHeight,
  UnitWeight,
} from './api.types.js';

export interface User {
  id: string;
  roleId: string;
  roleCode: RoleCode;
  email: string;
  displayName: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  experienceLevel?: ExperienceLevel;
  countryId?: string;
  languageId?: string;
  languageCode?: string;
  unitHeight: UnitHeight;
  unitWeight: UnitWeight;
  timezone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
