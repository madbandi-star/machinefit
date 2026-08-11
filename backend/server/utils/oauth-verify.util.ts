import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthProviderCode } from '@machinefit/shared';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';

export interface VerifiedOAuthIdentity {
  provider: AuthProviderCode;
  providerUserId: string;
  providerEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

async function verifyGoogleIdToken(
  idToken: string,
  nonce?: string
): Promise<VerifiedOAuthIdentity> {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError(503, 'OAUTH_NOT_CONFIGURED', 'Google login is not configured');
  }
  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
      ...(nonce ? { nonce } : {}),
    });
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub) {
      throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Google token missing subject');
    }
    return {
      provider: 'google',
      providerUserId: sub,
      providerEmail: typeof payload.email === 'string' ? payload.email : null,
      // Never map provider profile name → MachineFit username (privacy minimization).
      displayName: null,
      avatarUrl: typeof payload.picture === 'string' ? payload.picture : null,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Invalid Google ID token');
  }
}

/** GIS token client returns an access token — resolve identity via userinfo. */
async function verifyGoogleAccessToken(accessToken: string): Promise<VerifiedOAuthIdentity> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, 'OAUTH_NOT_CONFIGURED', 'Google login is not configured');
  }
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Invalid Google access token');
  }
  const data = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub) {
    throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Google profile missing subject');
  }
  return {
    provider: 'google',
    providerUserId: data.sub,
    providerEmail: data.email ?? null,
    displayName: null,
    avatarUrl: data.picture ?? null,
  };
}

async function verifyAppleIdToken(idToken: string, nonce?: string): Promise<VerifiedOAuthIdentity> {
  const clientId = env.APPLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError(503, 'OAUTH_NOT_CONFIGURED', 'Apple login is not configured');
  }
  if (!nonce) {
    throw new AppError(400, 'OAUTH_NONCE_REQUIRED', 'Apple login requires nonce');
  }
  const { createHash } = await import('node:crypto');
  const nonceSha256 = createHash('sha256').update(nonce).digest('hex');
  try {
    const { payload } = await jwtVerify(idToken, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: clientId,
      nonce,
    }).catch(async () =>
      jwtVerify(idToken, appleJwks, {
        issuer: 'https://appleid.apple.com',
        audience: clientId,
        nonce: nonceSha256,
      })
    );
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub) {
      throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Apple token missing subject');
    }
    return {
      provider: 'apple',
      providerUserId: sub,
      providerEmail: typeof payload.email === 'string' ? payload.email : null,
      displayName: null,
      avatarUrl: null,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Invalid Apple ID token');
  }
}

async function verifyKakaoAccessToken(accessToken: string): Promise<VerifiedOAuthIdentity> {
  if (!env.KAKAO_REST_API_KEY) {
    throw new AppError(503, 'OAUTH_NOT_CONFIGURED', 'Kakao login is not configured');
  }
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });
  if (!response.ok) {
    throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Invalid Kakao access token');
  }
  const data = (await response.json()) as {
    id?: number | string;
    kakao_account?: {
      email?: string;
      profile?: { nickname?: string; profile_image_url?: string };
    };
  };
  if (data.id == null) {
    throw new AppError(401, 'OAUTH_INVALID_TOKEN', 'Kakao profile missing id');
  }
  return {
    provider: 'kakao',
    providerUserId: String(data.id),
    providerEmail: data.kakao_account?.email ?? null,
    // Kakao nickname must not become MachineFit public username.
    displayName: null,
    avatarUrl: data.kakao_account?.profile?.profile_image_url ?? null,
  };
}

/** Exchange JS SDK authorize() code for an access token (REST API key as client_id). */
async function exchangeKakaoAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<string> {
  if (!env.KAKAO_REST_API_KEY) {
    throw new AppError(503, 'OAUTH_NOT_CONFIGURED', 'Kakao login is not configured');
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    code,
  });
  if (env.KAKAO_CLIENT_SECRET?.trim()) {
    body.set('client_secret', env.KAKAO_CLIENT_SECRET.trim());
  }
  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  const raw = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !raw.access_token) {
    const kakaoError = raw.error ?? '';
    const detail = [raw.error, raw.error_description, `redirect_uri=${redirectUri}`]
      .filter(Boolean)
      .join(' | ');
    // invalid_client = wrong REST key on server, or Client Secret required/mismatched.
    if (kakaoError === 'invalid_client') {
      throw new AppError(
        401,
        'OAUTH_INVALID_TOKEN',
        'Kakao client credentials invalid. Check Render KAKAO_REST_API_KEY (REST key, not JS key) and Client Secret.'
      );
    }
    throw new AppError(
      401,
      'OAUTH_INVALID_TOKEN',
      detail || 'Failed to exchange Kakao authorization code'
    );
  }
  return raw.access_token;
}

export async function verifyOAuthCredential(
  provider: AuthProviderCode,
  input: {
    idToken?: string;
    accessToken?: string;
    authorizationCode?: string;
    redirectUri?: string;
    nonce?: string;
  }
): Promise<VerifiedOAuthIdentity> {
  if (provider === 'google') {
    if (input.idToken) return verifyGoogleIdToken(input.idToken, input.nonce);
    if (input.accessToken) return verifyGoogleAccessToken(input.accessToken);
    throw new AppError(400, 'OAUTH_TOKEN_REQUIRED', 'Google login requires idToken or accessToken');
  }
  if (provider === 'apple') {
    if (!input.idToken) {
      throw new AppError(400, 'OAUTH_TOKEN_REQUIRED', 'Apple login requires idToken');
    }
    return verifyAppleIdToken(input.idToken, input.nonce);
  }
  let accessToken = input.accessToken;
  if (!accessToken && input.authorizationCode) {
    if (!input.redirectUri) {
      throw new AppError(400, 'OAUTH_TOKEN_REQUIRED', 'Kakao code exchange requires redirectUri');
    }
    accessToken = await exchangeKakaoAuthorizationCode(input.authorizationCode, input.redirectUri);
  }
  if (!accessToken) {
    throw new AppError(
      400,
      'OAUTH_TOKEN_REQUIRED',
      'Kakao login requires accessToken or authorizationCode'
    );
  }
  return verifyKakaoAccessToken(accessToken);
}
