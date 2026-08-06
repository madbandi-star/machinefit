import type { NextFunction, Request, Response } from 'express';
import { storageService } from '../services/storage.service.js';

function mimeFromPath(storagePath: string): string {
  const ext = storagePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'pdf':
      return 'application/pdf';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

export async function serveNoticeAttachment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parts = req.path.split('/').filter(Boolean);
    const storagePath = parts.map(decodeURIComponent).join('/');
    if (!storagePath || storagePath.includes('..')) {
      res.status(400).end();
      return;
    }
    const file = await storageService.readNoticeAttachment(storagePath);
    if (!file) {
      res.status(404).end();
      return;
    }
    res.setHeader('Content-Type', file.mimeType || mimeFromPath(storagePath));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(file.buffer);
  } catch (error) {
    next(error);
  }
}
