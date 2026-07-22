import multer from 'multer';
import type { RequestHandler } from 'express';
import { motivationAudioLimits } from '../config/motivation-audio.js';
import { AppError } from './error.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: motivationAudioLimits().maxBytes,
    files: 1,
  },
});

export const motivationAudioUpload: RequestHandler = (req, res, next) => {
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
            `File is too large. Max size is ${Math.round(motivationAudioLimits().maxBytes / (1024 * 1024))}MB.`
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
