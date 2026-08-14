import {
  generateOAuthCsrfToken,
  oauthCsrfMatches,
  type AuthProviderCode,
} from '@machinefit/shared';
import { API_BASE_URL } from '@/config/apiBase';

const KAKAO_OAUTH_INTENT_KEY = 'mf_kakao_oauth_intent';
const KAKAO_OAUTH_REDIRECT_KEY = 'mf_kakao_oauth_redirect';
const KAKAO_OAUTH_STATE_KEY = 'mf_kakao_oauth_state';
const APPLE_OAUTH_NONCE_KEY = 'mf_apple_oauth_nonce';

/** Prevents double exchange when AuthLanding remounts (layout chrome swap / StrictMode). */
const consumedKakaoCodes = new Set<string>();

export type OAuthClientPublicConfig = {
  googleClientId: string | null;
  kakaoJsKey: string | null;
  appleClientId: string | null;
  appleRedirectUri: string | null;
};

let oauthClientConfigCache: OAuthClientPublicConfig | null = null;
let oauthClientConfigInflight: Promise<OAuthClientPublicConfig> | null = null;

/**
 * Local-dev override only. Production builds must not embed these (use server env).
 */
function viteOAuthFallback(): OAuthClientPublicConfig {
  return {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || null,
    kakaoJsKey: import.meta.env.VITE_KAKAO_JS_KEY?.trim() || null,
    appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID?.trim() || null,
    appleRedirectUri: import.meta.env.VITE_APPLE_REDIRECT_URI?.trim() || null,
  };
}

function mergeOAuthConfig(
  fromApi: Partial<OAuthClientPublicConfig> | null,
  fallback: OAuthClientPublicConfig
): OAuthClientPublicConfig {
  return {
    googleClientId: fromApi?.googleClientId?.trim() || fallback.googleClientId,
    kakaoJsKey: fromApi?.kakaoJsKey?.trim() || fallback.kakaoJsKey,
    appleClientId: fromApi?.appleClientId?.trim() || fallback.appleClientId,
    appleRedirectUri: fromApi?.appleRedirectUri?.trim() || fallback.appleRedirectUri,
  };
}

/** Prefetch / refresh OAuth client ids from the API (cached ~process lifetime). */
export async function getOAuthClientConfig(options?: {
  force?: boolean;
}): Promise<OAuthClientPublicConfig> {
  if (!options?.force && oauthClientConfigCache) return oauthClientConfigCache;
  if (!options?.force && oauthClientConfigInflight) return oauthClientConfigInflight;

  oauthClientConfigInflight = (async () => {
    const fallback = viteOAuthFallback();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/oauth/client-config`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        oauthClientConfigCache = fallback;
        return fallback;
      }
      const body = (await res.json()) as {
        success?: boolean;
        data?: Partial<OAuthClientPublicConfig>;
      };
      const merged = mergeOAuthConfig(body?.data ?? null, fallback);
      oauthClientConfigCache = merged;
      return merged;
    } catch {
      oauthClientConfigCache = fallback;
      return fallback;
    } finally {
      oauthClientConfigInflight = null;
    }
  })();

  return oauthClientConfigInflight;
}

export function peekOAuthClientConfig(): OAuthClientPublicConfig | null {
  return oauthClientConfigCache;
}

/** Drop cached client config after key rotation / logout. */
export function clearOAuthClientConfigCache(): void {
  oauthClientConfigCache = null;
  oauthClientConfigInflight = null;
}

function loadScript(src: string, id: string): Promise<void> {
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('SCRIPT_LOAD_FAILED')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('SCRIPT_LOAD_FAILED'));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (override?: { prompt?: string }) => void };
        };
      };
    };
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Auth: {
        /** Current JS SDK — redirects to Kakao then back with ?code= */
        authorize: (options: { redirectUri: string; scope?: string; state?: string }) => void;
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
          nonce?: string;
        }) => void;
        signIn: () => Promise<{
          authorization?: { id_token?: string; code?: string };
          user?: { name?: { firstName?: string; lastName?: string } };
        }>;
      };
    };
  }
}

export class OAuthClientError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_CONFIGURED'
      | 'CANCELLED'
      | 'SCRIPT_LOAD_FAILED'
      | 'TOKEN_MISSING'
      | 'STATE_MISMATCH'
      | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'OAuthClientError';
  }
}

export type OAuthCredentialPayload = {
  idToken?: string;
  accessToken?: string;
  authorizationCode?: string;
  redirectUri?: string;
  displayName?: string;
  nonce?: string;
};

export async function isOAuthProviderConfigured(provider: AuthProviderCode): Promise<boolean> {
  const cfg = await getOAuthClientConfig();
  if (provider === 'google') return Boolean(cfg.googleClientId);
  if (provider === 'kakao') return Boolean(cfg.kakaoJsKey);
  return Boolean(cfg.appleClientId);
}

/** Absolute redirect URI for Kakao.Auth.authorize — must match Kakao Developers exactly. */
export function getKakaoRedirectUri(path?: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  if (!path || path === '/') {
    // App root, e.g. https://madbandi-star.github.io/machinefit/
    return `${window.location.origin}${normalizedBase}`;
  }
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${window.location.origin}${normalizedBase}${normalizedPath}`;
}

export type KakaoOAuthIntent = 'login' | 'connect';

export function beginKakaoAuthorize(intent: KakaoOAuthIntent = 'login'): Promise<never> {
  return requestKakaoAuthorize(intent);
}

/**
 * Google / Apple return credentials in-page.
 * Kakao redirects away via authorize(); callers should not await a token.
 */
export async function requestOAuthCredential(
  provider: AuthProviderCode
): Promise<OAuthCredentialPayload> {
  if (provider === 'google') return requestGoogleAccessToken();
  if (provider === 'kakao') {
    await requestKakaoAuthorize('login');
    throw new OAuthClientError('Kakao redirect started', 'UNKNOWN');
  }
  return requestAppleIdToken();
}

export type KakaoConsumeResult =
  | { ok: true; code: string; redirectUri: string; intent: KakaoOAuthIntent }
  | { ok: false; reason: 'none' | 'error' | 'state_mismatch' | 'replay' };

/** Read ?code= after Kakao redirect; clears the query from the address bar. */
export function consumeKakaoAuthorizationCode(): KakaoConsumeResult {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  const returnedState = params.get('state');
  const intentRaw = sessionStorage.getItem(KAKAO_OAUTH_INTENT_KEY);
  const redirectUri = sessionStorage.getItem(KAKAO_OAUTH_REDIRECT_KEY);
  const expectedState = sessionStorage.getItem(KAKAO_OAUTH_STATE_KEY);

  const stripOauthParams = () => {
    params.delete('code');
    params.delete('error');
    params.delete('error_description');
    params.delete('state');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
  };

  const clearStaging = () => {
    sessionStorage.removeItem(KAKAO_OAUTH_INTENT_KEY);
    sessionStorage.removeItem(KAKAO_OAUTH_REDIRECT_KEY);
    sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY);
  };

  // Always scrub leftover OAuth query params — even without intent — so refresh/back
  // doesn't keep a sticky ?code= that remounts/handlers keep noticing.
  if (!intentRaw || !redirectUri) {
    if (code || error) stripOauthParams();
    return { ok: false, reason: 'none' };
  }

  if (error) {
    clearStaging();
    stripOauthParams();
    return { ok: false, reason: 'error' };
  }

  if (!code) return { ok: false, reason: 'none' };

  if (!oauthCsrfMatches(expectedState, returnedState)) {
    clearStaging();
    stripOauthParams();
    return { ok: false, reason: 'state_mismatch' };
  }

  // Same authorization code must only be exchanged once (layout remounts / StrictMode).
  if (consumedKakaoCodes.has(code)) {
    clearStaging();
    stripOauthParams();
    return { ok: false, reason: 'replay' };
  }
  consumedKakaoCodes.add(code);

  clearStaging();
  stripOauthParams();

  return {
    ok: true,
    code,
    redirectUri,
    intent: intentRaw === 'connect' ? 'connect' : 'login',
  };
}

/** Clear Kakao OAuth staging keys (call on logout). */
export function clearKakaoOAuthStaging(): void {
  sessionStorage.removeItem(KAKAO_OAUTH_INTENT_KEY);
  sessionStorage.removeItem(KAKAO_OAUTH_REDIRECT_KEY);
  sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY);
  sessionStorage.removeItem(APPLE_OAUTH_NONCE_KEY);
}

async function ensureKakaoSdk(): Promise<void> {
  const { kakaoJsKey: jsKey } = await getOAuthClientConfig();
  if (!jsKey) throw new OAuthClientError('Kakao JS key missing', 'NOT_CONFIGURED');

  await loadScript('https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js', 'mf-kakao-sdk');
  if (!window.Kakao) {
    throw new OAuthClientError('Kakao SDK unavailable', 'SCRIPT_LOAD_FAILED');
  }
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(jsKey);
  }
}

async function requestKakaoAuthorize(intent: KakaoOAuthIntent): Promise<never> {
  await ensureKakaoSdk();
  if (!window.Kakao?.Auth?.authorize) {
    throw new OAuthClientError('Kakao authorize unavailable', 'SCRIPT_LOAD_FAILED');
  }

  const redirectUri =
    intent === 'connect'
      ? getKakaoRedirectUri('/settings/linked-logins')
      : getKakaoRedirectUri('/');
  const state = generateOAuthCsrfToken();
  sessionStorage.setItem(KAKAO_OAUTH_INTENT_KEY, intent);
  sessionStorage.setItem(KAKAO_OAUTH_REDIRECT_KEY, redirectUri);
  sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state);

  // Nickname only — email requires Biz app permission.
  window.Kakao.Auth.authorize({
    redirectUri,
    scope: 'profile_nickname',
    state,
  });

  // Page navigates away; keep the promise pending.
  return new Promise(() => undefined);
}

async function requestGoogleAccessToken(): Promise<{ accessToken: string }> {
  const { googleClientId: clientId } = await getOAuthClientConfig();
  if (!clientId) throw new OAuthClientError('Google client id missing', 'NOT_CONFIGURED');

  await loadScript('https://accounts.google.com/gsi/client', 'mf-google-gsi');
  if (!window.google?.accounts?.oauth2) {
    throw new OAuthClientError('Google SDK unavailable', 'SCRIPT_LOAD_FAILED');
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new OAuthClientError(response.error || 'token missing', 'CANCELLED'));
          return;
        }
        resolve({ accessToken: response.access_token });
      },
      error_callback: () => {
        reject(new OAuthClientError('Google login cancelled', 'CANCELLED'));
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

async function requestAppleIdToken(): Promise<{ idToken: string; nonce: string }> {
  const cfg = await getOAuthClientConfig();
  const clientId = cfg.appleClientId;
  if (!clientId) throw new OAuthClientError('Apple client id missing', 'NOT_CONFIGURED');

  // Must match Apple Services ID Return URLs (include /machinefit/ on Pages).
  const redirectURI = cfg.appleRedirectUri || getKakaoRedirectUri('/');

  await loadScript(
    'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
    'mf-apple-sdk'
  );
  if (!window.AppleID?.auth) {
    throw new OAuthClientError('Apple SDK unavailable', 'SCRIPT_LOAD_FAILED');
  }

  const nonce = generateOAuthCsrfToken();
  sessionStorage.setItem(APPLE_OAUTH_NONCE_KEY, nonce);

  window.AppleID.auth.init({
    clientId,
    scope: 'name',
    redirectURI,
    usePopup: true,
    nonce,
  });

  try {
    const result = await window.AppleID.auth.signIn();
    const idToken = result.authorization?.id_token;
    if (!idToken) throw new OAuthClientError('Apple token missing', 'TOKEN_MISSING');
    sessionStorage.removeItem(APPLE_OAUTH_NONCE_KEY);
    // Do not forward Apple name — MachineFit assigns a random username server-side.
    return { idToken, nonce };
  } catch (error) {
    sessionStorage.removeItem(APPLE_OAUTH_NONCE_KEY);
    if (error instanceof OAuthClientError) throw error;
    throw new OAuthClientError('Apple login cancelled', 'CANCELLED');
  }
}
