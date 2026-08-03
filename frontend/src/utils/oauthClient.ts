import type { AuthProviderCode } from '@machinefit/shared';

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
        login: (options: {
          scope?: string;
          success: (res: { access_token: string }) => void;
          fail: (err: unknown) => void;
        }) => void;
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

export function isOAuthProviderConfigured(provider: AuthProviderCode): boolean {
  if (provider === 'google') return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  if (provider === 'kakao') return Boolean(import.meta.env.VITE_KAKAO_JS_KEY?.trim());
  return Boolean(import.meta.env.VITE_APPLE_CLIENT_ID?.trim());
}

export async function requestOAuthCredential(
  provider: AuthProviderCode
): Promise<{ idToken?: string; accessToken?: string; displayName?: string }> {
  if (provider === 'google') return requestGoogleAccessToken();
  if (provider === 'kakao') return requestKakaoAccessToken();
  return requestAppleIdToken();
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

async function requestKakaoAccessToken(): Promise<{ accessToken: string }> {
  const jsKey = import.meta.env.VITE_KAKAO_JS_KEY?.trim();
  if (!jsKey) throw new OAuthClientError('Kakao JS key missing', 'NOT_CONFIGURED');

  await loadScript('https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js', 'mf-kakao-sdk');
  if (!window.Kakao) {
    throw new OAuthClientError('Kakao SDK unavailable', 'SCRIPT_LOAD_FAILED');
  }
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(jsKey);
  }

  return new Promise((resolve, reject) => {
    window.Kakao!.Auth.login({
      scope: 'profile_nickname,account_email',
      success: (res) => {
        if (!res.access_token) {
          reject(new OAuthClientError('Kakao token missing', 'TOKEN_MISSING'));
          return;
        }
        resolve({ accessToken: res.access_token });
      },
      fail: () => reject(new OAuthClientError('Kakao login cancelled', 'CANCELLED')),
    });
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
