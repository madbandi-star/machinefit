import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { AuthProviderCode } from '@machinefit/shared';
import { jwtConfig } from '../config/jwt.js';
import type { AuthPayload } from '../middlewares/auth.middleware.js';

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: Pick<AuthPayload, 'userId'>): string {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): Pick<AuthPayload, 'userId'> {
  return jwt.verify(token, jwtConfig.refreshSecret) as Pick<AuthPayload, 'userId'>;
}

/** Short-lived OAuth signup staging token (not a session). */
export interface OAuthPendingPayload {
  typ: 'oauth_pending';
  /** One-time id — must be consumed on /auth/oauth/complete. */
  jti: string;
  provider: AuthProviderCode;
  providerUserId: string;
  /** Always unused — MachineFit does not collect OAuth emails. */
  providerEmail?: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export function signOAuthPendingToken(
  payload: Omit<OAuthPendingPayload, 'typ' | 'jti'> & { jti?: string }
): { token: string; jti: string; expiresAt: Date } {
  const jti = payload.jti ?? randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const token = jwt.sign(
    {
      ...payload,
      jti,
      typ: 'oauth_pending' satisfies OAuthPendingPayload['typ'],
    },
    jwtConfig.secret,
    { expiresIn: '15m' }
  );
  return { token, jti, expiresAt };
}

export function verifyOAuthPendingToken(token: string): OAuthPendingPayload {
  const decoded = jwt.verify(token, jwtConfig.secret) as OAuthPendingPayload;
  if (!decoded || decoded.typ !== 'oauth_pending' || !decoded.jti) {
    throw new Error('Invalid OAuth pending token');
  }
  return decoded;
}
