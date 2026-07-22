import multer from 'multer';
import type { RequestHandler } from 'express';
import { motivationAudioLimits } from '../config/motivation-audio.js';
import { muscleGroupImageLimits } from '../config/muscle-group-image.js';
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
