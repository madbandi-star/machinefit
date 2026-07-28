import type { Request, Response } from 'express';
import { registerSchema, loginSchema, marketingPrefSchema } from '@machinefit/shared';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getRequestIp, getRequestUserAgent } from '../utils/request-meta.util.js';
import {
  clearRefreshCookie,
  getRefreshCookie,
  publicAuthTokens,
  setRefreshCookie,
} from '../utils/auth-cookie.util.js';

function sendAuthResult(
  res: Response,
  status: number,
  result: { user: unknown; tokens: { accessToken: string; refreshToken: string; expiresIn: string } }
): void {
  setRefreshCookie(res, result.tokens.refreshToken);
  res.status(status).json({
    success: true,
    data: {
      user: result.user,
      tokens: publicAuthTokens(result.tokens),
    },
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  sendAuthResult(res, 201, result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input, {
    ipAddress: getRequestIp(req),
    userAgent: getRequestUserAgent(req),
  });
  sendAuthResult(res, 200, result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const fromCookie = getRefreshCookie(req);
  const fromBody =
    req.body && typeof req.body === 'object' && typeof req.body.refreshToken === 'string'
      ? (req.body.refreshToken as string)
      : undefined;
  const refreshToken = fromCookie || fromBody;
  if (!refreshToken) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Refresh token required');
  }
  const result = await authService.refresh(refreshToken);
  setRefreshCookie(res, result.tokens.refreshToken);
  res.json({
    success: true,
    data: { tokens: publicAuthTokens(result.tokens) },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const cookieToken = getRefreshCookie(req);
  if (req.user) {
    await authService.logout(req.user.userId);
  } else if (cookieToken) {
    await authService.logoutByRefreshToken(cookieToken);
  }
  clearRefreshCookie(res);
  res.json({ success: true, data: { message: 'Logged out' } });
}

export async function deactivateAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const data = await authService.deactivateAccount(req.user.userId);
  await authService.logout(req.user.userId);
  clearRefreshCookie(res);
  res.json({ success: true, data });
}

export async function updateMarketingPref(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const input = marketingPrefSchema.parse(req.body);
  const data = await authService.setMarketingOptIn(req.user.userId, input.marketingOptIn);
  res.json({ success: true, data });
}
