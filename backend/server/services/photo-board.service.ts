import sharp from 'sharp';
import type {
  BlockPhotoUserInput,
  CreatePhotoCommentInput,
  CreatePhotoPostInput,
  CreatePhotoReportInput,
  PhotoBoardListQuery,
  ResolvePhotoReportInput,
  RoleCode,
  UpdatePhotoPostInput,
} from '@machinefit/shared';
import { isAllowedPhotoBoardImage, photoBoardImageLimits } from '../config/photo-board-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { photoBoardRepository } from '../repositories/photo-board.repository.js';
import { notificationService } from './notification.service.js';

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
    const thumbMeta = await sharp(thumbBuffer).metadata();

    return {
      buffer: mainBuffer,
      thumb: thumbBuffer,
      mimeType: 'image/webp',
      width: mainMeta.width ?? limits.maxEdge,
      height: mainMeta.height ?? limits.maxEdge,
      fileSizeBytes: mainBuffer.byteLength,
      thumbWidth: thumbMeta.width ?? limits.thumbEdge,
      thumbHeight: thumbMeta.height ?? limits.thumbEdge,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'INVALID_IMAGE', 'Could not process the image file');
  }
}

export const photoBoardService = {
  list(query: PhotoBoardListQuery, viewerId?: string) {
    return photoBoardRepository.list(query, viewerId);
  },

  getById(postId: string, viewerId?: string) {
    return photoBoardRepository.getById(postId, viewerId, { incrementView: true });
  },

  async createPost(
    userId: string,
    input: CreatePhotoPostInput,
    files: Express.Multer.File[]
  ) {
    const limits = photoBoardImageLimits();
    if (!files.length) throw new AppError(400, 'IMAGES_REQUIRED', 'At least one image is required');
    if (files.length > limits.maxCount) {
      throw new AppError(400, 'TOO_MANY_FILES', `Max ${limits.maxCount} images`);
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

    return photoBoardRepository.createPost(userId, input, processed);
  },

  updatePost(postId: string, userId: string, role: RoleCode, input: UpdatePhotoPostInput) {
    return photoBoardRepository.updatePost(postId, userId, role, input);
  },

  deletePost(postId: string, userId: string, role: RoleCode) {
    return photoBoardRepository.deletePost(postId, userId, role);
  },

  getImageBinary(imageId: string, variant: 'main' | 'thumb') {
    return photoBoardRepository.getImageBinary(imageId, variant);
  },

  async toggleLike(postId: string, userId: string) {
    const result = await photoBoardRepository.toggleLike(postId, userId);
    if (result.liked && result.authorId !== userId) {
      void notificationService.notify(
        result.authorId,
        'photo_like',
        { ko: '사진게시판 좋아요', en: 'Photo board like' },
        { ko: '회원님이 올린 사진에 좋아요가 눌렸습니다.', en: 'Someone liked your photo post.' },
        { postId, type: 'photo_like' }
      );
    }
    return { liked: result.liked, likeCount: result.likeCount };
  },

  async createComment(postId: string, userId: string, input: CreatePhotoCommentInput) {
    const result = await photoBoardRepository.createComment(postId, userId, input);
    if (result.authorId !== userId) {
      const isReply = Boolean(input.parentId);
      void notificationService.notify(
        result.authorId,
        isReply ? 'photo_reply' : 'photo_comment',
        {
          ko: isReply ? '사진게시판 답글' : '사진게시판 댓글',
          en: isReply ? 'Photo board reply' : 'Photo board comment',
        },
        {
          ko: isReply
            ? '회원님의 게시글에 답글이 달렸습니다.'
            : '회원님의 게시글에 댓글이 달렸습니다.',
          en: isReply
            ? 'Someone replied on your photo post.'
            : 'Someone commented on your photo post.',
        },
        { postId, commentId: result.comment.id, type: isReply ? 'photo_reply' : 'photo_comment' }
      );
    }
    return result.comment;
  },

  deleteComment(commentId: string, userId: string, role: RoleCode) {
    return photoBoardRepository.deleteComment(commentId, userId, role);
  },

  createReport(reporterId: string, input: CreatePhotoReportInput) {
    return photoBoardRepository.createReport(reporterId, input);
  },

  listReports() {
    return photoBoardRepository.listReports();
  },

  async resolveReport(reportId: string, adminId: string, input: ResolvePhotoReportInput) {
    const report = await photoBoardRepository.resolveReport(reportId, adminId, input.status);
    void notificationService.notify(
      report.reporterId,
      'photo_report_result',
      { ko: '신고 처리 결과', en: 'Report result' },
      {
        ko:
          input.status === 'resolved'
            ? '신고가 처리되었습니다.'
            : '신고가 기각되었습니다.',
        en:
          input.status === 'resolved'
            ? 'Your report was resolved.'
            : 'Your report was dismissed.',
      },
      { reportId, status: input.status, type: 'photo_report_result' }
    );
    return report;
  },

  hidePost(postId: string) {
    return photoBoardRepository.hidePost(postId);
  },

  blockUser(adminId: string, input: BlockPhotoUserInput) {
    return photoBoardRepository.blockUser(adminId, input.userId, input.reason);
  },

  listBlocks() {
    return photoBoardRepository.listBlocks();
  },
};
