import sharp from 'sharp';
import type {
  CreateMachineTradeInput,
  CreateTradeReportInput,
  ListMachineTradesInput,
  ResolveTradeReportInput,
  RoleCode,
  UpdateMachineTradeInput,
} from '@machinefit/shared';
import { isAllowedTradeImage, machineTradeImageLimits } from '../config/machine-trade-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { machineTradeRepository } from '../repositories/machine-trade.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { findDevUserById } from '../data/dev-users.js';
import { getPool } from '../config/database.js';
import { notificationService } from './notification.service.js';

async function processTradeImage(buffer: Buffer) {
  const limits = machineTradeImageLimits();
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

export const machineTradeService = {
  list(query: ListMachineTradesInput, viewerId?: string, options?: { admin?: boolean }) {
    return machineTradeRepository.list(query, viewerId, options);
  },

  getById(tradeId: string, viewerId?: string, options?: { admin?: boolean }) {
    return machineTradeRepository.getById(tradeId, viewerId, {
      incrementView: true,
      admin: options?.admin,
    });
  },

  async create(sellerId: string, input: CreateMachineTradeInput, files: Express.Multer.File[]) {
    const limits = machineTradeImageLimits();
    if (files.length > limits.maxCount) {
      throw new AppError(400, 'TOO_MANY_FILES', `Max ${limits.maxCount} images`);
    }
    if (input.tradeType === 'sell' && !input.condition) {
      throw new AppError(400, 'CONDITION_REQUIRED', 'Condition is required for sell listings');
    }

    const processed = [];
    for (const file of files) {
      if (!isAllowedTradeImage(file.mimetype, file.originalname)) {
        throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only JPEG, PNG, and WebP are allowed');
      }
      if (file.size > limits.maxBytes) {
        throw new AppError(400, 'FILE_TOO_LARGE', 'Image file is too large');
      }
      processed.push(await processTradeImage(file.buffer));
    }

    const seller = getPool()
      ? await userRepository.findById(sellerId)
      : findDevUserById(sellerId);
    const sellerName = seller?.displayName ?? 'User';
    return machineTradeRepository.create(sellerId, sellerName, input, processed);
  },

  update(tradeId: string, userId: string, role: RoleCode, input: UpdateMachineTradeInput) {
    return machineTradeRepository.update(tradeId, userId, role, input);
  },

  delete(tradeId: string, userId: string, role: RoleCode) {
    return machineTradeRepository.delete(tradeId, userId, role);
  },

  restore(tradeId: string) {
    return machineTradeRepository.restore(tradeId);
  },

  republish(tradeId: string, userId: string, role: RoleCode) {
    return machineTradeRepository.republish(tradeId, userId, role);
  },

  getImageBinary(imageId: string, variant: 'full' | 'thumb') {
    return machineTradeRepository.getImageBinary(imageId, variant);
  },

  async toggleLike(tradeId: string, userId: string) {
    const result = await machineTradeRepository.toggleLike(tradeId, userId);
    if (result.liked && result.sellerId !== userId) {
      void notificationService.notify(
        result.sellerId,
        'trade_like',
        { ko: '중고거래 좋아요', en: 'Trade listing like' },
        {
          ko: '회원님의 중고거래 글에 좋아요가 눌렸습니다.',
          en: 'Someone liked your machine trade listing.',
        },
        { tradeId, type: 'trade_like' }
      );
    }
    return { liked: result.liked, likeCount: result.likeCount };
  },

  createReport(tradeId: string, reporterId: string, input: CreateTradeReportInput) {
    return machineTradeRepository.createReport(tradeId, reporterId, input);
  },

  listReports() {
    return machineTradeRepository.listReports();
  },

  listMyReports(sellerId: string) {
    return machineTradeRepository.listReports({ sellerId });
  },

  async resolveReport(reportId: string, adminId: string, input: ResolveTradeReportInput) {
    const report = await machineTradeRepository.resolveReport(reportId, adminId, input.status);
    void notificationService.notify(
      report.reporterId,
      'trade_report_result',
      { ko: '신고 처리 결과', en: 'Report result' },
      {
        ko: input.status === 'resolved' ? '신고가 처리되었습니다.' : '신고가 기각되었습니다.',
        en:
          input.status === 'resolved'
            ? 'Your report was resolved.'
            : 'Your report was dismissed.',
      },
      { reportId, status: input.status, type: 'trade_report_result' }
    );
    return report;
  },

  stats() {
    return machineTradeRepository.stats();
  },

  expireOverdue() {
    return machineTradeRepository.expireOverdue();
  },
};
