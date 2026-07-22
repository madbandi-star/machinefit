import sharp from 'sharp';
import { muscleGroupImageLimits } from '../config/muscle-group-image.js';
import { AppError } from '../middlewares/error.middleware.js';

export type ProcessedMuscleGroupImage = {
  main: {
    buffer: Buffer;
    mimeType: string;
    extension: string;
    width: number;
    height: number;
    fileSizeBytes: number;
  };
  thumbnail: {
    buffer: Buffer;
    mimeType: string;
    extension: string;
    width: number;
    height: number;
    fileSizeBytes: number;
  };
};

export async function processMuscleGroupImage(input: Buffer): Promise<ProcessedMuscleGroupImage> {
  const limits = muscleGroupImageLimits();
  try {
    const image = sharp(input, { failOn: 'none' }).rotate();
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

    const thumbBuffer = await sharp(input, { failOn: 'none' })
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
      main: {
        buffer: mainBuffer,
        mimeType: 'image/webp',
        extension: 'webp',
        width: mainMeta.width ?? limits.maxEdge,
        height: mainMeta.height ?? limits.maxEdge,
        fileSizeBytes: mainBuffer.byteLength,
      },
      thumbnail: {
        buffer: thumbBuffer,
        mimeType: 'image/webp',
        extension: 'webp',
        width: thumbMeta.width ?? limits.thumbEdge,
        height: thumbMeta.height ?? limits.thumbEdge,
        fileSizeBytes: thumbBuffer.byteLength,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'INVALID_IMAGE', 'Could not process the image file');
  }
}
