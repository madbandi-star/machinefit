import type { BannerStatus, BannerType, BannerSlotStatus } from '../constants/banner.js';

export interface BannerSlotAssignment {
  slotId: string;
  slotKey: string;
  slotName: string;
  priority: number;
}

export interface BannerListItem {
  id: string;
  name: string;
  advertiserName: string;
  description: string;
  bannerType: BannerType;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  targetUrl: string;
  openNewWindow: boolean;
  status: BannerStatus;
  startAt?: string | null;
  endAt?: string | null;
  priority: number;
  impressionCount: number;
  clickCount: number;
  ctr: number;
  lastImpressedAt?: string | null;
  lastClickedAt?: string | null;
  slots: BannerSlotAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface BannerDetail extends BannerListItem {
  imageStoragePath?: string | null;
  mobileImageStoragePath?: string | null;
  createdBy?: string | null;
}

export interface BannerListResponse {
  items: BannerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BannerSlot {
  id: string;
  slotKey: string;
  slotName: string;
  description: string;
  status: BannerSlotStatus;
  assignedBannerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBanner {
  id: string;
  name: string;
  advertiserName: string;
  bannerType: BannerType;
  imageUrl: string;
  mobileImageUrl?: string | null;
  targetUrl: string;
  openNewWindow: boolean;
  priority: number;
  slotKey: string;
  slotId: string;
}

export interface BannerAdminStats {
  totalBanners: number;
  activeBanners: number;
  totalImpressions: number;
  totalClicks: number;
  overallCtr: number;
  topByClicks: {
    id: string;
    name: string;
    impressionCount: number;
    clickCount: number;
    ctr: number;
  }[];
  bySlot: {
    slotKey: string;
    slotName: string;
    bannerCount: number;
    impressions: number;
    clicks: number;
  }[];
}

export interface BannerStatsRow {
  id: string;
  name: string;
  advertiserName: string;
  status: BannerStatus;
  impressionCount: number;
  clickCount: number;
  ctr: number;
  lastImpressedAt?: string | null;
  lastClickedAt?: string | null;
  slots: { slotKey: string; slotName: string }[];
}
