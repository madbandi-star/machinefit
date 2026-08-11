import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';

export type MediaTokenKind = 'photo' | 'trade' | 'request' | 'audio';

const TTL_SEC = 6 * 60 * 60;

function hmac(payload: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(payload).digest('hex');
}

export function signMediaAccess(
  kind: MediaTokenKind,
  imageId: string,
  ttlSec = TTL_SEC
): { exp: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = hmac(`${kind}:${imageId}:${exp}`);
  return { exp, sig };
}

export function mediaAccessQuery(kind: MediaTokenKind, imageId: string): string {
  const { exp, sig } = signMediaAccess(kind, imageId);
  return `mexp=${exp}&msig=${sig}`;
}

export function assertMediaAccess(
  kind: MediaTokenKind,
  imageId: string,
  mexp: unknown,
  msig: unknown
): void {
  const expRaw = typeof mexp === 'string' ? mexp : '';
  const sig = typeof msig === 'string' ? msig : '';
  const exp = Number(expRaw);
  if (!expRaw || !sig || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Media link expired or missing');
  }
  const expected = hmac(`${kind}:${imageId}:${exp}`);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(sig, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Media link invalid');
  }
}
