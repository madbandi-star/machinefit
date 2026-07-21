import type { Gender } from './api.types.js';

export type GymMemberProfileAccess = 'none' | 'pending' | 'approved' | 'denied';

export interface GymMember {
  id: string;
  gymId: string;
  ownerUserId: string;
  name: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  memo?: string;
  email?: string;
  linkedUserId?: string;
  profileAccess: GymMemberProfileAccess;
  isSelf: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GymMemberProfileRequest {
  id: string;
  memberId: string;
  gymId: string;
  ownerUserId: string;
  targetUserId: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  respondedAt?: string;
}
