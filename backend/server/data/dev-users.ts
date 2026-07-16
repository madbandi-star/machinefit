import type { RoleCode } from '@machinefit/shared';

export interface DevUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  roleCode: RoleCode;
  isActive: boolean;
  createdAt: string;
}

export const devUsers = new Map<string, DevUser>();

export function listDevUsers(): DevUser[] {
  return [...devUsers.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function findDevUserById(id: string): DevUser | undefined {
  return [...devUsers.values()].find((u) => u.id === id);
}

export function findDevUserByEmail(email: string): DevUser | undefined {
  return devUsers.get(email);
}

export function updateDevUser(id: string, patch: Partial<Pick<DevUser, 'roleCode' | 'isActive' | 'displayName'>>): DevUser | null {
  const user = findDevUserById(id);
  if (!user) return null;
  if (patch.roleCode) user.roleCode = patch.roleCode;
  if (patch.isActive !== undefined) user.isActive = patch.isActive;
  if (patch.displayName) user.displayName = patch.displayName;
  return user;
}
