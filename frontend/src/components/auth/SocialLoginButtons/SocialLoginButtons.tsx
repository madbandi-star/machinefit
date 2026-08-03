import { useState } from 'react';
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

const PROVIDER_META: Record<
  AuthProviderCode,
  { label: string; className: string; mark: string }
> = {
  google: { label: 'Google', className: 'social-auth__btn--google', mark: 'G' },
  apple: { label: 'Apple', className: 'social-auth__btn--apple', mark: '' },
  kakao: { label: 'Kakao', className: 'social-auth__btn--kakao', mark: 'K' },
};

interface SocialLoginButtonsProps {
  disabled?: boolean;
  onCredential: (
    provider: AuthProviderCode,
    credential: OAuthCredentialPayload
  ) => Promise<void> | void;
  onClientError?: (error: OAuthClientError) => void;
}

export function SocialLoginButtons({
  disabled,
  onCredential,
  onClientError,
}: SocialLoginButtonsProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<AuthProviderCode | null>(null);

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
    <div className="social-auth">
      <div className="social-auth__divider" role="presentation">
        <span>{t('auth.socialOr')}</span>
      </div>
      <div className="social-auth__list" role="group" aria-label={t('auth.socialLoginGroup')}>
        {AUTH_PROVIDERS.map((provider) => {
          const meta = PROVIDER_META[provider];
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
                {provider === 'apple' ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.03-.8.88-2.12 1.56-3.25 1.47-.13-1.1.42-2.25 1.16-3.07.8-.9 2.2-1.56 3.27-1.43zM20.5 17.2c-.6 1.36-.89 1.96-1.67 3.16-1.08 1.66-2.6 3.73-4.48 3.75-1.66.02-2.09-1.08-4.35-1.07-2.26.01-2.73 1.1-4.39 1.08-1.88-.03-3.32-1.88-4.4-3.53C-.1 17.7-.7 13.4.9 10.6c1.13-2 2.92-3.17 4.6-3.17 1.72 0 2.8 1.12 4.22 1.12 1.38 0 2.22-1.13 4.23-1.13 1.5 0 3.09.82 4.2 2.23-3.7 2.03-3.1 7.32.35 7.55z" />
                  </svg>
                ) : (
                  meta.mark
                )}
              </span>
              <span>
                {busy === provider
                  ? t('auth.socialConnecting')
                  : t('auth.continueWith', { provider: meta.label })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
