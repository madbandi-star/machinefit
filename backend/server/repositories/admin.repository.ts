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
    const pendingRequests = mockMachineRequests.filter((r) => r.status === 'pending').length;
    const pendingReports = mockReports.filter((r) => r.status === 'pending').length;
    const hiddenPosts = mockPosts.filter((p) => p.isHidden).length;

    let userCount = devUserCount + 3;
    if (pool) {
      const count = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM users'
      );
      userCount = parseInt(count.rows[0]?.count ?? '0', 10);
    }

    return {
      userCount,
      gymCount: MOCK_GYMS.length,
      machineCount: MOCK_MACHINES.length,
      brandCount: MOCK_BRANDS.length,
      postCount: mockPosts.length,
      pendingRequests,
      pendingReports,
      hiddenPosts,
      verifiedGyms: MOCK_GYMS.filter((g) => g.isVerified).length,
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
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return user;
  },

  listGyms(): Gym[] {
    return MOCK_GYMS.map(({ photos: _p, machines: _m, ...gym }) => ({
      ...gym,
      machineCount: MOCK_GYMS.find((g) => g.id === gym.id)?.machines.length ?? 0,
    }));
  },

  verifyGym(gymId: string, input: VerifyGymInput): Gym {
    const gym = MOCK_GYMS.find((g) => g.id === gymId || g.slug === gymId);
    if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    gym.isVerified = input.isVerified;
    const { photos: _p, machines: _m, ...rest } = gym;
    return rest;
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

  listMachineRequests(): MachineRequest[] {
    return [...mockMachineRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
