export type LiveDashboardLevel = 'world' | 'country' | 'metro' | 'district' | 'gym' | 'user';

export type LiveRankingPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export type LiveRankingBoard =
  | 'country'
  | 'metro'
  | 'district'
  | 'gym'
  | 'member'
  | 'brand'
  | 'machine'
  | 'muscle';

export interface LiveBreadcrumbItem {
  level: LiveDashboardLevel;
  code: string;
  label: string;
}

export interface LiveScopeQuery {
  countryCode?: string;
  metroCode?: string;
  districtCode?: string;
  gymId?: string;
  userId?: string;
}

export interface LiveStatCard {
  id: string;
  label: string;
  value: number;
  unit?: string;
  emoji?: string;
  hint?: string;
}

export interface LiveChildNode {
  level: LiveDashboardLevel;
  code: string;
  label: string;
  flag?: string;
  activeNow: number;
  volumeTodayKg: number;
  heat: number;
}

export interface LiveHotCard {
  id: string;
  emoji: string;
  title: string;
  value: string;
  subtitle?: string;
}

export interface LiveFeedItem {
  id: string;
  emoji: string;
  text: string;
  createdAt: string;
}

export interface LiveInsight {
  id: string;
  text: string;
}

export interface LiveHourlyPoint {
  hour: number;
  activeUsers: number;
  sets: number;
  volumeKg: number;
}

export interface LiveDashboardSnapshot {
  level: LiveDashboardLevel;
  scope: LiveScopeQuery;
  breadcrumbs: LiveBreadcrumbItem[];
  title: string;
  flag?: string;
  stats: LiveStatCard[];
  hotCards: LiveHotCard[];
  children: LiveChildNode[];
  feed: LiveFeedItem[];
  insights: LiveInsight[];
  hourly: LiveHourlyPoint[];
  topMachines: { code: string; name: string; sets: number }[];
  topBrands: { code: string; name: string; sets: number }[];
  refreshedAt: string;
}

export interface LiveRankingEntry {
  rank: number;
  code: string;
  label: string;
  value: number;
  unit: string;
  isMe?: boolean;
}

export interface LiveRankingResponse {
  board: LiveRankingBoard;
  period: LiveRankingPeriod;
  items: LiveRankingEntry[];
}

export interface LiveSearchHit {
  level: LiveDashboardLevel;
  code: string;
  label: string;
  path: LiveBreadcrumbItem[];
}
