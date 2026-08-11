import type { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service.js';
import { UGC_MEDIA_CACHE } from '../utils/media-response.js';

/**
 * Stream uploaded motivation audio via the API (local disk or Supabase service role).
 * Mounted at /api/v1/media/motivation-audio — req.path is the storage path remainder.
 */
export async function serveMotivationAudio(req: Request, res: Response, next: NextFunction) {
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

    const { assertMediaAccess } = await import('../utils/media-token.util.js');
    assertMediaAccess('audio', storagePath, req.query.mexp, req.query.msig);

    const file = await storageService.readMotivationAudio(storagePath);
    if (!file) {
      // Help diagnose missing Storage config / wiped ephemeral uploads.
      res.status(404).json({
        success: false,
        error: {
          code: 'AUDIO_NOT_FOUND',
          message:
            'Audio file not found. Re-upload after configuring SUPABASE_SERVICE_ROLE_KEY on the API.',
        },
      });
      return;
    }

    const { buffer, mimeType } = file;
    const total = buffer.length;
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', UGC_MEDIA_CACHE);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const rangeHeader = req.headers.range;
    if (typeof rangeHeader === 'string' && rangeHeader.startsWith('bytes=')) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : total - 1;
        if (
          Number.isFinite(start) &&
          Number.isFinite(end) &&
          start >= 0 &&
          end >= start &&
          start < total
        ) {
          const safeEnd = Math.min(end, total - 1);
          const chunk = buffer.subarray(start, safeEnd + 1);
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${safeEnd}/${total}`);
          res.setHeader('Content-Length', String(chunk.length));
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          res.end(chunk);
          return;
        }
      }
    }

    res.setHeader('Content-Length', String(total));
    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }
    res.status(200).end(buffer);
  } catch (error) {
    next(error);
  }
}
