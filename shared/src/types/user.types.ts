import type {
  ExperienceLevel,
  Gender,
  RoleCode,
  UnitHeight,
  UnitWeight,
} from './api.types.js';
import type { WorkoutGoal } from '../constants/workout-goals.js';

export interface User {
  id: string;
  roleId: string;
  roleCode: RoleCode;
  email: string;
  displayName: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  /** YYYY-MM-DD — required (with birth time or unknown) for 헬창운세. */
  birthDate?: string | null;
  /** HH:mm wall-clock; null when unknown. */
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  workoutGoal?: WorkoutGoal;
  homeGymId?: string;
  homeGymName?: string;
  experienceLevel?: ExperienceLevel;
  countryId?: string;
  languageId?: string;
  languageCode?: string;
  unitHeight: UnitHeight;
  unitWeight: UnitWeight;
  timezone?: string;
  avatarUrl?: string;
  /** Last selected personal gym (multi-gym). May be omitted; 'all' is client-only. */
  activeGymId?: string;
  /** free | premium — gym/member limits. */
  subscriptionPlan?: import('../constants/subscription.js').SubscriptionPlan;
  /** Opt-in for marketing / event push campaigns. */
  marketingOptIn?: boolean;
  /** Opt-in for storing/using precise GPS location. */
  locationOptIn?: boolean;
  /** Opt-in for service (non-marketing) push notifications. */
  pushServiceOptIn?: boolean;
  /** Accepted legal document versions (null/undefined = never accepted). */
  termsVersion?: string | null;
  privacyVersion?: string | null;
  locationVersion?: string | null;
  marketingVersion?: string | null;
  termsAgreedAt?: string | null;
  privacyAgreedAt?: string | null;
  locationAgreedAt?: string | null;
  marketingAgreedAt?: string | null;
  /** True when required consents (terms/privacy) are missing or outdated. */
  needsConsent?: boolean;
  isActive: boolean;
  deactivatedAt?: string | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  /**
   * Long-lived credential for silent refresh. Also mirrored as an HttpOnly
   * cookie when the browser allows it; SPA persists this in sessionStorage
   * as a cross-site fallback (Pages → Render).
   */
  refreshToken?: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/** Staged OAuth identity before account creation / required reconsent. */
export interface OAuthPendingIdentity {
  provider: import('./auth-provider.types.js').AuthProviderCode;
  email: string | null;
  displayName: string | null;
}

export type OAuthLoginResult =
  | {
      status: 'authenticated';
      user: User;
      tokens: AuthTokens;
    }
  | {
      status: 'needs_consent';
      /** Fresh social signup, or rejoin after WITHDRAWN (still a NEW MachineFit user). */
      reason: 'signup' | 'rejoin';
      pendingToken: string;
      identity: OAuthPendingIdentity;
      versions: {
        terms: string;
        privacy: string;
        location: string;
        marketing: string;
      };
    }
  | {
      status: 'needs_consent';
      reason: 'version_update';
      user: User;
      tokens: AuthTokens;
      versions: {
        terms: string;
        privacy: string;
        location: string;
        marketing: string;
      };
    };
