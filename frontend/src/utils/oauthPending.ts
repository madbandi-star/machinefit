import type { OAuthPendingIdentity } from '@machinefit/shared';

const PENDING_KEY = 'mf_oauth_pending';
const CHECKS_KEY = 'mf_terms_checks';

export interface OAuthPendingSession {
  pendingToken: string;
  identity: OAuthPendingIdentity;
  /** signup = first-time; rejoin = previously WITHDRAWN social subject (still new MachineFit user). */
  reason?: 'signup' | 'rejoin';
  versions?: {
    terms: string;
    privacy: string;
    location: string;
    marketing: string;
  };
}

export interface TermsCheckState {
  agreeAll: boolean;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeLocation: boolean;
  agreeMarketing: boolean;
  /** KR PIPA: user attests they are 14+ (required for signup). */
  agreeAge14: boolean;
}

const DEFAULT_CHECKS: TermsCheckState = {
  agreeAll: false,
  agreeTerms: false,
  agreePrivacy: false,
  agreeLocation: false,
  agreeMarketing: false,
  agreeAge14: false,
};

export function saveOAuthPending(session: OAuthPendingSession): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(session));
}

export function loadOAuthPending(): OAuthPendingSession | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OAuthPendingSession;
  } catch {
    return null;
  }
}

export function clearOAuthPending(): void {
  sessionStorage.removeItem(PENDING_KEY);
}

export function saveTermsChecks(checks: TermsCheckState): void {
  sessionStorage.setItem(CHECKS_KEY, JSON.stringify(checks));
}

export function loadTermsChecks(): TermsCheckState {
  try {
    const raw = sessionStorage.getItem(CHECKS_KEY);
    if (!raw) return { ...DEFAULT_CHECKS };
    return { ...DEFAULT_CHECKS, ...(JSON.parse(raw) as TermsCheckState) };
  } catch {
    return { ...DEFAULT_CHECKS };
  }
}

export function clearTermsChecks(): void {
  sessionStorage.removeItem(CHECKS_KEY);
}
