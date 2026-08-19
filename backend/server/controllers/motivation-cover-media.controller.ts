import type { Request, Response, NextFunction } from 'express';
import {
  motivationCoverPublicUrl,
  storageService,
} from '../services/storage.service.js';
import { isDirectObjectUrl, redirectToObjectUrl } from '../utils/media-cdn.js';
import { UGC_MEDIA_CACHE } from '../utils/media-response.js';

/**
 * Motivation cover images. Prefer Storage public URL redirect; stream only as fallback.
 * Mounted at /api/v1/media/motivation-covers — req.path is the storage path remainder.
 */
export async function serveMotivationCover(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.status(405).end();
      return;
    }

    const raw = String(req.path || '')
      .replace(/^\/+/, '')
      .trim();
    if (!raw || raw.includes('..')) {
      res.status(404).end();
      return;
    }

    const storagePath = raw
      .split('/')
      .map((part) => {
        try {
          return decodeURIComponent(part);
        } catch {
          return part;
        }
      })
      .filter(Boolean)
      .join('/');

    if (!storagePath) {
      res.status(404).end();
      return;
    }

    const publicUrl = motivationCoverPublicUrl(storagePath);
    if (isDirectObjectUrl(publicUrl) && redirectToObjectUrl(res, publicUrl, UGC_MEDIA_CACHE)) {
      return;
    }

    const file = await storageService.readMotivationCoverImage(storagePath);
    if (!file) {
      res.status(404).end();
      return;
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.buffer.length));
    res.setHeader('Cache-Control', UGC_MEDIA_CACHE);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }
    res.status(200).end(file.buffer);
  } catch (error) {
    next(error);
  }
}
