import { devUsers } from './dev-users.js';
import { hashPassword } from '../utils/hash.util.js';

let seeded = false;

export async function seedDevUsers(): Promise<void> {
  if (seeded) return;
  seeded = true;

  if (!devUsers.has('admin@machinefit.com')) {
    const adminHash = await hashPassword('admin123');
    devUsers.set('admin@machinefit.com', {
      id: 'admin-dev-1',
      email: 'admin@machinefit.com',
      passwordHash: adminHash,
      displayName: 'Admin',
      roleCode: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (!devUsers.has('demo@machinefit.com')) {
    const memberHash = await hashPassword('demo123');
    devUsers.set('demo@machinefit.com', {
      id: 'demo-dev-1',
      email: 'demo@machinefit.com',
      passwordHash: memberHash,
      displayName: 'Demo User',
      roleCode: 'member',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }
}
