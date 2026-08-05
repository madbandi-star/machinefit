import type { Request, Response } from 'express';

/** Serve immutable media with ETag / 304 — avoids re-sending BYTEA bodies. */
export function sendImmutableMedia(
  req: Request,
  res: Response,
  opts: { etag: string; mimeType: string; data: Buffer }
): void {
  const { etag, mimeType, data } = opts;
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);

  const inm = req.headers['if-none-match'];
  if (typeof inm === 'string' && inm === etag) {
    res.status(304).end();
    return;
  }

  res.setHeader('Content-Type', mimeType);
  res.status(200).send(data);
}
