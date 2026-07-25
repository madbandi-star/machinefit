import type { Request } from 'express';

export function getRequestIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return req.socket.remoteAddress ?? null;
}

export function getRequestUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 500) : null;
}
