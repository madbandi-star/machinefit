import type { Request, Response } from 'express';
import type { BoardType } from '@machinefit/shared';
import {
  createPostSchema,
  createCommentSchema,
  createMachineRequestSchema,
  contentReportSchema,
} from '@machinefit/shared';
import { communityService } from '../services/community.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

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

export async function toggleLike(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await communityService.toggleLike(
    getParam(req.params.postId),
    req.user.userId
  );
  res.json({ success: true, data: result });
}

export async function listMachineRequests(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = parseInt(String(req.query.limit ?? '20'), 10);
  const result = await communityService.listMachineRequests(page, limit);
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

export async function getMachineRequestImage(req: Request, res: Response): Promise<void> {
  const variant = req.query.variant === 'full' ? 'full' : 'thumb';
  const image = await communityService.getMachineRequestImageBinary(
    getParam(req.params.imageId),
    variant
  );
  res.setHeader('Content-Type', image.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  res.send(image.data);
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
