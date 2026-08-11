import multer from 'multer';
import type { RequestHandler } from 'express';
import { motivationAudioLimits } from '../config/motivation-audio.js';
import { muscleGroupImageLimits } from '../config/muscle-group-image.js';
import { machineTradeImageLimits } from '../config/machine-trade-image.js';
import { machineRequestImageLimits } from '../config/machine-request-image.js';
import { photoBoardImageLimits } from '../config/photo-board-image.js';
import {
  BACKUP_MAX_UPLOAD_BYTES,
  BANNER_MAX_IMAGE_BYTES,
  NOTICE_MAX_ATTACHMENT_BYTES,
} from '@machinefit/shared';
import { AppError } from './error.middleware.js';

function makeUpload(maxBytes: number): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: 1,
    },
  });

  return (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(
            new AppError(
              400,
              'FILE_TOO_LARGE',
              `File is too large. Max size is ${Math.round(maxBytes / (1024 * 1024))}MB.`
            )
          );
          return;
        }
        next(new AppError(400, 'UPLOAD_FAILED', err.message, err.code));
        return;
      }

      next(err instanceof Error ? err : new AppError(500, 'UPLOAD_FAILED', 'Upload failed'));
    });
  };
}

export const motivationAudioUpload: RequestHandler = makeUpload(motivationAudioLimits().maxBytes);
export const muscleGroupImageUpload: RequestHandler = makeUpload(muscleGroupImageLimits().maxBytes);

function makeMultiUpload(maxBytes: number, maxCount: number): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
      files: maxCount,
    },
  });

  return (req, res, next) => {
    upload.array('images', maxCount)(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(
            new AppError(
              400,
              'FILE_TOO_LARGE',
              `File is too large. Max size is ${Math.round(maxBytes / (1024 * 1024))}MB.`
            )
          );
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          next(new AppError(400, 'TOO_MANY_FILES', `You can upload up to ${maxCount} images.`));
          return;
        }
        next(new AppError(400, 'UPLOAD_FAILED', err.message, err.code));
        return;
      }

      next(err instanceof Error ? err : new AppError(500, 'UPLOAD_FAILED', 'Upload failed'));
    });
  };
}

export const photoBoardImagesUpload: RequestHandler = makeMultiUpload(
  photoBoardImageLimits().maxBytes,
  photoBoardImageLimits().maxCount
);

export const machineTradeImagesUpload: RequestHandler = makeMultiUpload(
  machineTradeImageLimits().maxBytes,
  machineTradeImageLimits().maxCount
);

export const machineRequestImagesUpload: RequestHandler = makeMultiUpload(
  machineRequestImageLimits().maxBytes,
  Math.min(machineRequestImageLimits().maxCount, 5)
);

export const noticeAttachmentUpload: RequestHandler = makeUpload(NOTICE_MAX_ATTACHMENT_BYTES);
export const bannerImageUpload: RequestHandler = makeUpload(BANNER_MAX_IMAGE_BYTES);
export const backupUpload: RequestHandler = makeUpload(BACKUP_MAX_UPLOAD_BYTES);
