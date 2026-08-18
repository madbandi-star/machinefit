import type { Request, Response } from 'express';
import {
  adminMachineRarityListQuerySchema,
  adminMachineRarityPatchSchema,
  adminMachineShowcasePostPatchSchema,
  claimGymMachineSchema,
  createMachineShowcaseCommentSchema,
  createMachineShowcasePostSchema,
  createMachineShowcaseReportSchema,
  machineShowcaseListQuerySchema,
  resolveMachineShowcaseReportSchema,
  updateMachineShowcaseCommentSchema,
  updateMachineShowcasePostSchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { machineShowcaseService } from '../services/machine-showcase.service.js';
import { getParam } from '../utils/params.util.js';
import {
  sendImmutableMedia,
  trySendNotModified,
  UGC_MEDIA_CACHE,
} from '../utils/media-response.js';

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall through
    }
    return trimmed
      .split(/[,\s#]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function localeOf(req: Request): string {
  return req.headers['accept-language']?.toString().slice(0, 2) || 'ko';
}

export async function listPosts(req: Request, res: Response): Promise<void> {
  const query = machineShowcaseListQuerySchema.parse(req.query);
  if ((query.mine || query.bookmarkedByMe || query.tab === 'myGym') && !req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const result = await machineShowcaseService.list(query, req.user?.userId, localeOf(req));
  res.json({ success: true, data: result });
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const result = await machineShowcaseService.getById(
    getParam(req.params.postId),
    req.user?.userId,
    localeOf(req)
  );
  res.json({ success: true, data: result });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createMachineShowcasePostSchema.parse({
    machineCode: req.body.machineCode,
    caption: req.body.caption ?? '',
    tags: parseTags(req.body.tags),
    userGymId: req.body.userGymId || undefined,
    gymId: req.body.gymId || undefined,
  });
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const result = await machineShowcaseService.createPost(
    req.user.userId,
    req.user.roleCode,
    input,
    files,
    localeOf(req)
  );
  res.status(201).json({ success: true, data: result });
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = updateMachineShowcasePostSchema.parse(req.body);
  const data = await machineShowcaseService.updatePost(
    getParam(req.params.postId),
    req.user.userId,
    req.user.roleCode,
    input
  );
  res.json({ success: true, data });
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await machineShowcaseService.deletePost(
    getParam(req.params.postId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function getImage(req: Request, res: Response): Promise<void> {
  const variant = req.query.variant === 'main' ? 'main' : 'thumb';
  const imageId = getParam(req.params.imageId);
  const { assertMediaAccess } = await import('../utils/media-token.util.js');
  assertMediaAccess('showcase', imageId, req.query.mexp, req.query.msig);
  const meta = await machineShowcaseService.getImageMeta(imageId, variant);
  if (!meta) throw new AppError(404, 'NOT_FOUND', 'Image not found');
  const etag = `"msi-${meta.etagToken}"`;
  if (trySendNotModified(req, res, etag, UGC_MEDIA_CACHE)) return;
  const image = await machineShowcaseService.getImageBinary(imageId, variant);
  sendImmutableMedia(req, res, {
    etag,
    mimeType: image.mimeType,
    data: image.data,
    cacheControl: UGC_MEDIA_CACHE,
  });
}

export async function likePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await machineShowcaseService.setLike(getParam(req.params.postId), req.user.userId, true);
  res.json({ success: true, data });
}

export async function unlikePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await machineShowcaseService.setLike(
    getParam(req.params.postId),
    req.user.userId,
    false
  );
  res.json({ success: true, data });
}

export async function bookmarkPost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await machineShowcaseService.setBookmark(
    getParam(req.params.postId),
    req.user.userId,
    true
  );
  res.json({ success: true, data });
}

export async function unbookmarkPost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await machineShowcaseService.setBookmark(
    getParam(req.params.postId),
    req.user.userId,
    false
  );
  res.json({ success: true, data });
}

export async function createComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createMachineShowcaseCommentSchema.parse(req.body);
  const data = await machineShowcaseService.createComment(
    getParam(req.params.postId),
    req.user.userId,
    input
  );
  res.status(201).json({ success: true, data });
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = updateMachineShowcaseCommentSchema.parse(req.body);
  const data = await machineShowcaseService.updateComment(
    getParam(req.params.commentId),
    req.user.userId,
    input
  );
  res.json({ success: true, data });
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await machineShowcaseService.deleteComment(
    getParam(req.params.commentId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function createReport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createMachineShowcaseReportSchema.parse(req.body);
  const data = await machineShowcaseService.createReport(req.user.userId, input);
  res.status(201).json({ success: true, data });
}

export async function claimGymMachine(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = claimGymMachineSchema.parse({
    userGymId: getParam(req.params.userGymId),
    machineCode: getParam(req.params.machineCode),
    sourcePostId: req.body?.sourcePostId,
  });
  const data = await machineShowcaseService.claimGymMachine(req.user.userId, input);
  res.status(201).json({ success: true, data });
}

export async function getMachineGyms(req: Request, res: Response): Promise<void> {
  const data = await machineShowcaseService.getMachineGyms(getParam(req.params.machineCode));
  res.json({ success: true, data });
}

export async function getRarity(req: Request, res: Response): Promise<void> {
  const data = await machineShowcaseService.getRarity(getParam(req.params.machineCode));
  res.json({ success: true, data });
}

export async function getMyDex(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await machineShowcaseService.getDex(req.user.userId, localeOf(req));
  res.json({ success: true, data });
}

export async function getMyGymHoldings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const userGymId = String(req.query.userGymId ?? '');
  if (!userGymId) throw new AppError(400, 'VALIDATION', 'userGymId required');
  const data = await machineShowcaseService.getMyGymHoldings(
    req.user.userId,
    userGymId,
    localeOf(req)
  );
  res.json({ success: true, data });
}

export async function adminListReports(_req: Request, res: Response): Promise<void> {
  const data = await machineShowcaseService.listReports();
  res.json({ success: true, data });
}

export async function adminResolveReport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = resolveMachineShowcaseReportSchema.parse(req.body);
  const data = await machineShowcaseService.resolveReport(
    getParam(req.params.reportId),
    req.user.userId,
    input.status
  );
  res.json({ success: true, data });
}

export async function adminHidePost(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await machineShowcaseService.hidePost(getParam(req.params.postId), req.user.userId);
  res.json({ success: true, data: { message: 'Hidden' } });
}

export async function adminPatchPost(req: Request, res: Response): Promise<void> {
  const input = adminMachineShowcasePostPatchSchema.parse(req.body);
  await machineShowcaseService.adminPatchPost(getParam(req.params.postId), input);
  res.json({ success: true, data: { message: 'Updated' } });
}

export async function adminListRarity(req: Request, res: Response): Promise<void> {
  const query = adminMachineRarityListQuerySchema.parse(req.query);
  const data = await machineShowcaseService.listAdminRarity(query);
  res.json({ success: true, data });
}

export async function adminPatchRarity(req: Request, res: Response): Promise<void> {
  const input = adminMachineRarityPatchSchema.parse(req.body);
  const data = await machineShowcaseService.patchRarity(getParam(req.params.machineCode), input);
  res.json({ success: true, data });
}
