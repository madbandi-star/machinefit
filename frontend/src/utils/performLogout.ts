import { clearKakaoOAuthStaging } from '@/utils/oauthClient';
import { clearOAuthPending, clearTermsChecks } from '@/utils/oauthPending';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useCredentialsStore } from '@/store/credentials.store';
import { clearGymScope } from '@/utils/syncGymScope';

/** Clear local auth + OAuth staging (no network). Keeps remembered login email. */
export function clearLocalSession(options?: { clearCredentials?: boolean }): void {
  clearKakaoOAuthStaging();
  clearOAuthPending();
  clearTermsChecks();
  if (options?.clearCredentials) {
    useCredentialsStore.getState().clearCredentials();
  }
  useAuthStore.getState().clearAuth();
  clearGymScope();
}

/** Full client logout + clear OAuth staging so landing does not re-enter redirect flows. */
export async function performLogout(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    /* still clear local session */
  }
  clearLocalSession({ clearCredentials: true });
}
