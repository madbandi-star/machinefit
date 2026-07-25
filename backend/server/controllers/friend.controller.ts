import type { Request, Response } from 'express';
import {
  createFriendReportSchema,
  createFriendRequestSchema,
  listFriendFeedSchema,
  listFriendRankingsSchema,
  listFriendsSchema,
  resolveFriendReportSchema,
  searchUsersForFriendSchema,
  updateFriendPrivacySchema,
} from '@machinefit/shared';
import { z } from 'zod';
import { AppError } from '../middlewares/error.middleware.js';
import { friendService } from '../services/friend.service.js';
import { getParam } from '../utils/params.util.js';

function requireUser(req: Request): string {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user.userId;
}

export async function getPrivacy(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const data = await friendService.getPrivacy(userId);
  res.json({ success: true, data });
}

export async function updatePrivacy(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const input = updateFriendPrivacySchema.parse(req.body);
  const data = await friendService.updatePrivacy(userId, input);
  res.json({ success: true, data });
}

export async function listFriends(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const q = listFriendsSchema.parse(req.query);
  const data = await friendService.listFriends(userId, q);
  res.json({ success: true, data });
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const q = searchUsersForFriendSchema.parse(req.query);
  const data = await friendService.searchUsers(userId, q.q, q.page, q.limit);
  res.json({ success: true, data });
}

export async function createRequest(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const input = createFriendRequestSchema.parse(req.body);
  const data = await friendService.sendRequest(userId, input);
  res.status(201).json({ success: true, data });
}

export async function listIncoming(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const data = await friendService.listIncoming(userId, page, limit);
  res.json({ success: true, data });
}

export async function listOutgoing(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const data = await friendService.listOutgoing(userId, page, limit);
  res.json({ success: true, data });
}

export async function acceptRequest(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const requestId = getParam(req.params.requestId);
  const data = await friendService.acceptRequest(userId, requestId);
  res.json({ success: true, data });
}

export async function rejectRequest(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const requestId = getParam(req.params.requestId);
  const data = await friendService.rejectRequest(userId, requestId);
  res.json({ success: true, data });
}

export async function cancelRequest(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const requestId = getParam(req.params.requestId);
  const data = await friendService.cancelRequest(userId, requestId);
  res.json({ success: true, data });
}

export async function removeFriend(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const body = z.object({ friendUserId: z.string().uuid() }).parse(req.body);
  const data = await friendService.removeFriend(userId, body.friendUserId);
  res.json({ success: true, data });
}

export async function setPin(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const body = z
    .object({ friendUserId: z.string().uuid(), pinned: z.boolean() })
    .parse(req.body);
  const data = await friendService.setPin(userId, body.friendUserId, body.pinned);
  res.json({ success: true, data });
}

export async function blockUser(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const body = z
    .object({
      targetUserId: z.string().uuid(),
      reason: z.string().trim().max(500).optional().default(''),
    })
    .parse(req.body);
  const data = await friendService.block(userId, body.targetUserId, body.reason);
  res.status(201).json({ success: true, data });
}

export async function unblockUser(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const body = z.object({ targetUserId: z.string().uuid() }).parse(req.body);
  const data = await friendService.unblock(userId, body.targetUserId);
  res.json({ success: true, data });
}

export async function listBlocked(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const data = await friendService.listBlocked(userId, page, limit);
  res.json({ success: true, data });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const targetUserId = getParam(req.params.userId);
  const data = await friendService.getProfile(userId, targetUserId);
  res.json({ success: true, data });
}

export async function getFeed(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const q = listFriendFeedSchema.parse(req.query);
  const data = await friendService.getFeed(userId, q.page, q.limit);
  res.json({ success: true, data });
}

export async function getRankings(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const q = listFriendRankingsSchema.parse(req.query);
  const data = await friendService.getRankings(userId, q.metric, q.page, q.limit);
  res.json({ success: true, data });
}

export async function getInvite(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const data = await friendService.getInvite(userId);
  res.json({ success: true, data });
}

export async function applyInvite(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const body = z.object({ code: z.string().trim().min(3).max(32) }).parse(req.body);
  const data = await friendService.applyInvite(userId, body.code);
  res.json({ success: true, data });
}

export async function reportUser(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req);
  const input = createFriendReportSchema.parse(req.body);
  const data = await friendService.report(
    userId,
    input.reportedUserId,
    input.reason,
    input.description
  );
  res.status(201).json({ success: true, data });
}

// ── Admin ──────────────────────────────────────────────
export async function adminStats(_req: Request, res: Response): Promise<void> {
  const data = await friendService.adminStats();
  res.json({ success: true, data });
}

export async function adminList(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const data = await friendService.adminListFriendships(page, limit);
  res.json({ success: true, data });
}

export async function adminDelete(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const data = await friendService.adminDeleteFriendship(id);
  res.json({ success: true, data });
}

export async function adminReports(_req: Request, res: Response): Promise<void> {
  const data = await friendService.adminListReports();
  res.json({ success: true, data });
}

export async function adminResolveReport(req: Request, res: Response): Promise<void> {
  const adminId = requireUser(req);
  const id = getParam(req.params.id);
  const body = resolveFriendReportSchema.parse(req.body);
  const data = await friendService.adminResolveReport(id, body.status, adminId);
  res.json({ success: true, data });
}

export async function adminSpam(_req: Request, res: Response): Promise<void> {
  const data = await friendService.adminListSpam();
  res.json({ success: true, data });
}

export async function adminBlock(req: Request, res: Response): Promise<void> {
  const adminId = requireUser(req);
  const body = z
    .object({
      targetUserId: z.string().uuid(),
      reason: z.string().trim().max(500).optional(),
    })
    .parse(req.body);
  const data = await friendService.adminBlockUser(adminId, body.targetUserId, body.reason);
  res.json({ success: true, data });
}
