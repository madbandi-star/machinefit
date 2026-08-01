import sharp from 'sharp';
import type { BoardType, RoleCode } from '@machinefit/shared';
import type {
  CreatePostInput,
  CreateCommentInput,
  CreateMachineRequestInput,
  UpdateCommentInput,
  UpdateMachineRequestInput,
} from '@machinefit/shared';
import { findBlockedContentMatch } from '@machinefit/shared';
import {
  isAllowedMachineRequestImage,
  machineRequestImageLimits,
} from '../config/machine-request-image.js';
import {
  communityRepository,
  type ProcessedMachineRequestImage,
} from '../repositories/community.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { complianceRepository } from '../repositories/compliance.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

function assertSafeUgc(...parts: Array<string | undefined>) {
  for (const part of parts) {
    if (!part) continue;
    if (findBlockedContentMatch(part)) {
      throw new AppError(
        400,
        'CONTENT_POLICY_VIOLATION',
        'Content violates community guidelines'
      );
    }
  }
}

async function processMachineRequestPhoto(buffer: Buffer): Promise<ProcessedMachineRequestImage> {
  const limits = machineRequestImageLimits();
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

export const communityService = {
  listPosts(boardType?: BoardType, page = 1, limit = 20) {
    return communityRepository.listPosts(boardType, page, limit);
  },

  async getPost(postId: string) {
    const post = await communityRepository.getPost(postId);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const comments = await communityRepository.listComments(postId);
    return { post, comments };
  },

  async createPost(userId: string, input: CreatePostInput) {
    assertSafeUgc(input.title, input.content);
    const user = await userRepository.findById(userId);
    return communityRepository.createPost(userId, user?.displayName ?? 'User', input);
  },

  async deletePost(postId: string, userId: string, roleCode: RoleCode) {
    await communityRepository.deletePost(postId, userId, roleCode);
  },

  async createComment(postId: string, userId: string, input: CreateCommentInput) {
    assertSafeUgc(input.content);
    const user = await userRepository.findById(userId);
    return communityRepository.createComment(postId, userId, user?.displayName ?? 'User', input);
  },

  async updateComment(commentId: string, userId: string, input: UpdateCommentInput) {
    assertSafeUgc(input.content);
    return communityRepository.updateComment(commentId, userId, input);
  },

  async deleteComment(commentId: string, userId: string, roleCode: RoleCode) {
    await communityRepository.deleteComment(commentId, userId, roleCode);
  },

  toggleLike(postId: string, userId: string) {
    return communityRepository.toggleLike(postId, userId);
  },

  listMachineRequests(page = 1, limit = 20, viewerId?: string) {
    return communityRepository.listMachineRequests(page, limit, viewerId);
  },

  toggleMachineRequestVote(requestId: string, userId: string) {
    return communityRepository.toggleMachineRequestVote(requestId, userId);
  },

  getMachineRequest(requestId: string, viewerId?: string) {
    return communityRepository.getMachineRequest(requestId, viewerId);
  },

  updateMachineRequest(
    requestId: string,
    userId: string,
    roleCode: RoleCode,
    input: UpdateMachineRequestInput
  ) {
    assertSafeUgc(input.brandName, input.machineName, input.description);
    return communityRepository.updateMachineRequest(requestId, userId, roleCode, input);
  },

  deleteMachineRequest(requestId: string, userId: string, roleCode: RoleCode) {
    return communityRepository.deleteMachineRequest(requestId, userId, roleCode);
  },

  getMachineRequestImageBinary(imageId: string, variant: 'full' | 'thumb') {
    return communityRepository.getMachineRequestImageBinary(imageId, variant);
  },

  async createMachineRequest(
    userId: string,
    input: CreateMachineRequestInput,
    files: Express.Multer.File[]
  ) {
    assertSafeUgc(input.brandName, input.machineName, input.description);
    if (!input.commercialUseConsent) {
      throw new AppError(
        400,
        'CONSENT_REQUIRED',
        'Commercial use consent is required to submit a machine request'
      );
    }

    const limits = machineRequestImageLimits();
    const maxCount = Math.min(limits.maxCount, 5);
    if (!files.length) {
      throw new AppError(400, 'IMAGES_REQUIRED', 'At least one image is required');
    }
    if (files.length > maxCount) {
      throw new AppError(400, 'TOO_MANY_FILES', `You can upload up to ${maxCount} images.`);
    }

    const processed = [];
    for (const file of files) {
      if (!isAllowedMachineRequestImage(file.mimetype, file.originalname)) {
        throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only JPEG, PNG, and WebP are allowed');
      }
      if (file.size > limits.maxBytes) {
        throw new AppError(400, 'FILE_TOO_LARGE', 'Image file is too large');
      }
      processed.push(await processMachineRequestPhoto(file.buffer));
    }

    const user = await userRepository.findById(userId);
    return communityRepository.createMachineRequest(
      userId,
      user?.displayName ?? 'User',
      input,
      processed
    );
  },

  async reportPost(
    reporterId: string,
    postId: string,
    input: { reason: string; description?: string }
  ) {
    const post = await communityRepository.getPost(postId);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    return complianceRepository.createCommunityReport({
      reporterId,
      postId,
      reason: input.reason,
      description: input.description,
    });
  },

  async reportComment(
    reporterId: string,
    commentId: string,
    input: { reason: string; description?: string }
  ) {
    return complianceRepository.createCommunityReport({
      reporterId,
      commentId,
      reason: input.reason,
      description: input.description,
    });
  },
};

/** @deprecated Use services/owner.service.ts */
export { ownerService } from "./owner.service.js";
