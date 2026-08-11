import type { Request, Response } from 'express';
import type {
  CreateNoticeInput,
  NoticeFlagBody,
  NoticeListQuery,
  NoticePublishBody,
  UpdateNoticeInput,
} from '@machinefit/shared';
import { NOTICE_LANGUAGES, type NoticeLanguage } from '@machinefit/shared';
import { noticeService } from '../services/notice.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getValidatedQuery } from '../middlewares/validate.middleware.js';
import { storageService } from '../services/storage.service.js';
import { noticeRepository } from '../repositories/notice.repository.js';
import { createHash } from 'node:crypto';
import { writeAdminAudit } from '../utils/admin-audit.util.js';

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function resolveLanguage(req: Request): NoticeLanguage {
  const header = String(req.headers['accept-language'] ?? '')
    .split(',')[0]
    ?.trim()
    .slice(0, 2)
    .toLowerCase();
  const q = typeof req.query.language === 'string' ? req.query.language : '';
  const candidate = (q || header || 'ko') as NoticeLanguage;
  return (NOTICE_LANGUAGES as readonly string[]).includes(candidate) ? candidate : 'ko';
}

function viewerKey(req: Request): string {
  if (req.user?.userId) return `user:${req.user.userId}`;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ua = String(req.headers['user-agent'] ?? '');
  const hash = createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
  return `anon:${hash}`;
}

export async function listNotices(req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery<NoticeListQuery>(res);
  const language = resolveLanguage(req);
  const isAdmin = Boolean(req.user && req.query.admin === 'true');
  const data = isAdmin
    ? await noticeService.listAdmin(query, language, req.user!.roleCode)
    : await noticeService.listPublic(query, language);
  res.json({
    success: true,
    data: {
      items: data.items,
      total: data.total,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}

export async function getNotice(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const language = resolveLanguage(req);
  if (req.query.admin === 'true') {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const data = await noticeService.getAdmin(id, language, req.user.roleCode);
    res.json({ success: true, data });
    return;
  }
  const data = await noticeService.getPublic(id, language, viewerKey(req));
  res.json({ success: true, data });
}

export async function createNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = req.body as CreateNoticeInput;
  const data = await noticeService.create(req.user.userId, req.user.roleCode, body);
  writeAdminAudit(req, {
    action: 'admin.notice.create',
    targetType: 'notice',
    targetId: data.id,
  });
  res.status(201).json({ success: true, data });
}

export async function updateNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as UpdateNoticeInput;
  const data = await noticeService.update(id, req.user.roleCode, body);
  writeAdminAudit(req, { action: 'admin.notice.update', targetType: 'notice', targetId: id });
  res.json({ success: true, data });
}

export async function deleteNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  await noticeService.remove(id, req.user.roleCode);
  writeAdminAudit(req, { action: 'admin.notice.delete', targetType: 'notice', targetId: id });
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function publishNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as NoticePublishBody;
  const data = await noticeService.publish(id, req.user.roleCode, body);
  writeAdminAudit(req, {
    action: 'admin.notice.publish',
    targetType: 'notice',
    targetId: id,
    meta: { publishAt: body.publishAt ?? null },
  });
  res.json({ success: true, data });
}

export async function pinNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as NoticeFlagBody;
  const data = await noticeService.setPinned(id, req.user.roleCode, body.value);
  writeAdminAudit(req, {
    action: 'admin.notice.pin',
    targetType: 'notice',
    targetId: id,
    meta: { value: body.value },
  });
  res.json({ success: true, data });
}

export async function importantNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as NoticeFlagBody;
  const data = await noticeService.setImportant(id, req.user.roleCode, body.value);
  writeAdminAudit(req, {
    action: 'admin.notice.important',
    targetType: 'notice',
    targetId: id,
    meta: { value: body.value },
  });
  res.json({ success: true, data });
}

export async function bannerNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as NoticeFlagBody;
  const data = await noticeService.setBanner(id, req.user.roleCode, body.value);
  writeAdminAudit(req, {
    action: 'admin.notice.banner',
    targetType: 'notice',
    targetId: id,
    meta: { value: body.value },
  });
  res.json({ success: true, data });
}

export async function popupNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as NoticeFlagBody;
  const data = await noticeService.setPopup(id, req.user.roleCode, body.value);
  res.json({ success: true, data });
}

export async function uploadAttachment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const file = req.file;
  if (!file) throw new AppError(400, 'VALIDATION_ERROR', 'file is required');
  const isInlineImage = String(req.body?.isInlineImage ?? '') === 'true';
  const data = await noticeService.uploadAttachment(id, req.user.roleCode, file, isInlineImage);
  res.status(201).json({ success: true, data });
}

export async function deleteAttachment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const attachmentId = getParam(req.params.attachmentId);
  await noticeService.deleteAttachment(id, attachmentId, req.user.roleCode);
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function downloadAttachment(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const attachmentId = getParam(req.params.attachmentId);
  const attachment = await noticeRepository.getAttachment(id, attachmentId);
  if (!attachment) throw new AppError(404, 'NOT_FOUND', 'Attachment not found');

  // Public notices only for anonymous download
  const notice = await noticeRepository.getById(id, { language: 'ko', admin: false });
  if (!notice && !(req.user && hasAdmin(req))) {
    throw new AppError(404, 'NOT_FOUND', 'Notice not found');
  }

  const file = await storageService.readNoticeAttachment(attachment.storagePath);
  if (!file) throw new AppError(404, 'NOT_FOUND', 'File missing from storage');

  res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`
  );
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(file.buffer);
}

function hasAdmin(req: Request): boolean {
  return req.user?.roleCode === 'admin';
}

export async function getHomeBanner(req: Request, res: Response): Promise<void> {
  const language = resolveLanguage(req);
  const data = await noticeService.getBanner(language);
  res.json({ success: true, data });
}

export async function getHomePopup(req: Request, res: Response): Promise<void> {
  const language = resolveLanguage(req);
  const data = await noticeService.getPopup(language);
  res.json({ success: true, data });
}

export async function getAdminStats(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const language = resolveLanguage(req);
  const data = await noticeService.adminStats(language, req.user.roleCode);
  res.json({ success: true, data });
}
