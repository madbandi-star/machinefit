import sharp from 'sharp';
import {
  Role,
  type AdminMachineRarityListQuery,
  type AdminMachineRarityPatch,
  type AdminMachineShowcasePostPatch,
  type ClaimGymMachineInput,
  type CreateMachineShowcaseCommentInput,
  type CreateMachineShowcasePostInput,
  type CreateMachineShowcaseReportInput,
  type MachineShowcaseListQuery,
  type RoleCode,
  type UpdateMachineShowcaseCommentInput,
  type UpdateMachineShowcasePostInput,
} from '@machinefit/shared';
import { isAllowedPhotoBoardImage, photoBoardImageLimits } from '../config/photo-board-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { machineShowcaseRepository } from '../repositories/machine-showcase.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { gymInventoryService } from './gym-inventory.service.js';
import { machineRarityService } from './machine-rarity.service.js';
import { achievementService } from './achievement.service.js';
import { assertSafeUgc } from '../utils/content-safety.util.js';
import { assertUsageAllowed, trackUsageSafe } from './usage.service.js';

const MAX_SHOWCASE_IMAGES = 6;

async function processPhoto(buffer: Buffer) {
  const limits = photoBoardImageLimits();
  try {
    const image = sharp(buffer, { failOn: 'none' }).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) {
      throw new AppError(400, 'INVALID_IMAGE', 'Could not read image dimensions');
    }
    const mainBuffer = await image
      .clone()
      .resize({
        width: limits.maxEdge,
        height: limits.maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    const mainMeta = await sharp(mainBuffer).metadata();
    const thumbBuffer = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({
        width: limits.thumbEdge,
        height: limits.thumbEdge,
        fit: 'cover',
        position: 'centre',
      })
      .webp({ quality: 78 })
      .toBuffer();
    return {
      buffer: mainBuffer,
      thumb: thumbBuffer,
      mimeType: 'image/webp',
      width: mainMeta.width ?? limits.maxEdge,
      height: mainMeta.height ?? limits.maxEdge,
      fileSizeBytes: mainBuffer.byteLength,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'INVALID_IMAGE', 'Could not process the image file');
  }
}

async function resolveMachineId(machineCode: string): Promise<string> {
  const id = await machineRepository.findIdByCode(machineCode);
  if (!id) throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
  return id;
}

async function afterMachineChange(userId: string, machineId: string): Promise<string[]> {
  await machineShowcaseRepository.recomputeDiscoveryRanks(machineId);
  await machineRarityService.recalculateSafe(machineId);
  try {
    const result = await achievementService.refreshUser(userId);
    return result.newlyUnlockedIds ?? [];
  } catch {
    return [];
  }
}

export const machineShowcaseService = {
  list(query: MachineShowcaseListQuery, viewerId?: string, locale = 'ko') {
    return machineShowcaseRepository.list(query, viewerId, locale);
  },

  getById(postId: string, viewerId?: string, locale = 'ko') {
    return machineShowcaseRepository.getById(postId, viewerId, { incrementView: true, locale });
  },

  async createPost(
    userId: string,
    roleCode: RoleCode,
    input: CreateMachineShowcasePostInput,
    files: Express.Multer.File[],
    locale = 'ko'
  ) {
    assertSafeUgc(input.caption, ...(input.tags ?? []));
    await assertUsageAllowed(userId, 'image_upload');
    const limits = photoBoardImageLimits();
    if (!files.length) throw new AppError(400, 'IMAGES_REQUIRED', 'At least one image is required');
    if (files.length > MAX_SHOWCASE_IMAGES) {
      throw new AppError(400, 'TOO_MANY_FILES', `Max ${MAX_SHOWCASE_IMAGES} images`);
    }

    const processed = [];
    for (const file of files) {
      if (!isAllowedPhotoBoardImage(file.mimetype, file.originalname)) {
        throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only JPEG, PNG, and WebP are allowed');
      }
      if (file.size > limits.maxBytes) {
        throw new AppError(400, 'FILE_TOO_LARGE', 'Image file is too large');
      }
      processed.push(await processPhoto(file.buffer));
    }

    const machineId = await resolveMachineId(input.machineCode);
    const postId = await machineShowcaseRepository.createPost(userId, input, processed, {
      machineId,
    });

    if (input.gymId) {
      try {
        await gymInventoryService.add(input.gymId, userId, roleCode || Role.MEMBER, {
          machineCode: input.machineCode,
          quantity: 1,
        });
      } catch {
        // Duplicate / unknown directory gym — personal post still stands.
      }
    }

    const dex = await machineShowcaseRepository.upsertDiscovery(userId, machineId, postId, 'post');
    const newlyUnlockedAchievementIds = await afterMachineChange(userId, machineId);
    trackUsageSafe(userId, 'image_upload');

    const detail = await machineShowcaseRepository.getById(postId, userId, { locale });
    const rank = await machineShowcaseRepository.getDiscoveryRank(userId, machineId);
    return {
      post: detail.post,
      discovery: {
        isNew: dex.isNew,
        rank,
        grade: detail.post.rarity.grade,
        gymHoldingCount: detail.post.rarity.gymHoldingCount,
      },
      newlyUnlockedAchievementIds,
    };
  },

  updatePost(
    postId: string,
    userId: string,
    role: RoleCode,
    input: UpdateMachineShowcasePostInput
  ) {
    assertSafeUgc(input.caption, ...(input.tags ?? []));
    return machineShowcaseRepository.updatePost(postId, userId, role, input);
  },

  async deletePost(postId: string, userId: string, role: RoleCode) {
    const machineId = await machineShowcaseRepository.deletePost(postId, userId, role);
    await afterMachineChange(userId, machineId);
  },

  getImageMeta(imageId: string, variant: 'main' | 'thumb') {
    return machineShowcaseRepository.getImageMeta(imageId, variant);
  },

  getImageBinary(imageId: string, variant: 'main' | 'thumb') {
    return machineShowcaseRepository.getImageBinary(imageId, variant);
  },

  setLike(postId: string, userId: string, liked: boolean) {
    return machineShowcaseRepository.setLike(postId, userId, liked);
  },

  setBookmark(postId: string, userId: string, bookmarked: boolean) {
    return machineShowcaseRepository.setBookmark(postId, userId, bookmarked);
  },

  createComment(postId: string, userId: string, input: CreateMachineShowcaseCommentInput) {
    assertSafeUgc(input.content);
    return machineShowcaseRepository.createComment(postId, userId, input);
  },

  updateComment(commentId: string, userId: string, input: UpdateMachineShowcaseCommentInput) {
    assertSafeUgc(input.content);
    return machineShowcaseRepository.updateComment(commentId, userId, input);
  },

  deleteComment(commentId: string, userId: string, role: RoleCode) {
    return machineShowcaseRepository.deleteComment(commentId, userId, role);
  },

  createReport(userId: string, input: CreateMachineShowcaseReportInput) {
    assertSafeUgc(input.description);
    return machineShowcaseRepository.createReport(userId, input);
  },

  listReports() {
    return machineShowcaseRepository.listReports();
  },

  resolveReport(reportId: string, adminId: string, status: 'resolved' | 'dismissed') {
    return machineShowcaseRepository.resolveReport(reportId, adminId, status);
  },

  async hidePost(postId: string, adminId: string) {
    const machineId = await machineShowcaseRepository.hidePost(postId);
    await machineShowcaseRepository.recomputeDiscoveryRanks(machineId);
    await machineRarityService.recalculateSafe(machineId);
    void adminId;
  },

  async adminPatchPost(postId: string, input: AdminMachineShowcasePostPatch) {
    const machineId = input.machineCode
      ? await resolveMachineId(input.machineCode)
      : undefined;
    const resolvedMachineId = await machineShowcaseRepository.adminPatchPost(
      postId,
      input,
      machineId
    );
    await machineShowcaseRepository.recomputeDiscoveryRanks(resolvedMachineId);
    await machineRarityService.recalculateSafe(resolvedMachineId);
  },

  async claimGymMachine(userId: string, input: ClaimGymMachineInput) {
    const machineId = await resolveMachineId(input.machineCode);
    const result = await machineShowcaseRepository.claimGymMachine(userId, input, machineId);
    await machineShowcaseRepository.upsertDiscovery(userId, machineId, input.sourcePostId ?? null, 'claim');
    await afterMachineChange(userId, machineId);
    const rarity = await machineShowcaseRepository.getRarityPublic(machineId, input.machineCode);
    return { ...result, rarity };
  },

  async getMachineGyms(machineCode: string) {
    const machineId = await resolveMachineId(machineCode);
    await machineRarityService.recalculateSafe(machineId);
    return machineShowcaseRepository.getMachineGyms(machineId, machineCode);
  },

  async getRarity(machineCode: string) {
    const machineId = await resolveMachineId(machineCode);
    await machineRarityService.recalculateSafe(machineId);
    return machineShowcaseRepository.getRarityPublic(machineId, machineCode);
  },

  getDex(userId: string, locale = 'ko') {
    return machineShowcaseRepository.getDex(userId, locale);
  },

  getMyGymHoldings(userId: string, userGymId: string, locale = 'ko') {
    return machineShowcaseRepository.getMyGymHoldings(userId, userGymId, locale);
  },

  listAdminRarity(query: AdminMachineRarityListQuery) {
    return machineShowcaseRepository.listAdminRarity(query);
  },

  async patchRarity(machineCode: string, input: AdminMachineRarityPatch) {
    const machineId = await resolveMachineId(machineCode);
    await machineShowcaseRepository.patchRarity(machineId, input);
    await machineRarityService.recalculate(machineId);
    return machineShowcaseRepository.getRarityPublic(machineId, machineCode);
  },
};
