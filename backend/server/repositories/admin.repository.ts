import {
  isRoleCode,
  type Post,
  type MachineRequest,
  type Report,
  type Gym,
  type Brand,
  type Machine,
  type RoleCode,
  type UpdateUserAdminInput,
  type ModeratePostInput,
  type VerifyGymInput,
  type UpdateMachineRequestAdminInput,
  type ResolveReportInput,
  type ToggleActiveInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { MOCK_GYMS, MOCK_BRANDS, MOCK_MACHINES } from '../data/mock.js';
import { mockPosts, mockMachineRequests } from '../data/community.mock.js';
import { mockReports } from '../data/admin.mock.js';
import { listDevUsers, updateDevUser } from '../data/dev-users.js';
import { userRepository } from './user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';

export const adminRepository = {
  async dashboard() {
    const pool = getPool();
    const devUserCount = listDevUsers().length;
    const pendingReports = mockReports.filter((r) => r.status === 'pending').length;
    const hiddenPosts = mockPosts.filter((p) => p.isHidden).length;

    let userCount = devUserCount + 3;
    let gymCount = MOCK_GYMS.length;
    let verifiedGyms = MOCK_GYMS.filter((g) => g.isVerified).length;
    let pendingRequests = mockMachineRequests.filter((r) => r.status === 'pending').length;
    if (pool) {
      const count = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM users'
      );
      userCount = parseInt(count.rows[0]?.count ?? '0', 10);
      const gymStats = await pool.query<{ total: string; verified: string }>(
        `SELECT COUNT(*)::text AS total,
                COUNT(*) FILTER (WHERE is_verified = TRUE)::text AS verified
         FROM gyms`
      );
      gymCount = parseInt(gymStats.rows[0]?.total ?? '0', 10);
      verifiedGyms = parseInt(gymStats.rows[0]?.verified ?? '0', 10);
      const pending = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM machine_requests
         WHERE status = 'pending' AND is_hidden = FALSE`
      );
      pendingRequests = parseInt(pending.rows[0]?.count ?? '0', 10);
    }

    return {
      userCount,
      gymCount,
      machineCount: MOCK_MACHINES.length,
      brandCount: MOCK_BRANDS.length,
      postCount: mockPosts.length,
      pendingRequests,
      pendingReports,
      hiddenPosts,
      verifiedGyms,
    };
  },

  async listUsers(page = 1, limit = 20) {
    const pool = getPool();
    if (!pool) {
      const users = listDevUsers().map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        roleCode: u.roleCode as RoleCode,
        isActive: u.isActive,
        createdAt: u.createdAt,
      }));
      const start = (page - 1) * limit;
      return {
        items: users.slice(start, start + limit),
        meta: buildPaginationMeta(page, limit, users.length),
      };
    }

    const count = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
    const total = parseInt(count.rows[0]?.count ?? '0', 10);
    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.is_active, u.created_at, r.code AS role_code
       FROM users u JOIN roles r ON r.id = u.role_id
       ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.display_name,
      roleCode: r.role_code as RoleCode,
      isActive: r.is_active,
      createdAt: r.created_at,
    }));
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async updateUser(userId: string, input: UpdateUserAdminInput) {
    const pool = getPool();
    if (!pool) {
      const user = updateDevUser(userId, {
        roleCode: input.roleCode,
        isActive: input.isActive,
        displayName: input.displayName,
      });
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roleCode: user.roleCode,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    }

    if (input.roleCode) {
      if (!isRoleCode(input.roleCode)) {
        throw new AppError(400, 'INVALID_ROLE', 'Invalid role');
      }
      const roleResult = await pool.query<{ id: string }>(
        'SELECT id FROM roles WHERE code = $1',
        [input.roleCode]
      );
      if (!roleResult.rows[0]) throw new AppError(400, 'INVALID_ROLE', 'Invalid role');
      await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [
        roleResult.rows[0].id,
        userId,
      ]);
      // Force clients to re-auth with a fresh role-bearing access token.
      await userRepository.deleteRefreshTokens(userId);
    }
    if (input.isActive !== undefined) {
      await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [
        input.isActive,
        userId,
      ]);
    }
    if (input.displayName !== undefined) {
      const { applyUsernameChange } = await import('../services/user.service.js');
      const normalized = await applyUsernameChange(userId, input.displayName);
      try {
        await userRepository.updateProfile(userId, { displayName: normalized });
      } catch (error: unknown) {
        const code =
          error && typeof error === 'object' && 'code' in error
            ? String((error as { code?: string }).code)
            : '';
        if (code === '23505') {
          throw new AppError(409, 'USERNAME_TAKEN', 'Username is already in use');
        }
        throw error;
      }
    }
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return user;
  },

  async listGyms(): Promise<Gym[]> {
    const pool = getPool();
    if (!pool) {
      return MOCK_GYMS.map(({ photos: _p, machines: _m, ...gym }) => ({
        ...gym,
        machineCount: _m.length,
      }));
    }

    const result = await pool.query<{
      id: string;
      owner_id: string;
      slug: string | null;
      name: string;
      description: Record<string, string> | null;
      address: string;
      city: string | null;
      country_id: string;
      country_code: string | null;
      latitude: string | null;
      longitude: string | null;
      phone: string | null;
      website_url: string | null;
      business_hours: Gym['businessHours'] | null;
      amenities: Record<string, boolean> | null;
      is_verified: boolean;
      is_active: boolean;
      machine_count: string;
    }>(
      `SELECT g.id, g.owner_id, g.slug, g.name, g.description, g.address, g.city, g.country_id,
              c.code AS country_code,
              g.latitude::text, g.longitude::text, g.phone, g.website_url,
              g.business_hours, g.amenities, g.is_verified, g.is_active,
              COALESCE(mc.machine_count, '0') AS machine_count
       FROM gyms g
       LEFT JOIN countries c ON c.id = g.country_id
       LEFT JOIN (
         SELECT gym_id, COUNT(*)::text AS machine_count
         FROM gym_machines
         WHERE deleted_at IS NULL
         GROUP BY gym_id
       ) mc ON mc.gym_id = g.id
       ORDER BY g.created_at DESC NULLS LAST, g.name ASC`
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
      countryCode: row.country_code ?? undefined,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      phone: row.phone ?? undefined,
      websiteUrl: row.website_url ?? undefined,
      businessHours: row.business_hours ?? undefined,
      amenities: row.amenities ?? undefined,
      isVerified: row.is_verified,
      isActive: row.is_active,
      machineCount: parseInt(row.machine_count, 10),
    }));
  },

  async verifyGym(gymId: string, input: VerifyGymInput): Promise<Gym> {
    const pool = getPool();
    if (!pool) {
      const gym = MOCK_GYMS.find((g) => g.id === gymId || g.slug === gymId);
      if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
      gym.isVerified = input.isVerified;
      const { photos: _p, machines: _m, ...rest } = gym;
      return rest;
    }

    const updated = await pool.query<{ id: string }>(
      `UPDATE gyms
       SET is_verified = $1, updated_at = NOW()
       WHERE id::text = $2 OR slug = $2
       RETURNING id`,
      [input.isVerified, gymId]
    );
    if (!updated.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Gym not found');

    const gyms = await this.listGyms();
    const gym = gyms.find((g) => g.id === updated.rows[0].id);
    if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    return gym;
  },

  listBrands(): Brand[] {
    return [...MOCK_BRANDS];
  },

  updateBrand(brandId: string, input: ToggleActiveInput): Brand {
    const brand = MOCK_BRANDS.find((b) => b.id === brandId || b.code === brandId);
    if (!brand) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    brand.isActive = input.isActive;
    return brand;
  },

  listMachines(): Machine[] {
    return [...MOCK_MACHINES];
  },

  updateMachine(machineId: string, input: ToggleActiveInput): Machine {
    const machine = MOCK_MACHINES.find((m) => m.id === machineId || m.code === machineId);
    if (!machine) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    machine.isActive = input.isActive;
    return machine;
  },

  listPosts(includeHidden = true): Post[] {
    return mockPosts
      .filter((p) => includeHidden || !p.isHidden)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  moderatePost(postId: string, input: ModeratePostInput): Post {
    const post = mockPosts.find((p) => p.id === postId);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    if (input.isHidden !== undefined) post.isHidden = input.isHidden;
    if (input.isPinned !== undefined) post.isPinned = input.isPinned;
    post.updatedAt = new Date().toISOString();
    return post;
  },

  async listMachineRequests(): Promise<MachineRequest[]> {
    const pool = getPool();
    if (!pool) {
      return [...mockMachineRequests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    const result = await pool.query<{
      id: string;
      user_id: string;
      brand_name: string;
      machine_name: string;
      description: string;
      status: string;
      admin_note: string | null;
      reject_reason: string | null;
      linked_machine_id: string | null;
      gym_choice_mode: string | null;
      gym_name: string | null;
      commercial_use_consent: boolean | null;
      like_count: number | null;
      comment_count: number | null;
      view_count: number | null;
      display_name: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT mr.*, u.display_name
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       ORDER BY mr.created_at DESC
       LIMIT 200`
    );
    return result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      brandName: r.brand_name,
      machineName: r.machine_name,
      description: r.description,
      status: r.status === 'approved' ? 'reviewing' : r.status,
      adminNote: r.admin_note,
      rejectReason: r.reject_reason,
      linkedMachineId: r.linked_machine_id ?? undefined,
      authorName: r.display_name ?? undefined,
      commercialUseConsent: Boolean(r.commercial_use_consent),
      gymChoiceMode: (r.gym_choice_mode as MachineRequest['gymChoiceMode']) ?? 'unknown',
      gymName: r.gym_name,
      likeCount: Number(r.like_count ?? 0),
      commentCount: Number(r.comment_count ?? 0),
      viewCount: Number(r.view_count ?? 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  updateMachineRequest(id: string, input: UpdateMachineRequestAdminInput): MachineRequest {
    const req = mockMachineRequests.find((r) => r.id === id);
    if (!req) throw new AppError(404, 'NOT_FOUND', 'Request not found');
    if (input.status) {
      req.status = input.status === 'approved' ? 'reviewing' : input.status;
    }
    if (input.adminNote !== undefined) req.adminNote = input.adminNote ?? undefined;
    if (input.linkedMachineId !== undefined) {
      req.linkedMachineId = input.linkedMachineId ?? undefined;
    }
    req.updatedAt = new Date().toISOString();
    return req;
  },

  async listReports(): Promise<Report[]> {
    const pool = getPool();
    if (pool) {
      const { complianceRepository } = await import('./compliance.repository.js');
      const rows = await complianceRepository.listCommunityReports();
      return rows.map((r) => ({
        id: r.id,
        reporterId: r.reporterId,
        postId: r.postId ?? undefined,
        commentId: r.commentId ?? undefined,
        reason: r.reason as Report['reason'],
        description: r.description ?? undefined,
        status: r.status as Report['status'],
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      }));
    }
    return [...mockReports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async resolveReport(id: string, input: ResolveReportInput, adminId: string): Promise<Report> {
    const pool = getPool();
    if (pool) {
      const { complianceRepository } = await import('./compliance.repository.js');
      const hidePost = input.status === 'resolved';
      const ok = await complianceRepository.resolveCommunityReport(
        id,
        input.status,
        adminId,
        hidePost
      );
      if (!ok) throw new AppError(404, 'NOT_FOUND', 'Report not found');
      await complianceRepository.writeAuditLog({
        actorId: adminId,
        action: 'community.report.resolve',
        targetType: 'report',
        targetId: id,
        meta: { status: input.status, hidePost },
      });
      return {
        id,
        reporterId: '',
        reason: 'other',
        status: input.status,
        resolvedBy: adminId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const report = mockReports.find((r) => r.id === id);
    if (!report) throw new AppError(404, 'NOT_FOUND', 'Report not found');
    report.status = input.status;
    report.resolvedBy = adminId;
    report.updatedAt = new Date().toISOString();
    return report;
  },
};
