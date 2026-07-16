import jwt from 'jsonwebtoken';
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
