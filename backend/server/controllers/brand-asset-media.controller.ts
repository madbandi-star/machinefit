import type { Request, Response, NextFunction } from 'express';
import { brandAssetRepository, type BrandAssetKind } from '../repositories/brand-asset.repository.js';

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

    const blob = await brandAssetRepository.getBlob(brandCode, kind);
    if (!blob) {
      res.status(404).end();
      return;
    }

    res.setHeader('Content-Type', blob.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"ba-${brandCode}-${kind}-${blob.version}"`);
    res.status(200).send(blob.data);
  } catch (error) {
    next(error);
  }
}
