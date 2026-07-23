import type { Request, Response, NextFunction } from 'express';
import { machineCoverImageService } from '../services/machine-cover-image.service.js';

export async function serveMachineCoverImage(req: Request, res: Response, next: NextFunction) {
  try {
    const machineCode = String(req.params.machineCode || '').trim();
    const kindRaw = String(req.params.kind || 'main').replace(/\.(webp|png|jpe?g)$/i, '');
    const kind = kindRaw === 'thumb' || kindRaw === 'thumbnail' ? 'thumb' : 'main';
    if (!machineCode) {
      res.status(404).end();
      return;
    }

    const blob = await machineCoverImageService.getBlob(machineCode, kind);
    if (!blob) {
      res.status(404).end();
      return;
    }

    res.setHeader('Content-Type', blob.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"mci-${machineCode}-${kind}-${blob.version}"`);
    res.status(200).send(blob.data);
  } catch (error) {
    next(error);
  }
}
