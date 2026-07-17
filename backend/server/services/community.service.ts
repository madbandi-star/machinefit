import type { BoardType, RoleCode } from '@machinefit/shared';
import type {
  CreatePostInput,
  CreateCommentInput,
  CreateMachineRequestInput,
  OwnerApplicationInput,
  CreateOwnerGymInput,
  AddGymMachineInput,
} from '@machinefit/shared';
import { communityRepository } from '../repositories/community.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { MOCK_GYMS, MOCK_MACHINES, type MockGym } from '../data/mock.js';
import { devOwnerUserIds } from '../data/community.mock.js';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.util.js';
import type { Gym, GymMachine } from '@machinefit/shared';

const DEFAULT_HOURS = {
  mon: { open: '06:00', close: '22:00' },
  tue: { open: '06:00', close: '22:00' },
  wed: { open: '06:00', close: '22:00' },
  thu: { open: '06:00', close: '22:00' },
  fri: { open: '06:00', close: '22:00' },
  sat: { open: '08:00', close: '20:00' },
  sun: { open: '08:00', close: '18:00' },
};

export const communityService = {
  listPosts(boardType?: BoardType, page = 1, limit = 20) {
    return communityRepository.listPosts(boardType, page, limit);
  },

  async getPost(postId: string) {
    const post = await communityRepository.getPost(postId);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const comments = await communityRepository.listComments(postId);
    return { post, comments };
  },

  async createPost(userId: string, input: CreatePostInput) {
    const user = await userRepository.findById(userId);
    return communityRepository.createPost(userId, user?.displayName ?? 'User', input);
  },

  async deletePost(postId: string, userId: string, roleCode: RoleCode) {
    await communityRepository.deletePost(postId, userId, roleCode);
  },

  async createComment(postId: string, userId: string, input: CreateCommentInput) {
    const user = await userRepository.findById(userId);
    return communityRepository.createComment(postId, userId, user?.displayName ?? 'User', input);
  },

  toggleLike(postId: string, userId: string) {
    return communityRepository.toggleLike(postId, userId);
  },

  listMachineRequests(page = 1, limit = 20) {
    return communityRepository.listMachineRequests(page, limit);
  },

  async createMachineRequest(userId: string, input: CreateMachineRequestInput) {
    const user = await userRepository.findById(userId);
    return communityRepository.createMachineRequest(userId, user?.displayName ?? 'User', input);
  },
};

function getOwnerGyms(userId: string): MockGym[] {
  devOwnerUserIds.add(userId);
  return MOCK_GYMS.filter((g) => g.ownerId === userId || devOwnerUserIds.has(userId));
}

export const ownerService = {
  async apply(userId: string, input: OwnerApplicationInput) {
    const pool = getPool();
    devOwnerUserIds.add(userId);

    if (pool) {
      await pool.query(
        `INSERT INTO owner_applications (user_id, business_name, business_email, business_phone, description, status, reviewed_at)
         VALUES ($1,$2,$3,$4,$5,'approved',NOW())`,
        [userId, input.businessName, input.businessEmail ?? null, input.businessPhone ?? null, input.description ?? null]
      );
      const roleResult = await pool.query<{ id: string }>(
        "SELECT id FROM roles WHERE code = 'owner'"
      );
      if (roleResult.rows[0]) {
        await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [
          roleResult.rows[0].id,
          userId,
        ]);
      }
    }

    const user = await userRepository.findById(userId);
    const tokens = {
      accessToken: signAccessToken({ userId, roleCode: 'owner', email: user?.email ?? '' }),
      refreshToken: signRefreshToken({ userId }),
      expiresIn: '15m',
    };

    return {
      approved: true,
      message: 'Owner application approved',
      tokens,
      user: user ? { ...user, roleCode: 'owner' as const } : null,
    };
  },

  async dashboard(userId: string) {
    const gyms = getOwnerGyms(userId);
    const totalMachines = gyms.reduce((sum, g) => sum + g.machines.length, 0);
    return {
      gymCount: gyms.length,
      machineCount: totalMachines,
      verifiedCount: gyms.filter((g) => g.isVerified).length,
    };
  },

  listGyms(userId: string): Gym[] {
    return getOwnerGyms(userId).map(({ photos: _p, machines, ...gym }) => ({
      ...gym,
      machineCount: machines.length,
    }));
  },

  createGym(userId: string, input: CreateOwnerGymInput): Gym {
    const pool = getPool();
    if (MOCK_GYMS.some((g) => g.slug === input.slug)) {
      throw new AppError(409, 'SLUG_EXISTS', 'Gym slug already exists');
    }

    const gym: MockGym = {
      id: crypto.randomUUID(),
      ownerId: userId,
      slug: input.slug,
      name: input.name,
      address: input.address,
      city: input.city,
      countryId: input.countryCode.toLowerCase(),
      countryCode: input.countryCode,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      websiteUrl: input.websiteUrl || undefined,
      businessHours: DEFAULT_HOURS,
      amenities: {},
      isVerified: false,
      isActive: true,
      machineCount: 0,
      photos: [],
      machines: [],
    };

    if (!pool) {
      MOCK_GYMS.push(gym);
      const { photos: _p, machines: _m, ...rest } = gym;
      return rest;
    }

    throw new AppError(503, 'DB_OWNER_GYM', 'DB gym creation pending full implementation');
  },

  getGymMachines(userId: string, gymId: string): GymMachine[] {
    const gym = getOwnerGyms(userId).find((g) => g.id === gymId || g.slug === gymId);
    if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    return gym.machines;
  },

  addGymMachine(userId: string, gymId: string, input: AddGymMachineInput): GymMachine {
    const gym = MOCK_GYMS.find(
      (g) => (g.id === gymId || g.slug === gymId) && (g.ownerId === userId || devOwnerUserIds.has(userId))
    );
    if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');

    const machine = MOCK_MACHINES.find((m) => m.code === input.machineCode);
    if (!machine) throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);

    const existing = gym.machines.find((m) => m.machineCode === input.machineCode);
    if (existing) {
      existing.quantity += input.quantity;
      existing.floorZone = input.floorZone ?? existing.floorZone;
      existing.notes = input.notes ?? existing.notes;
      return existing;
    }

    const item: GymMachine = {
      id: crypto.randomUUID(),
      gymId: gym.id,
      machineId: machine.id,
      machineCode: machine.code,
      machineName: machine.name.en,
      muscleGroup: machine.muscleGroup,
      quantity: input.quantity,
      notes: input.notes,
      isAvailable: true,
      floorZone: input.floorZone,
    };
    gym.machines.push(item);
    gym.machineCount = gym.machines.length;
    return item;
  },

  removeGymMachine(userId: string, gymId: string, itemId: string): void {
    const gym = MOCK_GYMS.find(
      (g) => (g.id === gymId || g.slug === gymId) && (g.ownerId === userId || devOwnerUserIds.has(userId))
    );
    if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    const idx = gym.machines.findIndex((m) => m.id === itemId);
    if (idx === -1) throw new AppError(404, 'NOT_FOUND', 'Machine not found in inventory');
    gym.machines.splice(idx, 1);
    gym.machineCount = gym.machines.length;
  },
};
