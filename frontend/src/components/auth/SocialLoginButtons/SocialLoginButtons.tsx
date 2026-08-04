import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthProviderCode } from '@machinefit/shared';
import { AUTH_PROVIDERS } from '@machinefit/shared';
import {
  beginKakaoAuthorize,
  isOAuthProviderConfigured,
  OAuthClientError,
  requestOAuthCredential,
  type OAuthCredentialPayload,
} from '@/utils/oauthClient';
import '@/styles/auth.css';

function KakaoMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="currentColor"
        d="M12 4C7.58 4 4 6.69 4 10c0 2.1 1.4 3.95 3.52 5.03l-.9 3.28c-.08.3.26.54.5.36L11 16.4c.33.03.66.05 1 .05 4.42 0 8-2.69 8-6.05S16.42 4 12 4Z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.73.13-1.43.36-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

const PROVIDER_META: Record<
  AuthProviderCode,
  { label: string; className: string; mark: ReactNode; startKey: string }
> = {
  google: {
    label: 'Google',
    className: 'social-auth__btn--google',
    mark: <GoogleMark />,
    startKey: 'auth.startWithGoogle',
  },
  apple: {
    label: 'Apple',
    className: 'social-auth__btn--apple',
    mark: null,
    startKey: 'auth.continueWith',
  },
  kakao: {
    label: 'Kakao',
    className: 'social-auth__btn--kakao',
    mark: <KakaoMark />,
    startKey: 'auth.startWithKakao',
  },
};

/** Default login providers (Apple ready in AUTH_PROVIDERS for later). */
const DEFAULT_LOGIN_PROVIDERS: AuthProviderCode[] = ['kakao', 'google'];

interface SocialLoginButtonsProps {
  disabled?: boolean;
  /** When false, hide the "or" divider (social-first login). */
  showDivider?: boolean;
  /** Landing CTA style matching the marketing capture. */
  variant?: 'default' | 'landing';
  /** Ordered providers to show. Defaults to Kakao → Google. */
  providers?: AuthProviderCode[];
  onCredential: (
    provider: AuthProviderCode,
    credential: OAuthCredentialPayload
  ) => Promise<void> | void;
  onClientError?: (error: OAuthClientError) => void;
}

export function SocialLoginButtons({
  disabled,
  showDivider = true,
  variant = 'default',
  providers = DEFAULT_LOGIN_PROVIDERS,
  onCredential,
  onClientError,
}: SocialLoginButtonsProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<AuthProviderCode | null>(null);

  const visibleProviders = providers.filter((p) =>
    (AUTH_PROVIDERS as readonly string[]).includes(p)
  );

  const handleClick = async (provider: AuthProviderCode) => {
    if (disabled || busy) return;
    setBusy(provider);
    try {
      if (!isOAuthProviderConfigured(provider)) {
        throw new OAuthClientError('not configured', 'NOT_CONFIGURED');
      }
      if (provider === 'kakao') {
        await beginKakaoAuthorize('login');
        return;
      }
      const credential = await requestOAuthCredential(provider);
      await onCredential(provider, credential);
    } catch (error) {
      if (error instanceof OAuthClientError) {
        onClientError?.(error);
        return;
      }
      throw error;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`social-auth${variant === 'landing' ? ' social-auth--landing' : ''}`}>
      {showDivider && (
        <div className="social-auth__divider" role="presentation">
          <span>{t('auth.socialOr')}</span>
        </div>
      )}
      <div className="social-auth__list" role="group" aria-label={t('auth.socialLoginGroup')}>
        {visibleProviders.map((provider) => {
          const meta = PROVIDER_META[provider];
          const label =
            busy === provider
              ? t('auth.socialConnecting')
              : variant === 'landing'
                ? t(meta.startKey, { provider: meta.label })
                : t('auth.continueWith', { provider: meta.label });
          return (
            <button
              key={provider}
              type="button"
              className={`social-auth__btn ${meta.className}`}
              disabled={Boolean(disabled || busy)}
              aria-busy={busy === provider}
              onClick={() => void handleClick(provider)}
            >
              <span className="social-auth__mark" aria-hidden>
                {meta.mark}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
