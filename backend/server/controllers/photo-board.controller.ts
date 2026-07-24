import type { Request, Response } from 'express';
import {
  blockPhotoUserSchema,
  createPhotoCommentSchema,
  createPhotoPostSchema,
  createPhotoReportSchema,
  photoBoardListQuerySchema,
  resolvePhotoReportSchema,
  updatePhotoPostSchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { photoBoardService } from '../services/photo-board.service.js';
import { getParam } from '../utils/params.util.js';

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall through to comma-separated
    }
    return trimmed
      .split(/[,\s#]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export async function listPosts(req: Request, res: Response): Promise<void> {
  const query = photoBoardListQuerySchema.parse(req.query);
  if ((query.mine || query.likedByMe) && !req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const result = await photoBoardService.list(query, req.user?.userId);
  res.json({ success: true, data: result });
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const result = await photoBoardService.getById(getParam(req.params.postId), req.user?.userId);
  res.json({ success: true, data: result });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createPhotoPostSchema.parse({
    title: req.body.title,
    content: req.body.content ?? '',
    tags: parseTags(req.body.tags),
  });
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const post = await photoBoardService.createPost(req.user.userId, input, files);
  res.status(201).json({ success: true, data: post });
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = updatePhotoPostSchema.parse(req.body);
  const post = await photoBoardService.updatePost(
    getParam(req.params.postId),
    req.user.userId,
    req.user.roleCode,
    input
  );
  res.json({ success: true, data: post });
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await photoBoardService.deletePost(
    getParam(req.params.postId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function getImage(req: Request, res: Response): Promise<void> {
  const variant = req.query.variant === 'main' ? 'main' : 'thumb';
  const image = await photoBoardService.getImageBinary(getParam(req.params.imageId), variant);
  res.setHeader('Content-Type', image.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  res.send(image.data);
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await photoBoardService.toggleLike(getParam(req.params.postId), req.user.userId);
  res.json({ success: true, data: result });
}

export async function createComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createPhotoCommentSchema.parse(req.body);
  const comment = await photoBoardService.createComment(
    getParam(req.params.postId),
    req.user.userId,
    input
  );
  res.status(201).json({ success: true, data: comment });
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await photoBoardService.deleteComment(
    getParam(req.params.commentId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function createReport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createPhotoReportSchema.parse(req.body);
  const report = await photoBoardService.createReport(req.user.userId, input);
  res.status(201).json({ success: true, data: report });
}

export async function listReports(_req: Request, res: Response): Promise<void> {
  const reports = await photoBoardService.listReports();
  res.json({ success: true, data: reports });
}

export async function resolveReport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = resolvePhotoReportSchema.parse(req.body);
  const report = await photoBoardService.resolveReport(
    getParam(req.params.reportId),
    req.user.userId,
    input
  );
  res.json({ success: true, data: report });
}

export async function hidePost(req: Request, res: Response): Promise<void> {
  await photoBoardService.hidePost(getParam(req.params.postId));
  res.json({ success: true, data: { message: 'Hidden' } });
}

export async function blockUser(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = blockPhotoUserSchema.parse(req.body);
  const block = await photoBoardService.blockUser(req.user.userId, input);
  res.status(201).json({ success: true, data: block });
}

export async function listBlocks(_req: Request, res: Response): Promise<void> {
  const blocks = await photoBoardService.listBlocks();
  res.json({ success: true, data: blocks });
}
