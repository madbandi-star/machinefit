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

type ImageMeta = { width?: number; height?: number };

function toProcessedResult(
  mainBuffer: Buffer,
  thumbBuffer: Buffer,
  mainMeta: ImageMeta,
  thumbMeta: ImageMeta,
  limits: { maxEdge: number; thumbEdge: number }
): ProcessedMuscleGroupImage {
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
}

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

    return toProcessedResult(mainBuffer, thumbBuffer, mainMeta, thumbMeta, limits);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'INVALID_IMAGE', 'Could not process the image file');
  }
}

/**
 * Machine covers: always emit a sharp 1:1 canvas matching Hammer Strength (maxEdge×maxEdge).
 * Centre-cover crop + Lanczos upscale with light restore so landscape FW photos fill the frame.
 */
export async function processMachineCoverSquareImage(
  input: Buffer
): Promise<ProcessedMuscleGroupImage> {
  const limits = muscleGroupImageLimits();
  try {
    const rotated = await sharp(input, { failOn: 'none' }).rotate().toBuffer();
    const meta = await sharp(rotated).metadata();
    if (!meta.width || !meta.height) {
      throw new AppError(400, 'INVALID_IMAGE', 'Could not read image dimensions');
    }

    const coverScale = Math.max(limits.maxEdge / meta.width, limits.maxEdge / meta.height);
    let working = rotated;
    if (coverScale > 2.2) {
      working = await sharp(rotated)
        .resize(Math.round(meta.width * 2), Math.round(meta.height * 2), {
          kernel: sharp.kernel.lanczos3,
        })
        .toBuffer();
    }

    const mainBuffer = await sharp(working)
      .resize(limits.maxEdge, limits.maxEdge, {
        fit: 'cover',
        position: 'centre',
        kernel: sharp.kernel.lanczos3,
      })
      .median(3)
      .sharpen({ sigma: 1.05, m1: 0.7, m2: 0.4 })
      .modulate({ brightness: 1.02, saturation: 1.03 })
      .webp({ quality: 92, effort: 6 })
      .toBuffer();
    const mainMeta = await sharp(mainBuffer).metadata();

    const thumbBuffer = await sharp(mainBuffer)
      .resize(limits.thumbEdge, limits.thumbEdge, {
        fit: 'cover',
        position: 'centre',
        kernel: sharp.kernel.lanczos3,
      })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();
    const thumbMeta = await sharp(thumbBuffer).metadata();

    return toProcessedResult(mainBuffer, thumbBuffer, mainMeta, thumbMeta, limits);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'INVALID_IMAGE', 'Could not process the image file');
  }
}
