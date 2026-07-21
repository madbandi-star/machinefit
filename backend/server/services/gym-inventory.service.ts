import type {
  AddGymMachineInput,
  GymInventoryCapabilities,
  GymMachine,
  GymMachineRegistrantRole,
  RoleCode,
} from '@machinefit/shared';
import { gymInventoryRepository } from '../repositories/gym-inventory.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

function registrantRole(roleCode: RoleCode): GymMachineRegistrantRole {
  if (roleCode === 'admin') return 'admin';
  if (roleCode === 'owner') return 'owner';
  return 'member';
}

export const gymInventoryService = {
  async list(
    gymIdOrSlug: string,
    options: {
      brandCode?: string;
      q?: string;
      viewerUserId?: string;
      viewerRole?: RoleCode;
      locale?: string;
    } = {}
  ): Promise<{ items: GymMachine[]; capabilities: GymInventoryCapabilities }> {
    const gymId = await gymInventoryRepository.resolveGymId(gymIdOrSlug);
    if (!gymId) throw new AppError(404, 'NOT_FOUND', 'Gym not found');

    const isOperator = options.viewerUserId
      ? await gymInventoryRepository.isGymOperator(options.viewerUserId, gymId)
      : false;

    const items = await gymInventoryRepository.listActive(gymId, {
      ...options,
      isOperator: isOperator || options.viewerRole === 'admin',
    });

    return {
      items,
      capabilities: gymInventoryRepository.buildCapabilities(options.viewerRole, isOperator),
    };
  },

  async add(
    gymIdOrSlug: string,
    userId: string,
    roleCode: RoleCode,
    input: AddGymMachineInput
  ): Promise<GymMachine> {
    if (roleCode === 'guest') {
      throw new AppError(403, 'FORBIDDEN', 'Login required to register gym machines');
    }

    const gymId = await gymInventoryRepository.resolveGymId(gymIdOrSlug);
    if (!gymId) throw new AppError(404, 'NOT_FOUND', 'Gym not found');

    const machineId = await machineRepository.findIdByCode(input.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);
    }

    const existing = await gymInventoryRepository.findActiveByMachine(gymId, machineId);
    if (existing) {
      throw new AppError(409, 'DUPLICATE_MACHINE', 'This machine is already registered at this gym');
    }

    const isOperator =
      roleCode === 'admin' || (await gymInventoryRepository.isGymOperator(userId, gymId));
    /** Official/verified only when gym operator (or admin) registers for that gym. */
    const isVerified = isOperator;

    try {
      return await gymInventoryRepository.add({
        gymId,
        machineId,
        input,
        registeredBy: userId,
        registeredByRole: isOperator && roleCode !== 'admin' ? 'owner' : registrantRole(roleCode),
        isVerified,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('uq_gym_machines_active') || message.includes('duplicate key')) {
        throw new AppError(409, 'DUPLICATE_MACHINE', 'This machine is already registered at this gym');
      }
      throw error;
    }
  },

  async remove(
    gymIdOrSlug: string,
    itemId: string,
    userId: string,
    roleCode: RoleCode
  ): Promise<void> {
    const gymId = await gymInventoryRepository.resolveGymId(gymIdOrSlug);
    if (!gymId) throw new AppError(404, 'NOT_FOUND', 'Gym not found');

    const item = await gymInventoryRepository.findById(itemId);
    if (!item || item.gymId !== gymId || item.deletedAt) {
      throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    }

    const isOperator =
      roleCode === 'admin' || (await gymInventoryRepository.isGymOperator(userId, gymId));

    if (item.isVerified) {
      if (!isOperator) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Official (owner-verified) machines can only be removed by the gym owner'
        );
      }
    } else if (!isOperator && item.registeredBy !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only remove machines you registered');
    }

    const ok = await gymInventoryRepository.softDelete(itemId, userId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
  },

  async adminList(gymId: string, includeDeleted = true): Promise<GymMachine[]> {
    const resolved = await gymInventoryRepository.resolveGymId(gymId);
    if (!resolved) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    return gymInventoryRepository.listAllForAdmin(resolved, includeDeleted);
  },

  async adminRestore(itemId: string): Promise<void> {
    try {
      const ok = await gymInventoryRepository.restore(itemId);
      if (!ok) throw new AppError(404, 'NOT_FOUND', 'Deleted gym machine not found');
    } catch (error) {
      if (error instanceof Error && error.message === 'ACTIVE_DUPLICATE') {
        throw new AppError(
          409,
          'DUPLICATE_MACHINE',
          'Cannot restore: an active registration for this machine already exists'
        );
      }
      throw error;
    }
  },

  async adminForceDelete(itemId: string): Promise<void> {
    const ok = await gymInventoryRepository.forceDelete(itemId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
  },
};
