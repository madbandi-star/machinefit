import type {
  AddGymMachineInput,
  CreateOwnerGymInput,
  OwnerApplicationInput,
  ReviewOwnerApplicationInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { ownerApplicationRepository } from '../repositories/owner-application.repository.js';
import { gymInventoryService } from './gym-inventory.service.js';
import { gymRepository } from '../repositories/gym.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { emailService } from './email.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { MOCK_GYMS, MOCK_MACHINES, type MockGym } from '../data/mock.js';
import type { Gym, GymMachine } from '@machinefit/shared';

const DEFAULT_HOURS = {
  mon: { open: '06:00', close: '23:00' },
  tue: { open: '06:00', close: '23:00' },
  wed: { open: '06:00', close: '23:00' },
  thu: { open: '06:00', close: '23:00' },
  fri: { open: '06:00', close: '23:00' },
  sat: { open: '08:00', close: '20:00' },
  sun: { open: '08:00', close: '18:00' },
};

const devOwnerUserIds = new Set<string>();

function getOwnerGyms(userId: string): MockGym[] {
  return MOCK_GYMS.filter((g) => g.ownerId === userId || devOwnerUserIds.has(userId));
}

function requirePaymentForApply(): boolean {
  return process.env.OWNER_APPLY_REQUIRE_PAYMENT === 'true';
}

function adminNotifyEmail(): string | undefined {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || process.env.SMTP_USER?.trim() || undefined;
}

export const ownerService = {
  async apply(userId: string, input: OwnerApplicationInput) {
    const pool = getPool();
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    if (user.roleCode === 'owner' || user.roleCode === 'admin') {
      throw new AppError(400, 'ALREADY_OWNER', 'This account already has owner privileges');
    }

    if (requirePaymentForApply()) {
      if (input.paymentStatus !== 'paid' || !input.paymentReference) {
        throw new AppError(
          402,
          'PAYMENT_REQUIRED',
          'Owner verification requires completed payment before applying'
        );
      }
    } else if (input.paymentStatus === 'pending') {
      throw new AppError(
        400,
        'PAYMENT_PENDING',
        'Complete payment (or use waived until billing launches) before applying'
      );
    }

    if (!pool) {
      // Dev/mock: keep immediate approve for local offline mode only.
      devOwnerUserIds.add(userId);
      return {
        approved: true,
        pending: false,
        message: 'Owner application approved (mock mode)',
        application: null,
        user: { ...user, roleCode: 'owner' as const },
      };
    }

    const pending = await ownerApplicationRepository.findPendingByUser(userId);
    if (pending) {
      throw new AppError(409, 'APPLICATION_PENDING', 'You already have a pending owner application');
    }

    const application = await ownerApplicationRepository.create(userId, {
      ...input,
      paymentStatus: input.paymentStatus ?? 'waived',
    });

    const notifyTo = adminNotifyEmail();
    if (notifyTo) {
      const text = [
        'MachineFit 사장 인증 신청',
        '',
        `신청 ID: ${application.id}`,
        `헬스장명: ${application.businessName}`,
        `신청자: ${application.applicantName ?? '-'}`,
        `연락처: ${application.businessPhone ?? '-'}`,
        `이메일: ${application.businessEmail ?? '-'}`,
        `계정 이메일: ${user.email}`,
        `결제상태: ${application.paymentStatus}`,
        `증빙: ${application.evidenceUrl ?? '(없음)'}`,
        `메모: ${application.description ?? '(없음)'}`,
        '',
        '관리자 페이지에서 승인/반려해 주세요.',
      ].join('\n');

      try {
        await emailService.send({
          to: notifyTo,
          subject: `[MachineFit] 사장 인증 신청 — ${application.businessName}`,
          text,
        });
      } catch {
        // Application is saved even if email delivery fails.
      }
    }

    return {
      approved: false,
      pending: true,
      message: 'Owner application submitted. An admin will review it.',
      application,
      user,
    };
  },

  async listApplications(status?: 'pending' | 'approved' | 'rejected') {
    return ownerApplicationRepository.list(status);
  },

  async reviewApplication(
    applicationId: string,
    reviewerId: string,
    input: ReviewOwnerApplicationInput
  ) {
    const existing = await ownerApplicationRepository.findById(applicationId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Application not found');
    if (existing.status !== 'pending') {
      throw new AppError(400, 'ALREADY_REVIEWED', 'Application was already reviewed');
    }

    const reviewed = await ownerApplicationRepository.review(applicationId, reviewerId, input);
    if (!reviewed) throw new AppError(404, 'NOT_FOUND', 'Application not found');

    if (input.status === 'approved') {
      await ownerApplicationRepository.grantOwnerRole(reviewed.userId);
      if (reviewed.gymId) {
        await ownerApplicationRepository.ensureGymPermission(
          reviewed.gymId,
          reviewed.userId,
          'owner'
        );
      }

      await notificationService.notify(
        reviewed.userId,
        'system',
        { ko: '사장 인증 승인', en: 'Owner verification approved' },
        {
          ko: '확인되었습니다. 이제 헬스장 공식 보유기구를 관리할 수 있습니다.',
          en: 'Your gym owner verification was approved.',
        },
        { linkPath: '/owner' }
      );
    } else {
      await notificationService.notify(
        reviewed.userId,
        'system',
        { ko: '사장 인증 반려', en: 'Owner verification rejected' },
        {
          ko: input.adminNote
            ? `신청이 반려되었습니다. 사유: ${input.adminNote}`
            : '신청이 반려되었습니다. 내용을 확인 후 다시 신청해 주세요.',
          en: input.adminNote
            ? `Application rejected: ${input.adminNote}`
            : 'Your owner application was rejected.',
        },
        { linkPath: '/my-page' }
      );
    }

    return reviewed;
  },

  async dashboard(userId: string) {
    const pool = getPool();
    if (!pool) {
      const gyms = getOwnerGyms(userId);
      const totalMachines = gyms.reduce((sum, g) => sum + g.machines.length, 0);
      return {
        gymCount: gyms.length,
        machineCount: totalMachines,
        verifiedCount: gyms.filter((g) => g.isVerified).length,
      };
    }

    const result = await pool.query<{
      gym_count: string;
      machine_count: string;
      verified_count: string;
    }>(
      `SELECT
         COUNT(DISTINCT g.id)::text AS gym_count,
         COUNT(gm.id) FILTER (WHERE gm.deleted_at IS NULL)::text AS machine_count,
         COUNT(DISTINCT g.id) FILTER (WHERE g.is_verified)::text AS verified_count
       FROM gyms g
       LEFT JOIN gym_owner_permissions p
         ON p.gym_id = g.id AND p.user_id = $1 AND p.status = 'active'
       LEFT JOIN gym_machines gm ON gm.gym_id = g.id
       WHERE g.owner_id = $1 OR p.id IS NOT NULL`,
      [userId]
    );

    return {
      gymCount: parseInt(result.rows[0]?.gym_count ?? '0', 10),
      machineCount: parseInt(result.rows[0]?.machine_count ?? '0', 10),
      verifiedCount: parseInt(result.rows[0]?.verified_count ?? '0', 10),
    };
  },

  async listGyms(userId: string): Promise<Gym[]> {
    const pool = getPool();
    if (!pool) {
      return getOwnerGyms(userId).map(({ photos: _p, machines, ...gym }) => ({
        ...gym,
        machineCount: machines.length,
      }));
    }

    const result = await pool.query(
      `SELECT g.*, c.code AS country_code,
         (SELECT COUNT(*)::text FROM gym_machines gm
          WHERE gm.gym_id = g.id AND gm.deleted_at IS NULL) AS machine_count
       FROM gyms g
       LEFT JOIN countries c ON c.id = g.country_id
       LEFT JOIN gym_owner_permissions p
         ON p.gym_id = g.id AND p.user_id = $1 AND p.status = 'active'
       WHERE g.owner_id = $1 OR p.id IS NOT NULL
       ORDER BY g.name ASC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      slug: row.slug ?? undefined,
      name: row.name,
      description: row.description ?? undefined,
      address: row.address,
      city: row.city ?? undefined,
      countryId: row.country_id,
      countryCode: row.country_code,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      phone: row.phone ?? undefined,
      websiteUrl: row.website_url ?? undefined,
      businessHours: row.business_hours ?? undefined,
      amenities: row.amenities ?? undefined,
      isVerified: row.is_verified,
      isActive: row.is_active,
      machineCount: row.machine_count ? parseInt(row.machine_count, 10) : 0,
    }));
  },

  async createGym(userId: string, input: CreateOwnerGymInput): Promise<Gym> {
    const pool = getPool();
    if (!pool) {
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
      MOCK_GYMS.push(gym);
      const { photos: _p, machines: _m, ...rest } = gym;
      return rest;
    }

    const country = await pool.query<{ id: string }>(
      'SELECT id FROM countries WHERE code = $1 LIMIT 1',
      [input.countryCode.toUpperCase()]
    );
    if (!country.rows[0]) {
      throw new AppError(400, 'INVALID_COUNTRY', 'Invalid country code');
    }

    const slugCheck = await pool.query(`SELECT id FROM gyms WHERE slug = $1`, [input.slug]);
    if (slugCheck.rows[0]) {
      throw new AppError(409, 'SLUG_EXISTS', 'Gym slug already exists');
    }

    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO gyms (
         owner_id, name, slug, address, city, country_id, latitude, longitude,
         phone, website_url, business_hours, amenities, is_verified, is_active,
         registration_status, submitted_at, approved_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,'{}'::jsonb,FALSE,TRUE,
         'approved',NOW(),NOW()
       )
       RETURNING id`,
      [
        userId,
        input.name,
        input.slug,
        input.address,
        input.city ?? null,
        country.rows[0].id,
        input.latitude ?? null,
        input.longitude ?? null,
        input.phone ?? null,
        input.websiteUrl || null,
        JSON.stringify(DEFAULT_HOURS),
      ]
    );

    const gymId = inserted.rows[0].id;
    await ownerApplicationRepository.ensureGymPermission(gymId, userId, 'owner');
    const gym = await gymRepository.findByIdOrSlug(gymId);
    if (!gym) throw new AppError(500, 'CREATE_FAILED', 'Failed to load created gym');
    return gym;
  },

  async getGymMachines(userId: string, gymId: string): Promise<GymMachine[]> {
    const pool = getPool();
    if (!pool) {
      const gym = getOwnerGyms(userId).find((g) => g.id === gymId || g.slug === gymId);
      if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
      return gym.machines;
    }

    const { items } = await gymInventoryService.list(gymId, {
      viewerUserId: userId,
      viewerRole: 'owner',
    });
    return items;
  },

  async addGymMachine(
    userId: string,
    gymId: string,
    input: AddGymMachineInput
  ): Promise<GymMachine> {
    const pool = getPool();
    if (!pool) {
      const gym = MOCK_GYMS.find(
        (g) => (g.id === gymId || g.slug === gymId) && (g.ownerId === userId || devOwnerUserIds.has(userId))
      );
      if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
      const machine = MOCK_MACHINES.find((m) => m.code === input.machineCode);
      if (!machine) throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);
      const existing = gym.machines.find((m) => m.machineCode === input.machineCode);
      if (existing) {
        throw new AppError(409, 'DUPLICATE_MACHINE', 'This machine is already registered at this gym');
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
        isVerified: true,
        registeredByRole: 'owner',
      };
      gym.machines.push(item);
      gym.machineCount = gym.machines.length;
      return item;
    }

    return gymInventoryService.add(gymId, userId, 'owner', input);
  },

  async removeGymMachine(userId: string, gymId: string, itemId: string): Promise<void> {
    const pool = getPool();
    if (!pool) {
      const gym = MOCK_GYMS.find(
        (g) => (g.id === gymId || g.slug === gymId) && (g.ownerId === userId || devOwnerUserIds.has(userId))
      );
      if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
      const idx = gym.machines.findIndex((m) => m.id === itemId);
      if (idx === -1) throw new AppError(404, 'NOT_FOUND', 'Machine not found in inventory');
      gym.machines.splice(idx, 1);
      gym.machineCount = gym.machines.length;
      return;
    }

    await gymInventoryService.remove(gymId, itemId, userId, 'owner');
  },
};
