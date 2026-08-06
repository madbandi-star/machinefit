/**
 * Friend service — Member+ social graph. Additive module; does not alter
 * workout / recommend / trade business logic.
 */

import {
  SITE_APP_URL,
  type CreateFriendRequestInput,
  type FriendRankingMetric,
  type FriendSort,
  type UpdateFriendPrivacyInput,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { friendRepository } from '../repositories/friend.repository.js';
import { notificationService } from './notification.service.js';

const APP_BASE = process.env.FRONTEND_BASE_URL?.replace(/\/$/, '') || SITE_APP_URL

export const friendService = {
  getPrivacy(userId: string) {
    return friendRepository.ensurePrivacy(userId);
  },

  updatePrivacy(userId: string, input: UpdateFriendPrivacyInput) {
    return friendRepository.updatePrivacy(userId, input);
  },

  listFriends(
    userId: string,
    options: { q?: string; sort?: FriendSort; page?: number; limit?: number }
  ) {
    return friendRepository.listFriends(userId, {
      q: options.q,
      sort: options.sort ?? 'name',
      page: options.page ?? 1,
      limit: options.limit ?? 20,
    });
  },

  searchUsers(userId: string, q: string, page = 1, limit = 20) {
    if (!q.trim()) throw new AppError(400, 'VALIDATION_ERROR', '검색어를 입력해 주세요');
    return friendRepository.searchUsers(userId, q, page, limit);
  },

  async sendRequest(fromUserId: string, input: CreateFriendRequestInput) {
    const toUserId = input.toUserId;
    if (fromUserId === toUserId) {
      throw new AppError(400, 'VALIDATION_ERROR', '자기 자신에게 친구 요청을 보낼 수 없습니다');
    }
    const target = await friendRepository.getUserBrief(toUserId);
    if (!target) throw new AppError(404, 'NOT_FOUND', '사용자를 찾을 수 없습니다');

    if (await friendRepository.isBlockedEither(fromUserId, toUserId)) {
      throw new AppError(403, 'FORBIDDEN', '차단된 사용자에게 요청할 수 없습니다');
    }
    if (await friendRepository.areFriends(fromUserId, toUserId)) {
      throw new AppError(409, 'CONFLICT', '이미 친구입니다');
    }

    const existing = await friendRepository.findPendingBetween(fromUserId, toUserId);
    if (existing) {
      if (String(existing.from_user_id) === toUserId) {
        await friendRepository.setRequestStatus(String(existing.id), 'ACCEPTED');
        await friendRepository.createFriendship(fromUserId, toUserId);
        const accepter = await friendRepository.getUserBrief(fromUserId);
        void notificationService.notify(
          toUserId,
          'friend_accepted',
          { ko: '친구 요청 수락', en: 'Friend request accepted' },
          {
            ko: `${accepter?.displayName || '회원'}님이 친구 요청을 수락했습니다`,
            en: `${accepter?.displayName || 'A member'} accepted your friend request`,
          },
          { userId: fromUserId, requestId: String(existing.id) }
        );
        return { autoAccepted: true as const, requestId: String(existing.id) };
      }
      throw new AppError(409, 'CONFLICT', '이미 보낸 친구 요청이 있습니다');
    }

    const req = await friendRepository.createRequest(
      fromUserId,
      toUserId,
      input.message ?? ''
    );
    const from = await friendRepository.getUserBrief(fromUserId);
    void notificationService.notify(
      toUserId,
      'friend_request',
      { ko: '친구 요청', en: 'Friend request' },
      {
        ko: `${from?.displayName || '회원'}님이 친구 요청을 보냈습니다`,
        en: `${from?.displayName || 'A member'} sent you a friend request`,
      },
      { requestId: req.id, fromUserId }
    );
    return { autoAccepted: false as const, request: req };
  },

  listIncoming(userId: string, page = 1, limit = 20) {
    return friendRepository.listRequests(userId, 'incoming', page, limit);
  },

  listOutgoing(userId: string, page = 1, limit = 20) {
    return friendRepository.listRequests(userId, 'outgoing', page, limit);
  },

  async acceptRequest(userId: string, requestId: string) {
    const req = await friendRepository.getRequestById(requestId);
    if (!req || req.status !== 'REQUESTED' || req.toUser.id !== userId) {
      throw new AppError(404, 'NOT_FOUND', '수락할 요청을 찾을 수 없습니다');
    }
    await friendRepository.setRequestStatus(requestId, 'ACCEPTED');
    await friendRepository.createFriendship(req.fromUser.id, userId);
    const accepter = await friendRepository.getUserBrief(userId);
    void notificationService.notify(
      req.fromUser.id,
      'friend_accepted',
      { ko: '친구 요청 수락', en: 'Friend request accepted' },
      {
        ko: `${accepter?.displayName || '회원'}님이 친구 요청을 수락했습니다`,
        en: `${accepter?.displayName || 'A member'} accepted your friend request`,
      },
      { userId, requestId }
    );
    return friendRepository.getRequestById(requestId);
  },

  async rejectRequest(userId: string, requestId: string) {
    const req = await friendRepository.getRequestById(requestId);
    if (!req || req.status !== 'REQUESTED' || req.toUser.id !== userId) {
      throw new AppError(404, 'NOT_FOUND', '거절할 요청을 찾을 수 없습니다');
    }
    await friendRepository.setRequestStatus(requestId, 'REJECTED');
    return friendRepository.getRequestById(requestId);
  },

  async cancelRequest(userId: string, requestId: string) {
    const req = await friendRepository.getRequestById(requestId);
    if (!req || req.status !== 'REQUESTED' || req.fromUser.id !== userId) {
      throw new AppError(404, 'NOT_FOUND', '취소할 요청을 찾을 수 없습니다');
    }
    await friendRepository.setRequestStatus(requestId, 'CANCELLED');
    return { success: true as const };
  },

  async removeFriend(userId: string, friendUserId: string) {
    if (userId === friendUserId) {
      throw new AppError(400, 'VALIDATION_ERROR', '잘못된 요청입니다');
    }
    const ok = await friendRepository.deleteFriendship(userId, friendUserId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', '친구 관계가 없습니다');
    const me = await friendRepository.getUserBrief(userId);
    void notificationService.notify(
      friendUserId,
      'friend_removed',
      { ko: '친구 삭제', en: 'Friend removed' },
      {
        ko: `${me?.displayName || '회원'}님과의 친구 관계가 해제되었습니다`,
        en: `Friendship with ${me?.displayName || 'a member'} was removed`,
      },
      { userId }
    );
    return { success: true as const };
  },

  async setPin(userId: string, friendUserId: string, pinned: boolean) {
    if (!(await friendRepository.areFriends(userId, friendUserId))) {
      throw new AppError(404, 'NOT_FOUND', '친구 관계가 없습니다');
    }
    await friendRepository.setPinned(userId, friendUserId, pinned);
    return { success: true as const, pinned };
  },

  async block(userId: string, targetUserId: string, reason = '') {
    if (userId === targetUserId) {
      throw new AppError(400, 'VALIDATION_ERROR', '자기 자신을 차단할 수 없습니다');
    }
    await friendRepository.blockUser(userId, targetUserId, reason);
    return { success: true as const };
  },

  async unblock(userId: string, targetUserId: string) {
    const ok = await friendRepository.unblockUser(userId, targetUserId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', '차단 기록이 없습니다');
    return { success: true as const };
  },

  listBlocked(userId: string, page = 1, limit = 20) {
    return friendRepository.listBlocked(userId, page, limit);
  },

  async getProfile(viewerId: string, targetUserId: string) {
    if (await friendRepository.isBlockedEither(viewerId, targetUserId)) {
      throw new AppError(403, 'FORBIDDEN', '프로필을 볼 수 없습니다');
    }
    const profile = await friendRepository.getProfile(viewerId, targetUserId);
    if (!profile) throw new AppError(404, 'NOT_FOUND', '사용자를 찾을 수 없습니다');
    return profile;
  },

  async getFeed(userId: string, page = 1, limit = 20) {
    const logged = await friendRepository.listFeed(userId, page, limit);
    if (logged.items.length > 0 || page > 1) return logged;
    const synthetic = await friendRepository.listSyntheticWorkoutFeed(userId, limit);
    return { items: synthetic, total: synthetic.length };
  },

  getRankings(userId: string, metric: FriendRankingMetric, page = 1, limit = 20) {
    return friendRepository.rankings(userId, metric, page, limit);
  },

  getInvite(userId: string) {
    // Browser router + basename `/machinefit` → `/machinefit/register?ref=CODE`
    return friendRepository.getOrCreateInvite(userId, `${APP_BASE}/register`);
  },

  async applyInvite(userId: string, code: string) {
    const applied = await friendRepository.applyReferralCode(userId, code);
    if (!applied) {
      throw new AppError(400, 'VALIDATION_ERROR', '유효하지 않거나 이미 사용한 초대 코드입니다');
    }
    // Auto-friend the referrer so the invite funnel completes without a second request step.
    try {
      if (!(await friendRepository.areFriends(userId, applied.referrerId))) {
        if (!(await friendRepository.isBlockedEither(userId, applied.referrerId))) {
          await friendRepository.createFriendship(userId, applied.referrerId);
          const newbie = await friendRepository.getUserBrief(userId);
          void notificationService.notify(
            applied.referrerId,
            'friend_accepted',
            { ko: '초대 친구 연결', en: 'Invite friend connected' },
            {
              ko: `${newbie?.displayName || '회원'}님이 초대로 가입해 친구가 되었습니다`,
              en: `${newbie?.displayName || 'A member'} joined via your invite and is now a friend`,
            },
            { userId, code: applied.code }
          );
        }
      }
    } catch {
      /* friendship is best-effort after referral is logged */
    }
    // Premium reward: +30 days for referrer and referred (once per referred user).
    try {
      const { billingService } = await import('./billing.service.js');
      await billingService.grantReferralPremiumReward(applied.referrerId, userId);
    } catch {
      /* billing reward is best-effort */
    }
    return { success: true as const, referrerId: applied.referrerId };
  },

  async report(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    description?: string | null
  ) {
    if (reporterId === reportedUserId) {
      throw new AppError(400, 'VALIDATION_ERROR', '자기 자신을 신고할 수 없습니다');
    }
    return friendRepository.createReport({
      reporterId,
      reportedUserId,
      reason,
      description,
    });
  },

  publishActivity(input: {
    actorId: string;
    activityType: string;
    title: string;
    body?: string;
    payload?: Record<string, unknown>;
    visibility?: 'public' | 'friends' | 'private';
  }) {
    return friendRepository.addActivity(input);
  },

  adminStats() {
    return friendRepository.adminStats();
  },

  adminListFriendships(page = 1, limit = 20) {
    return friendRepository.adminListFriendships(page, limit);
  },

  async adminDeleteFriendship(id: string) {
    const ok = await friendRepository.adminDeleteFriendship(id);
    if (!ok) throw new AppError(404, 'NOT_FOUND', '친구 관계를 찾을 수 없습니다');
    return { success: true as const };
  },

  adminListReports() {
    return friendRepository.listReports();
  },

  async adminResolveReport(
    id: string,
    status: 'resolved' | 'dismissed',
    adminId: string
  ) {
    await friendRepository.resolveReport(id, status, adminId);
    return { success: true as const };
  },

  adminListSpam(limit = 50) {
    return friendRepository.adminListSpam(limit);
  },

  async adminBlockUser(adminUserId: string, targetUserId: string, reason?: string) {
    if (!targetUserId) throw new AppError(400, 'VALIDATION_ERROR', '대상 사용자가 필요합니다');
    await friendRepository.blockUser(adminUserId, targetUserId, reason || 'admin_block');
    try {
      const { getPool } = await import('../config/database.js');
      const pool = getPool();
      if (pool) {
        await pool.query(
          `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
          [targetUserId]
        );
      }
    } catch {
      /* optional */
    }
    return { success: true as const };
  },
};
