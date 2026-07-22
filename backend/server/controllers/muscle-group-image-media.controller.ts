import type { Request, Response, NextFunction } from 'express';
import { muscleGroupImageKeySchema } from '@machinefit/shared';
import { muscleGroupImageService } from '../services/muscle-group-image.service.js';

export async function serveMuscleGroupImage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedGroup = muscleGroupImageKeySchema.safeParse(req.params.muscleGroup);
    const kindRaw = String(req.params.kind || 'main').replace(/\.(webp|png|jpe?g)$/i, '');
    const kind = kindRaw === 'thumb' || kindRaw === 'thumbnail' ? 'thumb' : 'main';
    if (!parsedGroup.success) {
      res.status(404).end();
      return;
    }

    const blob = await muscleGroupImageService.getBlob(parsedGroup.data, kind);
    if (!blob) {
      next();
      return;
    }

    res.setHeader('Content-Type', blob.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"mgi-${parsedGroup.data}-${kind}-${blob.version}"`);
    res.status(200).send(blob.data);
  } catch (error) {
    next(error);
  }
}
