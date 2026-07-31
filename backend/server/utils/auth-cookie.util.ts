import type { Request, Response } from 'express';
import { env } from '../config/env.js';

/** HttpOnly refresh cookie — readable only by the API host, never by SPA JS. */
export const REFRESH_COOKIE_NAME = 'mf_rt';

function refreshCookieMaxAgeSec(): number {
  const raw = env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = /^(\d+)([dhms])$/i.exec(raw.trim());
  const amount = match ? Number(match[1]) : 7;
  const unit = (match?.[2] ?? 'd').toLowerCase();
  if (unit === 'd') return amount * 86_400;
  if (unit === 'h') return amount * 3_600;
  if (unit === 'm') return amount * 60;
  return amount;
}

function useCrossSiteCookie(): boolean {
  // GitHub Pages → Render is cross-site; requires SameSite=None; Secure.
  return env.NODE_ENV === 'production';
}

function cookiePath(): string {
  return `${env.API_BASE_PATH.replace(/\/+$/, '')}/auth`;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(raw);
    } catch {
      out[key] = raw;
    }
  }
  return out;
}

export function getRefreshCookie(req: Request): string | undefined {
  const value = parseCookies(req.headers.cookie)[REFRESH_COOKIE_NAME];
  return value || undefined;
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  const maxAge = refreshCookieMaxAgeSec();
  const parts = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`,
    `Path=${cookiePath()}`,
    `Max-Age=${maxAge}`,
    'HttpOnly',
  ];
  if (useCrossSiteCookie()) {
    parts.push('Secure', 'SameSite=None');
  } else {
    parts.push('SameSite=Lax');
  }
  res.append('Set-Cookie', parts.join('; '));
}

export function clearRefreshCookie(res: Response): void {
  const parts = [
    `${REFRESH_COOKIE_NAME}=`,
    `Path=${cookiePath()}`,
    'Max-Age=0',
    'HttpOnly',
  ];
  if (useCrossSiteCookie()) {
    parts.push('Secure', 'SameSite=None');
  } else {
    parts.push('SameSite=Lax');
  }
  res.append('Set-Cookie', parts.join('; '));
}

/**
 * SPA auth payload. Refresh is also set as HttpOnly cookie when the browser
 * accepts third-party cookies; body refreshToken is the reliable fallback for
 * GitHub Pages → Render (cross-site) where the cookie is often blocked.
 */
export function publicAuthTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}): { accessToken: string; refreshToken: string; expiresIn: string } {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}
