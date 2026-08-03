import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { AuthProviderCode, AuthProvidersStatus } from '@machinefit/shared';
import { AUTH_PROVIDERS } from '@machinefit/shared';
import { authApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import {
  beginKakaoAuthorize,
  consumeKakaoAuthorizationCode,
  isOAuthProviderConfigured,
  OAuthClientError,
  requestOAuthCredential,
} from '@/utils/oauthClient';
import '@/styles/auth.css';

const PROVIDER_LABEL: Record<AuthProviderCode, string> = {
  google: 'Google',
  apple: 'Apple',
  kakao: 'Kakao',
};

const PROVIDER_DOT: Record<AuthProviderCode, string> = {
  google: 'linked-providers__dot--google',
  apple: 'linked-providers__dot--apple',
  kakao: 'linked-providers__dot--kakao',
};

function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { code?: string } } | undefined;
  return payload?.error?.code;
}

interface LinkedProvidersSectionProps {
  /** When false, page shell / parent owns the title. */
  showHeading?: boolean;
}

export function LinkedProvidersSection({ showHeading = true }: LinkedProvidersSectionProps) {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [busyProvider, setBusyProvider] = useState<AuthProviderCode | null>(null);
  const kakaoConnectHandled = useRef(false);

  const providersQuery = useQuery({
    queryKey: QUERY_KEYS.authProviders,
    queryFn: async () => (await authApi.getProviders()).data.data,
    staleTime: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.authProviders });
  };

  useEffect(() => {
    if (kakaoConnectHandled.current) return;
    const pending = consumeKakaoAuthorizationCode();
    if (!pending || pending.intent !== 'connect') return;
    kakaoConnectHandled.current = true;
    setBusyProvider('kakao');
    void authApi
      .connectProvider('kakao', {
        authorizationCode: pending.code,
        redirectUri: pending.redirectUri,
      })
      .then(() => {
        showToast(t('myPage.providersConnected'), 'success');
        invalidate();
      })
      .catch((error: unknown) => {
        const code = getApiErrorCode(error);
        if (code === 'PROVIDER_LINKED_TO_OTHER_ACCOUNT') {
          showToast(t('myPage.providersLinkedOther'), 'error');
          return;
        }
        if (code === 'PROVIDER_ALREADY_LINKED') {
          showToast(t('myPage.providersAlreadyLinked'), 'error');
          return;
        }
        showToast(t('myPage.providersConnectFailed'), 'error');
      })
      .finally(() => setBusyProvider(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Kakao redirect return once
  }, []);

  const connectMutation = useMutation({
    mutationFn: async (provider: AuthProviderCode) => {
      if (!isOAuthProviderConfigured(provider)) {
        throw new OAuthClientError('not configured', 'NOT_CONFIGURED');
      }
      if (provider === 'kakao') {
        await beginKakaoAuthorize('connect');
        // Redirects away — never resolves.
        return authApi.getProviders();
      }
      const credential = await requestOAuthCredential(provider);
      return authApi.connectProvider(provider, credential);
    },
    onSuccess: (_data, provider) => {
      if (provider === 'kakao') return;
      showToast(t('myPage.providersConnected'), 'success');
      invalidate();
    },
    onError: (error: unknown) => {
      if (error instanceof OAuthClientError) {
        showToast(t(oauthClientErrorKey(error.code)), 'error');
        return;
      }
      const code = getApiErrorCode(error);
      if (code === 'PROVIDER_LINKED_TO_OTHER_ACCOUNT') {
        showToast(t('myPage.providersLinkedOther'), 'error');
        return;
      }
      if (code === 'PROVIDER_ALREADY_LINKED') {
        showToast(t('myPage.providersAlreadyLinked'), 'error');
        return;
      }
      if (code === 'OAUTH_NOT_CONFIGURED') {
        showToast(t('auth.socialNotConfigured'), 'error');
        return;
      }
      showToast(t('myPage.providersConnectFailed'), 'error');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: AuthProviderCode) => authApi.disconnectProvider(provider),
    onSuccess: () => {
      showToast(t('myPage.providersDisconnected'), 'success');
      invalidate();
    },
    onError: (error: unknown) => {
      const code = getApiErrorCode(error);
      if (code === 'LAST_LOGIN_METHOD') {
        showToast(t('myPage.providersLastMethod'), 'error');
        return;
      }
      showToast(t('myPage.providersDisconnectFailed'), 'error');
    },
  });

  const status: AuthProvidersStatus | undefined = providersQuery.data;
  const linkedCount = status?.items.filter((item) => item.linked).length ?? 0;
  const canUnlinkAny = linkedCount > 1 || Boolean(status?.hasPassword);

  const runConnect = async (provider: AuthProviderCode) => {
    setBusyProvider(provider);
    try {
      await connectMutation.mutateAsync(provider);
    } finally {
      setBusyProvider(null);
    }
  };

  const runDisconnect = async (provider: AuthProviderCode) => {
    if (!window.confirm(t('myPage.providersUnlinkConfirm', { provider: PROVIDER_LABEL[provider] }))) {
      return;
    }
    setBusyProvider(provider);
    try {
      await disconnectMutation.mutateAsync(provider);
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <section className={showHeading ? 'my-page-section' : undefined}>
      {showHeading ? (
        <>
          <h3 className="my-page-section__title">{t('settings.linkedLogins')}</h3>
          <p className="linked-providers__hint">{t('settings.linkedLoginsHint')}</p>
        </>
      ) : null}
      <ul className="linked-providers" aria-label={t('settings.linkedLogins')}>
        {AUTH_PROVIDERS.map((provider) => {
          const item = status?.items.find((row) => row.provider === provider);
          const linked = Boolean(item?.linked);
          const busy = busyProvider === provider;
          return (
            <li key={provider} className="linked-providers__row">
              <div className="linked-providers__identity">
                <span
                  className={`linked-providers__dot ${PROVIDER_DOT[provider]}${
                    linked ? '' : ' linked-providers__dot--off'
                  }`}
                  aria-hidden
                />
                <div>
                  <div className="linked-providers__name">{PROVIDER_LABEL[provider]}</div>
                  <div className="linked-providers__status">
                    {linked
                      ? item?.providerEmail || t('myPage.providersLinked')
                      : t('myPage.providersNotLinked')}
                  </div>
                </div>
              </div>
              {linked ? (
                <button
                  type="button"
                  className="btn btn--secondary linked-providers__action"
                  disabled={busy || !canUnlinkAny || providersQuery.isLoading}
                  onClick={() => void runDisconnect(provider)}
                >
                  {busy ? '...' : t('myPage.providersUnlink')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary linked-providers__action"
                  disabled={busy || providersQuery.isLoading}
                  onClick={() => void runConnect(provider)}
                >
                  {busy ? '...' : t('myPage.providersLink')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function oauthClientErrorKey(
  code: OAuthClientError['code']
): 'auth.socialNotConfigured' | 'auth.socialCancelled' | 'auth.socialFailed' {
  if (code === 'NOT_CONFIGURED') return 'auth.socialNotConfigured';
  if (code === 'CANCELLED') return 'auth.socialCancelled';
  return 'auth.socialFailed';
}
