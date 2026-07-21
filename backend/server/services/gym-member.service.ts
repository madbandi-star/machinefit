import type {
  CreateGymMemberInput,
  UpdateGymMemberInput,
  RespondMemberProfileRequestInput,
} from '@machinefit/shared';
import { gymMemberRepository } from '../repositories/gym-member.repository.js';
import { subscriptionService } from './subscription.service.js';
import { gymScopeService } from './gym-scope.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getPool } from '../config/database.js';

export const gymMemberService = {
  async list(userId: string, gymId: string) {
    await gymScopeService.assertOwned(userId, gymId);
    return gymMemberRepository.listByGym(userId, gymId);
  },

  async create(userId: string, gymId: string, input: CreateGymMemberInput) {
    await gymScopeService.assertOwned(userId, gymId);
    await subscriptionService.assertCanAddMember(userId, gymId);

    const email = input.email?.trim() || undefined;

    // Check if email matches an existing user
    let linkedUserId: string | undefined;
    let profileAccess: string = 'none';
    let profileRequest: { memberId: string; gymId: string; ownerUserId: string; targetUserId: string } | null = null;

    if (email) {
      const pool = getPool();
      if (pool) {
        const userResult = await pool.query<{ id: string }>(
          `SELECT id FROM users WHERE email = $1`,
          [email]
        );
        const targetUser = userResult.rows[0];
        if (targetUser) {
          linkedUserId = targetUser.id;
          profileAccess = 'pending';
          profileRequest = {
            memberId: '', // filled after create
            gymId,
            ownerUserId: userId,
            targetUserId: targetUser.id,
          };
        }
      }
    }

    const member = await gymMemberRepository.create({
      gymId,
      ownerUserId: userId,
      name: input.name,
      gender: input.gender,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      birthDate: input.birthDate || undefined,
      memo: input.memo || undefined,
      email: email,
      linkedUserId,
      profileAccess,
      isSelf: false,
    });

    if (profileRequest) {
      await gymMemberRepository.createProfileRequest({
        memberId: member.id,
        gymId,
        ownerUserId: userId,
        targetUserId: profileRequest.targetUserId,
      });
    }

    return member;
  },

  async update(userId: string, gymId: string, memberId: string, input: UpdateGymMemberInput) {
    await gymScopeService.resolveMemberForWrite(userId, gymId, memberId);

    const updated = await gymMemberRepository.update(memberId, {
      name: input.name,
      gender: input.gender,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      birthDate: input.birthDate !== undefined ? (input.birthDate || null) : undefined,
      memo: input.memo !== undefined ? (input.memo || null) : undefined,
      email: input.email !== undefined ? (input.email || null) : undefined,
    });

    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Member not found');
    return updated;
  },

  async remove(userId: string, gymId: string, memberId: string) {
    await gymScopeService.resolveMemberForWrite(userId, gymId, memberId);

    const member = await gymMemberRepository.findById(memberId);
    if (!member) throw new AppError(404, 'NOT_FOUND', 'Member not found');
    if (member.isSelf) {
      throw new AppError(400, 'CANNOT_DELETE_SELF_MEMBER', 'Cannot delete the self member record');
    }

    await gymMemberRepository.remove(memberId);
  },

  async listPendingProfileRequests(userId: string) {
    return gymMemberRepository.listPendingProfileRequestsForUser(userId);
  },

  async respondToProfileRequest(
    userId: string,
    requestId: string,
    input: RespondMemberProfileRequestInput
  ) {
    const request = await gymMemberRepository.findProfileRequestById(requestId);
    if (!request) throw new AppError(404, 'NOT_FOUND', 'Profile request not found');
    if (request.targetUserId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to respond to this request');
    }
    if (request.status !== 'pending') {
      throw new AppError(400, 'ALREADY_RESPONDED', 'This request has already been responded to');
    }

    const updated = await gymMemberRepository.respondToProfileRequest(requestId, input.status);
    if (!updated) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to update request');

    // On approve: copy profile data from target user onto member
    if (input.status === 'approved') {
      const pool = getPool();
      if (pool) {
        const userResult = await pool.query<{
          display_name: string;
          gender: string | null;
          height_cm: string | null;
          weight_kg: string | null;
        }>(`SELECT display_name, gender, height_cm, weight_kg FROM users WHERE id = $1`, [userId]);
        const user = userResult.rows[0];
        if (user) {
          await gymMemberRepository.update(request.memberId, {
            name: user.display_name || undefined,
            gender: user.gender ?? null,
            heightCm: user.height_cm ? parseFloat(user.height_cm) : null,
            weightKg: user.weight_kg ? parseFloat(user.weight_kg) : null,
            profileAccess: 'approved',
          });
        }
      }
    } else {
      await gymMemberRepository.update(request.memberId, {
        profileAccess: 'denied',
      });
    }

    return updated;
  },

  async ensureSelfMember(gymId: string, ownerUserId: string) {
    const pool = getPool();
    if (!pool) return null;
    return gymMemberRepository.ensureSelfMember(gymId, ownerUserId);
  },
};
