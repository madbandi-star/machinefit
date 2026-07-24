import type { LocalizedString } from './api.types.js';
import type { LocationRef } from './location.types.js';

export const TRADE_TYPES = ['sell', 'buy'] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

export const TRADE_CONDITIONS = ['new', 'grade_a', 'grade_b', 'heavy_use'] as const;
export type TradeCondition = (typeof TRADE_CONDITIONS)[number];

export const TRADE_STATUSES = [
  'selling',
  'reserved',
  'sold',
  'purchased',
  'cancelled',
  'expired',
] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export const TRADE_REPORT_REASONS = ['fake', 'scam', 'abuse', 'spam', 'other'] as const;
export type TradeReportReason = (typeof TRADE_REPORT_REASONS)[number];

export const TRADE_REPORT_STATUSES = ['pending', 'resolved', 'dismissed'] as const;
export type TradeReportStatus = (typeof TRADE_REPORT_STATUSES)[number];

/** Default listing lifetime in days (server-enforced). */
export const TRADE_DEFAULT_LISTING_DAYS = 7;

export interface MachineTradeImage {
  id: string;
  tradeId: string;
  sortOrder: number;
  mimeType: string;
  width?: number;
  height?: number;
  /** Absolute or API-relative URL for full image. */
  imageUrl: string;
  thumbUrl: string;
}

export interface MachineTradeListItem {
  id: string;
  tradeType: TradeType;
  machineId: string;
  machineCode: string;
  brandId: string;
  brandCode?: string;
  brandName: LocalizedString | string;
  machineName: LocalizedString | string;
  machineImageUrl?: string;
  brandLogoUrl?: string;
  sellerId: string;
  sellerName: string;
  price: number;
  condition?: TradeCondition | null;
  quantity: number;
  regionLabel: string;
  location?: LocationRef | null;
  status: TradeStatus;
  viewCount: number;
  likeCount: number;
  likedByMe?: boolean;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  expiredAt: string;
  /** Whole days remaining; 0 = ends today; negative = ended. */
  daysRemaining: number;
  isExpired: boolean;
}

export interface MachineTradeDetail extends MachineTradeListItem {
  description: string;
  images: MachineTradeImage[];
  isOwner?: boolean;
}

export interface MachineTradeReport {
  id: string;
  tradeId: string;
  reporterId: string;
  reporterName?: string;
  reason: TradeReportReason;
  description?: string;
  status: TradeReportStatus;
  createdAt: string;
  resolvedAt?: string;
  trade?: Pick<
    MachineTradeListItem,
    'id' | 'tradeType' | 'machineName' | 'brandName' | 'price' | 'status' | 'sellerName'
  >;
}

export interface MachineTradeStats {
  totalActive: number;
  totalSell: number;
  totalBuy: number;
  totalExpired: number;
  totalReportsPending: number;
  popular: MachineTradeListItem[];
}
