import type { Request, Response, NextFunction } from 'express';
import { brandAssetRepository, type BrandAssetKind } from '../repositories/brand-asset.repository.js';
import { sendImmutableMedia, trySendNotModified } from '../utils/media-response.js';

function parseKind(raw: string): BrandAssetKind | null {
  const kind = String(raw || '')
    .replace(/\.(webp|png|jpe?g)$/i, '')
    .toLowerCase();
  if (kind === 'logo') return 'logo';
  if (kind === 'hero' || kind === 'image' || kind === 'main') return 'hero';
  return null;
}

export async function serveBrandAssetImage(req: Request, res: Response, next: NextFunction) {
  try {
    const brandCode = String(req.params.brandCode || '').trim().toUpperCase();
    const kind = parseKind(String(req.params.kind || ''));
    if (!brandCode || !kind) {
      res.status(404).end();
      return;
    }

    // Version-only probe first — skip BYTEA on If-None-Match hit (1k concurrent media).
    const meta = await brandAssetRepository.getBlobMeta(brandCode, kind);
    if (!meta) {
      res.status(404).end();
      return;
    }
    const etag = `"ba-${brandCode}-${kind}-${meta.version}"`;
    if (trySendNotModified(req, res, etag)) return;

    const blob = await brandAssetRepository.getBlob(brandCode, kind);
    if (!blob) {
      res.status(404).end();
      return;
    }

    sendImmutableMedia(req, res, {
      etag: `"ba-${brandCode}-${kind}-${blob.version}"`,
      mimeType: blob.mimeType,
      data: blob.data,
    });
  } catch (error) {
    next(error);
  }
}
