import crypto from 'node:crypto';
import { Role } from '@machinefit/shared';
import { devUsers } from './dev-users.js';

/**
 * Seed in-memory users when DATABASE_URL is unset.
 * Password login was removed — these rows exist only for non-DB local smoke of
 * role-gated routes if something still looks them up by id.
 */
export async function seedDevUsers(): Promise<void> {
  const now = new Date().toISOString();
  const seeds: Array<{
    email: string;
    displayName: string;
    roleCode: (typeof Role)[keyof typeof Role];
  }> = [
    { email: 'admin@machinefit.com', displayName: 'Admin', roleCode: Role.ADMIN },
    { email: 'demo@machinefit.com', displayName: 'Demo Member', roleCode: Role.MEMBER },
    { email: 'premium@machinefit.com', displayName: 'Premium Demo', roleCode: Role.MEMBER },
    { email: 'vip@machinefit.com', displayName: 'VIP Demo', roleCode: Role.MEMBER },
  ];

  for (const seed of seeds) {
    if (devUsers.has(seed.email)) continue;
    devUsers.set(seed.email, {
      id: crypto.randomUUID(),
      email: seed.email,
      displayName: seed.displayName,
      roleCode: seed.roleCode,
      isActive: true,
      createdAt: now,
    });
  }
}
