import { DEMO_PASSWORD, Role } from '@machinefit/shared';
import { devUsers } from './dev-users.js';
import { hashPassword } from '../utils/hash.util.js';

let seeded = false;

export async function seedDevUsers(): Promise<void> {
  if (seeded) return;
  seeded = true;

  if (!devUsers.has('admin@machinefit.com')) {
    const adminHash = await hashPassword(DEMO_PASSWORD);
    devUsers.set('admin@machinefit.com', {
      id: 'admin-dev-1',
      email: 'admin@machinefit.com',
      passwordHash: adminHash,
      displayName: 'Admin',
      roleCode: Role.ADMIN,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (!devUsers.has('demo@machinefit.com')) {
    const memberHash = await hashPassword(DEMO_PASSWORD);
    devUsers.set('demo@machinefit.com', {
      id: 'demo-dev-1',
      email: 'demo@machinefit.com',
      passwordHash: memberHash,
      displayName: 'Demo User',
      roleCode: Role.MEMBER,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (!devUsers.has('demo_premium@gmail.com')) {
    const premiumHash = await hashPassword(DEMO_PASSWORD);
    devUsers.set('demo_premium@gmail.com', {
      id: 'demo-premium-1',
      email: 'demo_premium@gmail.com',
      passwordHash: premiumHash,
      displayName: 'Demo Premium',
      roleCode: Role.PREMIUM_MEMBER,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (!devUsers.has('demo_vip@gmail.com')) {
    const vipHash = await hashPassword(DEMO_PASSWORD);
    devUsers.set('demo_vip@gmail.com', {
      id: 'demo-vip-1',
      email: 'demo_vip@gmail.com',
      passwordHash: vipHash,
      displayName: 'Demo VIP',
      roleCode: Role.VIP_MEMBER,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }
}
