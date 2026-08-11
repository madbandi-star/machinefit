import type { Request, Response } from 'express';
import type {
  BannerEventBody,
  BannerListQuery,
  CreateBannerInput,
  CreateBannerSlotInput,
  UpdateBannerInput,
  UpdateBannerSlotInput,
} from '@machinefit/shared';
import { bannerService } from '../services/banner.service.js';
import { getValidatedQuery } from '../middlewares/validate.middleware.js';
import { AppError } from '../middlewares/error.middleware.js';
import { writeAdminAudit } from '../utils/admin-audit.util.js';

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export async function listAdminBanners(req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery<BannerListQuery>(res);
  const data = await bannerService.listAdmin(query, req.user?.roleCode);
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

export async function getAdminBanner(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const data = await bannerService.getAdmin(id, req.user?.roleCode);
  res.json({ success: true, data });
}

export async function createBanner(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateBannerInput;
  const data = await bannerService.create(body, req.user?.roleCode, req.user?.userId);
  writeAdminAudit(req, {
    action: 'admin.banner.create',
    targetType: 'banner',
    targetId: data.id,
  });
  res.status(201).json({ success: true, data });
}

export async function updateBanner(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const body = req.body as UpdateBannerInput;
  const data = await bannerService.update(id, body, req.user?.roleCode);
  writeAdminAudit(req, { action: 'admin.banner.update', targetType: 'banner', targetId: id });
  res.json({ success: true, data });
}

export async function deleteBanner(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  await bannerService.remove(id, req.user?.roleCode);
  writeAdminAudit(req, { action: 'admin.banner.delete', targetType: 'banner', targetId: id });
  res.json({ success: true, data: { message: 'Banner deleted' } });
}

export async function uploadBannerImage(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const kindRaw = String(req.query.kind ?? req.body?.kind ?? 'desktop');
  const kind = kindRaw === 'mobile' ? 'mobile' : 'desktop';
  const data = await bannerService.uploadImage(id, kind, req.file, req.user?.roleCode);
  writeAdminAudit(req, {
    action: 'admin.banner.image.upload',
    targetType: 'banner',
    targetId: id,
    meta: { kind },
  });
  res.json({ success: true, data });
}

export async function clearBannerImage(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  const kindRaw = String(req.query.kind ?? 'desktop');
  const kind = kindRaw === 'mobile' ? 'mobile' : 'desktop';
  const data = await bannerService.clearImage(id, kind, req.user?.roleCode);
  writeAdminAudit(req, {
    action: 'admin.banner.image.clear',
    targetType: 'banner',
    targetId: id,
    meta: { kind },
  });
  res.json({ success: true, data });
}

export async function listSlots(req: Request, res: Response): Promise<void> {
  const data = await bannerService.listSlots(req.user?.roleCode);
  res.json({ success: true, data });
}

export async function createSlot(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateBannerSlotInput;
  const data = await bannerService.createSlot(body, req.user?.roleCode);
  writeAdminAudit(req, {
    action: 'admin.banner.slot.create',
    targetType: 'banner_slot',
    targetId: data.id,
    meta: { slotKey: data.slotKey },
  });
  res.status(201).json({ success: true, data });
}

export async function updateSlot(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  if (!id) throw new AppError(400, 'INVALID_ID', 'Slot id is required');
  const body = req.body as UpdateBannerSlotInput;
  const data = await bannerService.updateSlot(id, body, req.user?.roleCode);
  writeAdminAudit(req, { action: 'admin.banner.slot.update', targetType: 'banner_slot', targetId: id });
  res.json({ success: true, data });
}

export async function deleteSlot(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id);
  if (!id) throw new AppError(400, 'INVALID_ID', 'Slot id is required');
  await bannerService.deleteSlot(id, req.user?.roleCode);
  writeAdminAudit(req, { action: 'admin.banner.slot.delete', targetType: 'banner_slot', targetId: id });
  res.json({ success: true, data: { message: 'Slot deleted' } });
}

export async function getPublicSlot(req: Request, res: Response): Promise<void> {
  const slotKey = getParam(req.params.slotKey);
  const data = await bannerService.listPublic(slotKey);
  res.json({ success: true, data: { banners: data } });
}

export async function recordBannerEvent(req: Request, res: Response): Promise<void> {
  const body = req.body as BannerEventBody;
  // Respond immediately-ish; still await to keep ordering simple but cheap.
  await bannerService.recordEvent(body, null);
  res.status(204).end();
}

export async function getAdminStats(req: Request, res: Response): Promise<void> {
  const data = await bannerService.adminStats(req.user?.roleCode);
  res.json({ success: true, data });
}

export async function getStatsRows(req: Request, res: Response): Promise<void> {
  const data = await bannerService.statsRows(req.user?.roleCode);
  res.json({ success: true, data });
}
