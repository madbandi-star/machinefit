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
  isActive: boolean;
  deactivatedAt?: string | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  /**
   * Present only during legacy migration. Prefer HttpOnly refresh cookie;
   * modern API responses omit this field.
   */
  refreshToken?: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
