import type { AuthTokens, OAuthLoginResult, User } from '@machinefit/shared';
import { clearOAuthPending, saveOAuthPending } from '@/utils/oauthPending';
import { ROUTES } from '@/constants/routes';

type NavigateFn = (to: string, opts?: { replace?: boolean }) => void;

interface HandleOAuthOptions {
  data: OAuthLoginResult | { user: User; tokens: AuthTokens; status?: undefined };
  setAuth: (user: User, tokens: AuthTokens) => void;
  syncUser: (user: User) => void;
  navigate: NavigateFn;
  onAuthenticatedToast: () => void;
  /** Destination after full login (existing member). */
  from?: string;
}

/**
 * Normalize OAuth API payload (new staged flow or legacy user+tokens).
 */
export function normalizeOAuthLoginResult(
  data: HandleOAuthOptions['data']
): OAuthLoginResult {
  if (data && typeof data === 'object' && 'status' in data && data.status) {
    return data as OAuthLoginResult;
  }
  const legacy = data as { user: User; tokens: AuthTokens };
  if (legacy.user?.needsConsent) {
    return {
      status: 'needs_consent',
      reason: 'version_update',
      user: legacy.user,
      tokens: legacy.tokens,
      versions: {
        terms: legacy.user.termsVersion ?? '',
        privacy: legacy.user.privacyVersion ?? '',
        location: legacy.user.locationVersion ?? '',
        marketing: legacy.user.marketingVersion ?? '',
      },
    };
  }
  return {
    status: 'authenticated',
    user: legacy.user,
    tokens: legacy.tokens,
  };
}

export function handleOAuthLoginResult(opts: HandleOAuthOptions): void {
  const result = normalizeOAuthLoginResult(opts.data);

  if (result.status === 'authenticated') {
    clearOAuthPending();
    opts.setAuth(result.user, result.tokens);
    opts.syncUser(result.user);
    opts.onAuthenticatedToast();
    opts.navigate(opts.from ?? ROUTES.HOME, { replace: true });
    return;
  }

  if (result.reason === 'signup') {
    saveOAuthPending({
      pendingToken: result.pendingToken,
      identity: result.identity,
      versions: result.versions,
    });
    opts.navigate(ROUTES.AUTH_TERMS, { replace: true });
    return;
  }

  // version_update — session issued, gate to terms
  clearOAuthPending();
  opts.setAuth(result.user, result.tokens);
  opts.syncUser(result.user);
  opts.navigate(ROUTES.AUTH_TERMS, { replace: true });
}
