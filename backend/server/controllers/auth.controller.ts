import type { Request, Response } from 'express';
import {
  marketingPrefSchema,
  oauthCredentialSchema,
  oauthCompleteSchema,
  consentAcceptSchema,
  authProviderCodeSchema,
  isAuthProviderCode,
  type OAuthLoginResult,
} from '@machinefit/shared';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middlewares/error.middleware.js';
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

function requireRefreshToken(
  tokens: { accessToken: string; refreshToken?: string; expiresIn: string }
): { accessToken: string; refreshToken: string; expiresIn: string } {
  if (!tokens.refreshToken) {
    throw new AppError(500, 'INTERNAL', 'Refresh token missing');
  }
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

function sendOAuthResult(res: Response, result: OAuthLoginResult): void {
  if (result.status === 'authenticated') {
    sendAuthResult(res, 200, {
      user: result.user,
      tokens: requireRefreshToken(result.tokens),
    });
    return;
  }
  if (result.reason === 'version_update') {
    const tokens = requireRefreshToken(result.tokens);
    setRefreshCookie(res, tokens.refreshToken);
    res.status(200).json({
      success: true,
      data: {
        status: result.status,
        reason: result.reason,
        user: result.user,
        tokens: publicAuthTokens(tokens),
        versions: result.versions,
      },
    });
    return;
  }
  res.status(200).json({
    success: true,
    data: {
      status: result.status,
      reason: result.reason,
      pendingToken: result.pendingToken,
      identity: result.identity,
      versions: result.versions,
    },
  });
}

export async function oauthLogin(req: Request, res: Response): Promise<void> {
  const providerParam = String(req.params.provider ?? '');
  if (!isAuthProviderCode(providerParam)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Unsupported OAuth provider');
  }
  const credential = oauthCredentialSchema.parse(req.body);
  const result = await authService.loginWithOAuth(providerParam, credential);
  sendOAuthResult(res, result);
}

export async function completeOAuthSignup(req: Request, res: Response): Promise<void> {
  const input = oauthCompleteSchema.parse(req.body);
  const result = await authService.completeOAuthSignup(input);
  sendAuthResult(res, 201, result);
}

export async function acceptConsents(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const input = consentAcceptSchema.parse(req.body);
  const result = await authService.acceptConsents(req.user.userId, input);
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

export async function listProviders(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const data = await authService.listProviders(req.user.userId);
  res.json({ success: true, data });
}

export async function connectProvider(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const provider = authProviderCodeSchema.parse(req.params.provider);
  const credential = oauthCredentialSchema.parse(req.body);
  const data = await authService.connectProvider(req.user.userId, provider, credential);
  res.json({ success: true, data });
}

export async function disconnectProvider(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const provider = authProviderCodeSchema.parse(req.params.provider);
  const data = await authService.disconnectProvider(req.user.userId, provider);
  res.json({ success: true, data });
}
