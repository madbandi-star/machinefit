import type { Request, Response } from 'express';
import type {
  PublishTemplateShareInput,
  TemplateShareAdminListQuery,
  TemplateShareCommentBody,
  TemplateShareListQuery,
  TemplateShareReportBody,
  TemplateShareReportStatus,
  TemplateShareStatus,
  UpdateTemplateShareInput,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { getValidatedQuery } from '../middlewares/validate.middleware.js';
import { templateShareService } from '../services/template-share.service.js';
import { getParam } from '../utils/params.util.js';

function requireUser(req: Request): { userId: string; roleCode: NonNullable<Request['user']>['roleCode'] } {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return { userId: req.user.userId, roleCode: req.user.roleCode };
}

function viewerKey(req: Request): string {
  if (req.user?.userId) return `u:${req.user.userId}`;
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : req.socket.remoteAddress;
  return `ip:${ip || 'anon'}`;
}

export async function listPosts(req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery<TemplateShareListQuery>(res);
  if (query.favoritedByMe && !req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const data = await templateShareService.list(query, req.user?.userId);
  res.json({ success: true, data });
}

export async function getPost(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const trackView = req.query.trackView !== 'false' && req.query.view !== '0';
  const data = await templateShareService.getById(id, req.user?.userId, {
    trackView,
    viewerKey: viewerKey(req),
  });
  res.json({ success: true, data });
}

export async function publish(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const body = req.body as PublishTemplateShareInput;
  const data = await templateShareService.publish(userId, body);
  res.status(201).json({ success: true, data });
}

export async function updatePost(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = getParam(req.params.id);
  const body = req.body as UpdateTemplateShareInput;
  const data = await templateShareService.update(id, userId, body);
  res.json({ success: true, data });
}

export async function download(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = getParam(req.params.id);
  const data = await templateShareService.download(id, userId);
  res.status(201).json({ success: true, data });
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = getParam(req.params.id);
  const data = await templateShareService.toggleLike(id, userId);
  res.json({ success: true, data });
}

export async function toggleFavorite(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = getParam(req.params.id);
  const data = await templateShareService.toggleFavorite(id, userId);
  res.json({ success: true, data });
}

export async function listComments(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const data = await templateShareService.listComments(id, req.user?.userId);
  res.json({ success: true, data });
}

export async function createComment(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = getParam(req.params.id);
  const body = req.body as TemplateShareCommentBody;
  const data = await templateShareService.createComment(id, userId, body);
  res.status(201).json({ success: true, data });
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = getParam(req.params.id);
  const commentId = getParam(req.params.commentId);
  const body = req.body as TemplateShareCommentBody;
  const data = await templateShareService.updateComment(id, commentId, userId, body);
  res.json({ success: true, data });
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  const { userId, roleCode } = requireUser(req);
  const id = getParam(req.params.id);
  const commentId = getParam(req.params.commentId);
  await templateShareService.deleteComment(id, commentId, userId, roleCode);
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function reportPost(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const id = getParam(req.params.id);
  const body = req.body as TemplateShareReportBody;
  const data = await templateShareService.report(id, userId, body);
  res.status(201).json({ success: true, data });
}

export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  const data = await templateShareService.adminStats();
  res.json({ success: true, data });
}

export async function listAdminPosts(_req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery<TemplateShareAdminListQuery>(res);
  const data = await templateShareService.adminList(query);
  res.json({ success: true, data });
}

export async function adminUpdateStatus(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const status = (req.body as { status: TemplateShareStatus }).status;
  const data = await templateShareService.adminUpdateStatus(id, status);
  res.json({ success: true, data });
}

export async function listReports(req: Request, res: Response): Promise<void> {
  const status = req.query.status as TemplateShareReportStatus | undefined;
  const data = await templateShareService.listReports(status);
  res.json({ success: true, data });
}

export async function resolveReport(req: Request, res: Response): Promise<void> {
  const { userId } = requireUser(req);
  const reportId = getParam(req.params.reportId);
  const status = (req.body as { status: TemplateShareReportStatus }).status;
  const data = await templateShareService.resolveReport(reportId, status, userId);
  res.json({ success: true, data });
}
