export type AbuseEventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AbuseEventType =
  | 'RATE_LIMIT_EXCEEDED'
  | 'DAILY_QUOTA_EXCEEDED'
  | 'MONTHLY_QUOTA_EXCEEDED'
  | 'STOCK_LIMIT_EXCEEDED'
  | 'EQUIPMENT_CARD_LIMIT_EXCEEDED'
  | 'RECOMMENDATION_LIMIT_EXCEEDED'
  | 'BURST_REQUEST_DETECTED'
  | 'SUSPICIOUS_ACTIVITY';

export type AbuseEvent = {
  id: string;
  userId: string | null;
  ipHash: string | null;
  endpoint: string;
  eventType: AbuseEventType | string;
  severity: AbuseEventSeverity;
  requestCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AdminAbuseListQuery = {
  from?: string;
  to?: string;
  eventType?: string;
  planTier?: 'FREE' | 'PREMIUM' | 'ALL';
  page?: number;
  limit?: number;
};
