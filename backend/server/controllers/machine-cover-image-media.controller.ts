import type { Request, Response, NextFunction } from 'express';
import { TARGET_MUSCLE_GROUPS } from '@machinefit/shared';
import { machineCoverImageService } from '../services/machine-cover-image.service.js';
import { sendImmutableMedia } from '../utils/media-response.js';

const MUSCLE_SET = new Set<string>(TARGET_MUSCLE_GROUPS);

function normalizeKind(raw: string): 'main' | 'thumb' | null {
  const kind = raw.replace(/\.(webp|png|jpe?g)$/i, '').toLowerCase();
  if (kind === 'main') return 'main';
  if (kind === 'thumb' || kind === 'thumbnail') return 'thumb';
  return null;
}

export async function serveMachineCoverImage(req: Request, res: Response, next: NextFunction) {
  try {
    const machineCode = String(req.params.machineCode || '').trim();
    const second = String(req.params.targetMuscleOrKind || '').trim();
    const third = String(req.params.kind || '').trim();
    if (!machineCode || !second) {
      res.status(404).end();
      return;
    }

    let targetMuscle: string | null = null;
    let kind: 'main' | 'thumb' | null = null;

    if (third) {
      if (!MUSCLE_SET.has(second)) {
        res.status(404).end();
        return;
      }
      targetMuscle = second;
      kind = normalizeKind(third);
    } else {
      kind = normalizeKind(second);
    }

    if (!kind) {
      res.status(404).end();
      return;
    }

    const blob = await machineCoverImageService.getBlob(machineCode, kind, targetMuscle);
    if (!blob) {
      res.status(404).end();
      return;
    }

    const etagMuscle = targetMuscle ? `-${targetMuscle}` : '';
    sendImmutableMedia(req, res, {
      etag: `"mci-${machineCode}${etagMuscle}-${kind}-${blob.version}"`,
      mimeType: blob.mimeType,
      data: blob.data,
    });
  } catch (error) {
    next(error);
  }
}
