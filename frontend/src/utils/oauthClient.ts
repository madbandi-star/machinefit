import type { AuthProviderCode } from '@machinefit/shared';

const KAKAO_OAUTH_INTENT_KEY = 'mf_kakao_oauth_intent';
const KAKAO_OAUTH_REDIRECT_KEY = 'mf_kakao_oauth_redirect';

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
};

export function isOAuthProviderConfigured(provider: AuthProviderCode): boolean {
  if (provider === 'google') return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  if (provider === 'kakao') return Boolean(import.meta.env.VITE_KAKAO_JS_KEY?.trim());
  return Boolean(import.meta.env.VITE_APPLE_CLIENT_ID?.trim());
}

/** Absolute redirect URI for Kakao.Auth.authorize — must match Kakao Developers exactly. */
export function getKakaoRedirectUri(path: string = '/login'): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
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

/** Read ?code= after Kakao redirect; clears the query from the address bar. */
export function consumeKakaoAuthorizationCode(): {
  code: string;
  redirectUri: string;
  intent: KakaoOAuthIntent;
} | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  const intentRaw = sessionStorage.getItem(KAKAO_OAUTH_INTENT_KEY);
  const redirectUri = sessionStorage.getItem(KAKAO_OAUTH_REDIRECT_KEY);
  if (!intentRaw || !redirectUri) return null;

  if (error) {
    sessionStorage.removeItem(KAKAO_OAUTH_INTENT_KEY);
    sessionStorage.removeItem(KAKAO_OAUTH_REDIRECT_KEY);
    params.delete('code');
    params.delete('error');
    params.delete('error_description');
    params.delete('state');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
    return null;
  }

  if (!code) return null;

  sessionStorage.removeItem(KAKAO_OAUTH_INTENT_KEY);
  sessionStorage.removeItem(KAKAO_OAUTH_REDIRECT_KEY);
  params.delete('code');
  params.delete('state');
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);

  return {
    code,
    redirectUri,
    intent: intentRaw === 'connect' ? 'connect' : 'login',
  };
}

async function ensureKakaoSdk(): Promise<void> {
  const jsKey = import.meta.env.VITE_KAKAO_JS_KEY?.trim();
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
    intent === 'connect' ? getKakaoRedirectUri('/my-page') : getKakaoRedirectUri('/login');
  sessionStorage.setItem(KAKAO_OAUTH_INTENT_KEY, intent);
  sessionStorage.setItem(KAKAO_OAUTH_REDIRECT_KEY, redirectUri);

  // Nickname only — email requires Biz app permission.
  window.Kakao.Auth.authorize({
    redirectUri,
    scope: 'profile_nickname',
  });

  // Page navigates away; keep the promise pending.
  return new Promise(() => undefined);
}

async function requestGoogleAccessToken(): Promise<{ accessToken: string }> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new OAuthClientError('Google client id missing', 'NOT_CONFIGURED');

  await loadScript('https://accounts.google.com/gsi/client', 'mf-google-gsi');
  if (!window.google?.accounts?.oauth2) {
    throw new OAuthClientError('Google SDK unavailable', 'SCRIPT_LOAD_FAILED');
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
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

async function requestAppleIdToken(): Promise<{ idToken: string; displayName?: string }> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID?.trim();
  if (!clientId) throw new OAuthClientError('Apple client id missing', 'NOT_CONFIGURED');

  const redirectURI =
    import.meta.env.VITE_APPLE_REDIRECT_URI?.trim() || `${window.location.origin}/`;

  await loadScript(
    'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
    'mf-apple-sdk'
  );
  if (!window.AppleID?.auth) {
    throw new OAuthClientError('Apple SDK unavailable', 'SCRIPT_LOAD_FAILED');
  }

  window.AppleID.auth.init({
    clientId,
    scope: 'name email',
    redirectURI,
    usePopup: true,
  });

  try {
    const result = await window.AppleID.auth.signIn();
    const idToken = result.authorization?.id_token;
    if (!idToken) throw new OAuthClientError('Apple token missing', 'TOKEN_MISSING');
    const first = result.user?.name?.firstName?.trim() ?? '';
    const last = result.user?.name?.lastName?.trim() ?? '';
    const displayName = `${first} ${last}`.trim() || undefined;
    return { idToken, displayName };
  } catch (error) {
    if (error instanceof OAuthClientError) throw error;
    throw new OAuthClientError('Apple login cancelled', 'CANCELLED');
  }
}
