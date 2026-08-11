import type {
  BannerAdminStats,
  BannerDetail,
  BannerEventBody,
  BannerListQuery,
  BannerSlot,
  CreateBannerInput,
  CreateBannerSlotInput,
  PublicBanner,
  UpdateBannerInput,
  UpdateBannerSlotInput,
} from '@machinefit/shared';
import {
  BANNER_ALLOWED_MIME_TYPES,
  BANNER_MAX_IMAGE_BYTES,
  hasMinRole,
  Role,
} from '@machinefit/shared';
import { bannerRepository } from '../repositories/banner.repository.js';
import { storageService } from './storage.service.js';
import { AppError } from '../middlewares/error.middleware.js';

function assertAdmin(roleCode: string | undefined): void {
  if (!hasMinRole(roleCode, Role.ADMIN)) {
    throw new AppError(403, 'FORBIDDEN', 'Admin access required');
  }
}

export const bannerService = {
  async listAdmin(query: BannerListQuery, roleCode: string | undefined) {
    assertAdmin(roleCode);
    return bannerRepository.listAdmin(query);
  },

  async getAdmin(id: string, roleCode: string | undefined): Promise<BannerDetail> {
    assertAdmin(roleCode);
    const banner = await bannerRepository.getById(id);
    if (!banner) throw new AppError(404, 'NOT_FOUND', 'Banner not found');
    return banner;
  },

  async create(
    input: CreateBannerInput,
    roleCode: string | undefined,
    userId: string | undefined
  ): Promise<BannerDetail> {
    assertAdmin(roleCode);
    return bannerRepository.create(input, userId ?? null);
  },

  async update(
    id: string,
    input: UpdateBannerInput,
    roleCode: string | undefined
  ): Promise<BannerDetail> {
    assertAdmin(roleCode);
    const updated = await bannerRepository.update(id, input);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Banner not found');
    return updated;
  },

  async remove(id: string, roleCode: string | undefined): Promise<void> {
    assertAdmin(roleCode);
    const ok = await bannerRepository.softDelete(id);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Banner not found');
  },

  async uploadImage(
    id: string,
    kind: 'desktop' | 'mobile',
    file: Express.Multer.File | undefined,
    roleCode: string | undefined
  ): Promise<BannerDetail> {
    assertAdmin(roleCode);
    const banner = await bannerRepository.getById(id);
    if (!banner) throw new AppError(404, 'NOT_FOUND', 'Banner not found');
    if (!file) throw new AppError(400, 'FILE_REQUIRED', 'Image file is required');
    if (file.size > BANNER_MAX_IMAGE_BYTES) {
      throw new AppError(400, 'FILE_TOO_LARGE', 'Banner image must be 5MB or smaller');
    }
    if (!BANNER_ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof BANNER_ALLOWED_MIME_TYPES)[number])) {
      throw new AppError(
        400,
        'INVALID_FILE_TYPE',
        'Only JPG, JPEG, PNG, WebP, and GIF are allowed'
      );
    }

    const previousPath =
      kind === 'mobile' ? banner.mobileImageStoragePath : banner.imageStoragePath;

    const stored = await storageService.uploadBannerImage({
      bannerId: id,
      kind,
      fileName: file.originalname || `${kind}.bin`,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    const updated = await bannerRepository.setImage(id, kind, stored.publicUrl, stored.storagePath);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Banner not found');

    if (previousPath && previousPath !== stored.storagePath) {
      void storageService.deleteBannerImage(previousPath).catch(() => undefined);
    }

    // Auto-set banner_type to gif when a GIF is uploaded as desktop creative.
    if (kind === 'desktop' && file.mimetype === 'image/gif' && updated.bannerType !== 'gif') {
      return (await bannerRepository.update(id, { bannerType: 'gif' })) ?? updated;
    }
    if (
      kind === 'desktop' &&
      file.mimetype !== 'image/gif' &&
      updated.bannerType === 'gif' &&
      !updated.mobileImageUrl?.includes('.gif')
    ) {
      return (await bannerRepository.update(id, { bannerType: 'image' })) ?? updated;
    }

    return updated;
  },

  async clearImage(
    id: string,
    kind: 'desktop' | 'mobile',
    roleCode: string | undefined
  ): Promise<BannerDetail> {
    assertAdmin(roleCode);
    const banner = await bannerRepository.getById(id);
    if (!banner) throw new AppError(404, 'NOT_FOUND', 'Banner not found');
    const path = kind === 'mobile' ? banner.mobileImageStoragePath : banner.imageStoragePath;
    const updated = await bannerRepository.clearImage(id, kind);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Banner not found');
    if (path) void storageService.deleteBannerImage(path).catch(() => undefined);
    return updated;
  },

  async listSlots(roleCode: string | undefined): Promise<BannerSlot[]> {
    assertAdmin(roleCode);
    return bannerRepository.listSlots();
  },

  async createSlot(
    input: CreateBannerSlotInput,
    roleCode: string | undefined
  ): Promise<BannerSlot> {
    assertAdmin(roleCode);
    try {
      return await bannerRepository.createSlot(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/unique|duplicate/i.test(message)) {
        throw new AppError(409, 'SLOT_EXISTS', 'A slot with this key already exists');
      }
      throw error;
    }
  },

  async updateSlot(
    id: string,
    input: UpdateBannerSlotInput,
    roleCode: string | undefined
  ): Promise<BannerSlot> {
    assertAdmin(roleCode);
    const updated = await bannerRepository.updateSlot(id, input);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Slot not found');
    return updated;
  },

  async deleteSlot(id: string, roleCode: string | undefined): Promise<void> {
    assertAdmin(roleCode);
    const existing = await bannerRepository.getSlotById(id);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Slot not found');
    const ok = await bannerRepository.deleteSlot(id);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Slot not found');
  },

  async listPublic(slotKey: string): Promise<PublicBanner[]> {
    return bannerRepository.listPublicForSlot(slotKey);
  },

  async recordEvent(body: BannerEventBody, userId?: string | null): Promise<void> {
    // Fire-and-forget friendly: ignore missing banners quietly for public clients.
    const banner = await bannerRepository.getById(body.bannerId);
    if (!banner) return;
    await bannerRepository.recordEvent({
      bannerId: body.bannerId,
      slotKey: body.slotKey,
      eventType: body.eventType,
      userId,
      sessionId: body.sessionId,
    });
  },

  async adminStats(roleCode: string | undefined): Promise<BannerAdminStats> {
    assertAdmin(roleCode);
    return bannerRepository.adminStats();
  },

  async statsRows(roleCode: string | undefined) {
    assertAdmin(roleCode);
    return bannerRepository.statsRows();
  },
};
