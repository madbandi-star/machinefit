import type { Request, Response } from 'express';
import {
  createGymMemberSchema,
  updateGymMemberSchema,
  respondMemberProfileRequestSchema,
} from '@machinefit/shared';
import { gymMemberService } from '../services/gym-member.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function listMembers(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = getParam(req.params.gymId);
  const members = await gymMemberService.list(req.user.userId, gymId);
  res.json({ success: true, data: members });
}

export async function createMember(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = getParam(req.params.gymId);
  const input = createGymMemberSchema.parse(req.body);
  const member = await gymMemberService.create(req.user.userId, gymId, input);
  res.status(201).json({ success: true, data: member });
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = getParam(req.params.gymId);
  const memberId = getParam(req.params.memberId);
  const input = updateGymMemberSchema.parse(req.body);
  const member = await gymMemberService.update(req.user.userId, gymId, memberId, input);
  res.json({ success: true, data: member });
}

export async function deleteMember(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = getParam(req.params.gymId);
  const memberId = getParam(req.params.memberId);
  await gymMemberService.remove(req.user.userId, gymId, memberId);
  res.json({ success: true, data: { message: 'Member deleted' } });
}

export async function listPendingProfileRequests(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const requests = await gymMemberService.listPendingProfileRequests(req.user.userId);
  res.json({ success: true, data: requests });
}

export async function respondToProfileRequest(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const requestId = getParam(req.params.id);
  const input = respondMemberProfileRequestSchema.parse(req.body);
  const result = await gymMemberService.respondToProfileRequest(req.user.userId, requestId, input);
  res.json({ success: true, data: result });
}
