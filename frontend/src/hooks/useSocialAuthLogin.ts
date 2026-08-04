import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { AuthProviderCode, User } from '@machinefit/shared';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { syncGymScopeAfterAuth } from '@/utils/syncGymScope';
import { syncUserSettings } from '@/utils/syncUserSettings';
import {
  consumeKakaoAuthorizationCode,
  OAuthClientError,
  type OAuthCredentialPayload,
} from '@/utils/oauthClient';
import { handleOAuthLoginResult } from '@/utils/handleOAuthLoginResult';
import { ROUTES } from '@/constants/routes';

function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { code?: string } } | undefined;
  return payload?.error?.code;
}

function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { message?: string } } | undefined;
  return payload?.error?.message;
}

/** Shared Kakao/Google login handler for landing + /login. */
export function useSocialAuthLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);
  const [oauthPending, setOauthPending] = useState(false);
  const kakaoCodeHandled = useRef(false);

  const fromLocation = (location.state as { from?: { pathname?: string; search?: string; hash?: string } })
    ?.from;
  const from =
    fromLocation?.pathname != null
      ? `${fromLocation.pathname}${fromLocation.search ?? ''}${fromLocation.hash ?? ''}`
      : ROUTES.HOME;

  const syncUser = (user: User) => {
    syncUserSettings(user);
    syncGymScopeAfterAuth(user);
  };

  const handleOAuth = async (provider: AuthProviderCode, credential: OAuthCredentialPayload) => {
    setOauthPending(true);
    try {
      const res = await authApi.oauthLogin(provider, credential);
      handleOAuthLoginResult({
        data: res.data.data,
        setAuth,
        syncUser,
        navigate,
        from,
        onAuthenticatedToast: () => showToast(t('auth.welcomeBack'), 'success'),
      });
    } catch (error) {
      const code = getApiErrorCode(error);
      const message = getApiErrorMessage(error);
      if (code === 'OAUTH_NOT_CONFIGURED') {
        showToast(t('auth.socialNotConfigured'), 'error');
      } else if (message) {
        showToast(message, 'error');
      } else {
        showToast(t('auth.socialFailed'), 'error');
      }
    } finally {
      setOauthPending(false);
    }
  };

  const handleOAuthClientError = (error: OAuthClientError) => {
    if (error.code === 'NOT_CONFIGURED') {
      showToast(t('auth.socialNotConfigured'), 'error');
      return;
    }
    if (error.code === 'CANCELLED') {
      showToast(t('auth.socialCancelled'), 'info');
      return;
    }
    showToast(t('auth.socialFailed'), 'error');
  };

  useEffect(() => {
    // Scrub orphan Kakao params even when this mount is not the code consumer.
    if (kakaoCodeHandled.current) return;
    const pending = consumeKakaoAuthorizationCode();
    if (!pending || pending.intent !== 'login') return;
    kakaoCodeHandled.current = true;
    void handleOAuth('kakao', {
      authorizationCode: pending.code,
      redirectUri: pending.redirectUri,
    });
    // Intentionally once on mount for Kakao redirect return.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OAuth callback
  }, []);

  return {
    oauthPending,
    handleOAuth,
    handleOAuthClientError,
  };
}
