import sharp from 'sharp';
import type { BoardType, MachineRequestListQuery, RoleCode } from '@machinefit/shared';
import type {
  CreatePostInput,
  CreateCommentInput,
  CreateMachineRequestInput,
  UpdateCommentInput,
  UpdateMachineRequestInput,
} from '@machinefit/shared';
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
import { assertSafeUgc } from '../utils/content-safety.util.js';
import { notificationService } from './notification.service.js';
import { awardPointsSafe } from './points.service.js';

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
    const post = await communityRepository.createPost(
      userId,
      user?.displayName ?? 'User',
      input,
      user?.roleCode
    );
    awardPointsSafe({
      userId,
      actionCode: 'community_post',
      referenceType: 'post',
      referenceId: post.id,
      idempotencyKey: `community_post:post:${post.id}`,
    });
    return post;
  },

  async deletePost(postId: string, userId: string, roleCode: RoleCode) {
    await communityRepository.deletePost(postId, userId, roleCode);
  },

  async createComment(postId: string, userId: string, input: CreateCommentInput) {
    assertSafeUgc(input.content);
    const user = await userRepository.findById(userId);
    const comment = await communityRepository.createComment(
      postId,
      userId,
      user?.displayName ?? 'User',
      input,
      user?.roleCode
    );
    awardPointsSafe({
      userId,
      actionCode: 'community_comment',
      referenceType: 'comment',
      referenceId: comment.id,
      idempotencyKey: `community_comment:comment:${comment.id}`,
    });
    return comment;
  },

  async updateComment(commentId: string, userId: string, input: UpdateCommentInput) {
    assertSafeUgc(input.content);
    return communityRepository.updateComment(commentId, userId, input);
  },

  async deleteComment(commentId: string, userId: string, roleCode: RoleCode) {
    await communityRepository.deleteComment(commentId, userId, roleCode);
  },

  async toggleLike(postId: string, userId: string) {
    const result = await communityRepository.toggleLike(postId, userId);
    if (result.liked) {
      awardPointsSafe({
        userId,
        actionCode: 'community_like',
        referenceType: 'post',
        referenceId: postId,
        idempotencyKey: `community_like:post:${postId}:${userId}`,
      });
    }
    return result;
  },

  listMachineRequests(query: MachineRequestListQuery, viewerId?: string) {
    return communityRepository.listMachineRequests(query, viewerId);
  },

  getMachineRequest(requestId: string, viewerId?: string) {
    return communityRepository.getMachineRequest(requestId, viewerId, { incrementView: true });
  },

  getMachineRequestImageMeta(imageId: string, variant: 'full' | 'thumb') {
    return communityRepository.getMachineRequestImageMeta(imageId, variant);
  },

  getMachineRequestImageBinary(imageId: string, variant: 'full' | 'thumb') {
    return communityRepository.getMachineRequestImageBinary(imageId, variant);
  },

  async toggleMachineRequestLike(requestId: string, userId: string) {
    const result = await communityRepository.toggleMachineRequestLike(requestId, userId);
    if (result.liked && result.authorId && result.authorId !== userId) {
      void notificationService.notify(
        result.authorId,
        'machine_request_like',
        { ko: '기구요청 좋아요', en: 'Machine request like' },
        {
          ko: '회원님이 올린 기구요청에 좋아요가 눌렸습니다.',
          en: 'Someone liked your machine request.',
        },
        { requestId, type: 'machine_request_like' }
      );
    }
    return { liked: result.liked, likeCount: result.likeCount };
  },

  async createMachineRequestComment(
    requestId: string,
    userId: string,
    input: CreateCommentInput
  ) {
    assertSafeUgc(input.content);
    const user = await userRepository.findById(userId);
    const result = await communityRepository.createMachineRequestComment(
      requestId,
      userId,
      user?.displayName ?? 'User',
      input,
      user?.roleCode
    );
    if (result.authorId && result.authorId !== userId) {
      const isReply = Boolean(input.parentId);
      void notificationService.notify(
        result.authorId,
        isReply ? 'machine_request_reply' : 'machine_request_comment',
        {
          ko: isReply ? '기구요청 답글' : '기구요청 댓글',
          en: isReply ? 'Machine request reply' : 'Machine request comment',
        },
        {
          ko: isReply
            ? '회원님의 기구요청에 답글이 달렸습니다.'
            : '회원님의 기구요청에 댓글이 달렸습니다.',
          en: isReply
            ? 'Someone replied on your machine request.'
            : 'Someone commented on your machine request.',
        },
        {
          requestId,
          commentId: result.comment.id,
          type: isReply ? 'machine_request_reply' : 'machine_request_comment',
        }
      );
    }
    return result.comment;
  },

  deleteMachineRequestComment(commentId: string, userId: string, roleCode: RoleCode) {
    return communityRepository.deleteMachineRequestComment(commentId, userId, roleCode);
  },

  toggleMachineRequestVote(requestId: string, userId: string) {
    return communityRepository.toggleMachineRequestVote(requestId, userId);
  },

  updateMachineRequest(
    requestId: string,
    userId: string,
    roleCode: RoleCode,
    input: UpdateMachineRequestInput
  ) {
    assertSafeUgc(input.brandName, input.machineName, input.description, input.gymName);
    return communityRepository.updateMachineRequest(requestId, userId, roleCode, input);
  },

  deleteMachineRequest(requestId: string, userId: string, roleCode: RoleCode) {
    return communityRepository.deleteMachineRequest(requestId, userId, roleCode);
  },

  listSimilarMachineRequestGroups(brandName: string, machineName: string) {
    return communityRepository.listSimilarMachineRequestGroups(brandName, machineName, 5);
  },

  async createMachineRequest(
    userId: string,
    input: CreateMachineRequestInput,
    files: Express.Multer.File[]
  ) {
    assertSafeUgc(input.brandName, input.machineName, input.description, input.gymName);
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
      processed,
      user?.roleCode
    );
  },

  async reportPost(
    reporterId: string,
    postId: string,
    input: { reason: string; description?: string }
  ) {
    assertSafeUgc(input.description);
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
    assertSafeUgc(input.description);
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
