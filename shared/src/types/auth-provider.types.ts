export const AUTH_PROVIDERS = ['google', 'kakao', 'apple'] as const;

export type AuthProviderCode = (typeof AUTH_PROVIDERS)[number];

export function isAuthProviderCode(value: string): value is AuthProviderCode {
  return (AUTH_PROVIDERS as readonly string[]).includes(value);
}

export interface AuthProviderLink {
  provider: AuthProviderCode;
  providerEmail?: string | null;
  linked: boolean;
  linkedAt?: string | null;
}

export interface AuthProvidersStatus {
  items: AuthProviderLink[];
  /** True when the user can still sign in with email/password. */
  hasPassword: boolean;
}
