import type { Request, Response } from 'express';
import type { BoardType } from '@machinefit/shared';
import {
  createPostSchema,
  createCommentSchema,
  createMachineRequestSchema,
  updateCommentSchema,
  updateMachineRequestSchema,
  machineRequestListQuerySchema,
  contentReportSchema,
} from '@machinefit/shared';
import { communityService } from '../services/community.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';
import {
  sendImmutableMedia,
  trySendNotModified,
  UGC_MEDIA_CACHE,
} from '../utils/media-response.js';

export async function listPosts(req: Request, res: Response): Promise<void> {
  const boardType = req.query.boardType as BoardType | undefined;
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = parseInt(String(req.query.limit ?? '20'), 10);
  const result = await communityService.listPosts(boardType, page, limit);
  res.json({ success: true, data: result });
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const result = await communityService.getPost(getParam(req.params.postId));
  res.json({ success: true, data: result });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createPostSchema.parse(req.body);
  const post = await communityService.createPost(req.user.userId, input);
  res.status(201).json({ success: true, data: post });
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await communityService.deletePost(
    getParam(req.params.postId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function createComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createCommentSchema.parse(req.body);
  const comment = await communityService.createComment(
    getParam(req.params.postId),
    req.user.userId,
    input
  );
  res.status(201).json({ success: true, data: comment });
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = updateCommentSchema.parse(req.body);
  const comment = await communityService.updateComment(
    getParam(req.params.commentId),
    req.user.userId,
    input
  );
  res.json({ success: true, data: comment });
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await communityService.deleteComment(
    getParam(req.params.commentId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await communityService.toggleLike(
    getParam(req.params.postId),
    req.user.userId
  );
  res.json({ success: true, data: result });
}

export async function listMachineRequests(req: Request, res: Response): Promise<void> {
  const query = machineRequestListQuerySchema.parse(req.query);
  if ((query.mine || query.likedByMe) && !req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const result = await communityService.listMachineRequests(query, req.user?.userId);
  res.json({ success: true, data: result });
}

export async function getMachineRequest(req: Request, res: Response): Promise<void> {
  const result = await communityService.getMachineRequest(
    getParam(req.params.requestId),
    req.user?.userId
  );
  res.json({ success: true, data: result });
}

export async function createMachineRequest(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createMachineRequestSchema.parse({
    brandName: req.body.brandName,
    machineName: req.body.machineName,
    description: req.body.description,
    commercialUseConsent: req.body.commercialUseConsent,
    gymChoiceMode: req.body.gymChoiceMode,
    gymName: req.body.gymName,
  });
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const item = await communityService.createMachineRequest(req.user.userId, input, files);
  res.status(201).json({ success: true, data: item });
}

export async function toggleMachineRequestLike(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await communityService.toggleMachineRequestLike(
    getParam(req.params.requestId),
    req.user.userId
  );
  res.json({ success: true, data: result });
}

export async function createMachineRequestComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createCommentSchema.parse(req.body);
  const comment = await communityService.createMachineRequestComment(
    getParam(req.params.requestId),
    req.user.userId,
    input
  );
  res.status(201).json({ success: true, data: comment });
}

export async function deleteMachineRequestComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await communityService.deleteMachineRequestComment(
    getParam(req.params.commentId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function toggleMachineRequestVote(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await communityService.toggleMachineRequestVote(
    getParam(req.params.requestId),
    req.user.userId
  );
  res.json({ success: true, data: result });
}

export async function updateMachineRequest(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = updateMachineRequestSchema.parse(req.body);
  const item = await communityService.updateMachineRequest(
    getParam(req.params.requestId),
    req.user.userId,
    req.user.roleCode,
    input
  );
  res.json({ success: true, data: item });
}

export async function deleteMachineRequest(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await communityService.deleteMachineRequest(
    getParam(req.params.requestId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function listSimilarMachineRequestGroups(req: Request, res: Response): Promise<void> {
  const brandName = String(req.query.brandName ?? '');
  const machineName = String(req.query.machineName ?? '');
  if (!brandName.trim() && !machineName.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'brandName or machineName required');
  }
  const items = await communityService.listSimilarMachineRequestGroups(brandName, machineName);
  res.json({ success: true, data: items });
}

export async function getMachineRequestImage(req: Request, res: Response): Promise<void> {
  const variant = req.query.variant === 'full' ? 'full' : 'thumb';
  const imageId = getParam(req.params.imageId);
  const meta = await communityService.getMachineRequestImageMeta(imageId, variant);
  if (!meta) throw new AppError(404, 'NOT_FOUND', 'Image not found');
  const etag = `"mri-${meta.etagToken}"`;
  if (trySendNotModified(req, res, etag, UGC_MEDIA_CACHE)) return;
  const image = await communityService.getMachineRequestImageBinary(imageId, variant);
  sendImmutableMedia(req, res, {
    etag,
    mimeType: image.mimeType,
    data: image.data,
    cacheControl: UGC_MEDIA_CACHE,
  });
}

export async function reportPost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = contentReportSchema.parse(req.body);
  const data = await communityService.reportPost(
    req.user.userId,
    getParam(req.params.postId),
    input
  );
  res.status(201).json({ success: true, data });
}

export async function reportComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = contentReportSchema.parse(req.body);
  const data = await communityService.reportComment(
    req.user.userId,
    getParam(req.params.commentId),
    input
  );
  res.status(201).json({ success: true, data });
}
