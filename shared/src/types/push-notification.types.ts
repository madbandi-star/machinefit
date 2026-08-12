import type { RoleCode } from './api.types.js';
import type { PushConsentCategory } from '../constants/push-consent.js';

/** Extensible message kinds for role-based push. */
export const PUSH_KINDS = [
  'general',
  'notice',
  'workout',
  'schedule',
  'trade',
  'event',
] as const;
export type PushKind = (typeof PUSH_KINDS)[number];

/**
 * Audience selectors. Server re-validates every type against sender Role.
 * New roles/audiences can be added without breaking existing clients.
 */
export const PUSH_AUDIENCE_TYPES = [
  'all_users',
  'role',
  'gym',
  'location',
  'user_ids',
  'owner_gym_trainers',
  'owner_gym_members',
  'trainer_clients',
  'member_exact',
] as const;
export type PushAudienceType = (typeof PUSH_AUDIENCE_TYPES)[number];

export interface PushAudienceInput {
  type: PushAudienceType;
  /** Platform role filter (admin role audience, or refine gym/owner lists). */
  roleCode?: RoleCode;
  /** Official gym id (admin gym audience / owner must own it when type=gym). */
  gymId?: string;
  countryCode?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  /** Explicit recipient user ids (scoped by sender role). */
  userIds?: string[];
  /** Exact user id or display name (member → friend only). */
  query?: string;
}

export interface PushComposeCapabilities {
  canCompose: boolean;
  senderRole: RoleCode;
  allowedAudienceTypes: PushAudienceType[];
  /** Max recipients per send (0 = none). */
  maxRecipients: number;
  /** Official gyms the sender may target (owner/admin). */
  gyms: Array<{ id: string; name: string }>;
  /** Suggested selectable recipients for owner/trainer UIs. */
  suggestedRecipients: Array<{
    id: string;
    displayName: string;
    roleCode: RoleCode;
    label?: string;
  }>;
}

export interface PushSendInput {
  kind: PushKind;
  title: string;
  body: string;
  imageUrl?: string | null;
  deepLink?: string | null;
  audience: PushAudienceInput;
}

export interface PushDeliveryLog {
  id: string;
  campaignId: string;
  senderId: string;
  senderRole: RoleCode;
  recipientId: string;
  recipientRole?: RoleCode;
  title: string;
  body: string;
  success: boolean;
  errorCode?: string | null;
  createdAt: string;
}

export interface PushCampaign {
  id: string;
  senderId: string;
  senderRole: RoleCode;
  kind: PushKind;
  title: string;
  body: string;
  imageUrl?: string | null;
  deepLink?: string | null;
  audienceType: PushAudienceType;
  audienceFilter: Record<string, unknown>;
  recipientCount: number;
  successCount: number;
  /** marketing | service — consent gate applied at send time */
  consentCategory?: PushConsentCategory | null;
  /** Recipients removed for missing consent at send time */
  skippedConsentCount?: number;
  failedCount?: number;
  createdAt: string;
}

export interface PushSendResult {
  campaign: PushCampaign;
  delivered: number;
  failed: number;
  /** Total skipped (resolve + consent) */
  skipped: number;
  /** Audience size before consent filter */
  resolvedCount: number;
  /** Removed solely due to missing consent */
  consentExcluded: number;
  consentCategory: PushConsentCategory;
}

/** Dry-run audience + consent counts for compose UI. */
export interface PushAudiencePreview {
  consentCategory: PushConsentCategory;
  /** Recipients after role/audience resolve, before consent */
  resolvedCount: number;
  /** Still eligible after live consent check */
  consentEligibleCount: number;
  /** Excluded by missing required consent */
  consentExcludedCount: number;
  /** Final send target (= consentEligibleCount, capped later by max) */
  finalCount: number;
  /** True when service kind body looks like marketing */
  marketingContentBlocked: boolean;
}
