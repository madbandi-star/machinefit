import type { AdType, AdUserStatus } from '../constants/ads.js';
import type { PublicBanner } from './banner.types.js';

export interface AdFeatureFlagRow {
  flagKey: string;
  enabled: boolean;
  updatedAt: string;
}

export interface AdPlacement {
  id: string;
  placementKey: string;
  name: string;
  description: string;
  adType: AdType;
  enabled: boolean;
  priority: number;
  mapsToBannerSlotKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdPolicy {
  id: string;
  placementId: string;
  eventType: string | null;
  minIntervalSeconds: number;
  sessionLimit: number | null;
  dailyLimit: number | null;
  eventIntervalCount: number | null;
  anonymousEnabled: boolean;
  freeUserEnabled: boolean;
  paidUserEnabled: boolean;
  adminEnabled: boolean;
  requireMarketingOptIn: boolean;
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
}

export interface AdCreativePayload {
  kind: 'cms_banner' | 'mock';
  banners?: PublicBanner[];
  title?: string;
  body?: string;
  ctaLabel?: string;
}

export interface AdDecision {
  show: boolean;
  reason: string;
  placementKey: string;
  adType: AdType | null;
  userStatus: AdUserStatus;
  creative: AdCreativePayload | null;
  provider: string;
}

export interface AdAdminStats {
  range: string;
  impressions: number;
  clicks: number;
  rewardCompletes: number;
  interstitialImpressions: number;
  bannerImpressions: number;
  byPlacement: { placementKey: string; impressions: number; clicks: number }[];
  byEvent: { eventType: string; impressions: number }[];
  byUserStatusApprox: { label: string; impressions: number }[];
}
