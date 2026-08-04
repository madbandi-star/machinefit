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

/** Default login providers (Apple ready in AUTH_PROVIDERS for later). */
const DEFAULT_LOGIN_PROVIDERS: AuthProviderCode[] = ['kakao', 'google'];

interface SocialLoginButtonsProps {
  disabled?: boolean;
  /** When false, hide the "or" divider (social-first login). */
  showDivider?: boolean;
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
    <div className="social-auth">
      {showDivider && (
        <div className="social-auth__divider" role="presentation">
          <span>{t('auth.socialOr')}</span>
        </div>
      )}
      <div className="social-auth__list" role="group" aria-label={t('auth.socialLoginGroup')}>
        {visibleProviders.map((provider) => {
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
                {meta.mark}
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
