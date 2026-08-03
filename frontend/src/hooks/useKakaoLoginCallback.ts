import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { AuthTokens, User } from '@machinefit/shared';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { syncGymScopeAfterAuth } from '@/utils/syncGymScope';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { consumeKakaoAuthorizationCode } from '@/utils/oauthClient';
import { ROUTES } from '@/constants/routes';

function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { message?: string; code?: string } } | undefined;
  return payload?.error?.message;
}

function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { code?: string } } | undefined;
  return payload?.error?.code;
}

/** Completes Kakao authorize() redirect on whatever page owns the Redirect URI. */
export function useKakaoLoginCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const pending = consumeKakaoAuthorizationCode();
    if (!pending || pending.intent !== 'login') return;
    handled.current = true;

    void authApi
      .oauthLogin('kakao', {
        authorizationCode: pending.code,
        redirectUri: pending.redirectUri,
      })
      .then((res) => {
        const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
        setAuth(user, tokens);
        syncUserSettings(user);
        syncGymScopeAfterAuth(user);
        showToast(t('auth.welcomeBack'), 'success');
        navigate(ROUTES.HOME, { replace: true });
      })
      .catch((error: unknown) => {
        const code = getApiErrorCode(error);
        const message = getApiErrorMessage(error);
        if (code === 'OAUTH_NOT_CONFIGURED') {
          showToast(t('auth.socialNotConfigured'), 'error');
        } else if (message) {
          showToast(message, 'error');
        } else {
          showToast(t('auth.socialFailed'), 'error');
        }
      });
  }, [navigate, setAuth, showToast, t]);
}
