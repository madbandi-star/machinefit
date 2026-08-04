export type OpsSeverity = 'critical' | 'high' | 'medium' | 'low';
export type OpsStatusColor = 'green' | 'yellow' | 'red';
export type OpsLogKind =
  | 'application'
  | 'error'
  | 'access'
  | 'admin'
  | 'login'
  | 'security';
export type OpsRange = 'today' | '7d' | '30d' | '90d' | '1y';

export interface OpsHealthSnapshot {
  server: 'ok' | 'degraded' | 'down';
  database: 'ok' | 'degraded' | 'down' | 'not_configured';
  storage: 'ok' | 'degraded' | 'down' | 'not_configured';
  version: string;
  buildTime: string;
  uptimeSec: number;
  restartCount: number;
  cpuPct: number | null;
  memoryPct: number | null;
  diskPct: number | null;
  supabase: 'ok' | 'degraded' | 'down' | 'not_configured';
  dbPool: {
    total: number | null;
    idle: number | null;
    waiting: number | null;
  };
  statusColor: OpsStatusColor;
  checkedAt: string;
}

export interface OpsKpiCard {
  currentOnline: number;
  todayVisitors: number;
  weekVisitors: number;
  monthVisitors: number;
  totalMembers: number;
  todaySignups: number;
  weekSignups: number;
  monthSignups: number;
  todayLogins: number;
  returningRate: number | null;
  newUsersToday: number;
  returningUsersToday: number;
  freeMembers: number;
  paidMembers: number;
  premiumConversionRate: number | null;
  dau: number;
  wau: number;
  mau: number;
  stickiness: number | null;
  retentionD1: number | null;
  retentionD7: number | null;
  retentionD30: number | null;
  apiAvgMs: number | null;
  errorCountToday: number;
  serverStatus: OpsStatusColor;
}

export interface OpsSeriesPoint {
  date: string;
  value: number;
}

export interface OpsErrorGroupRow {
  id: string;
  fingerprint: string;
  title: string;
  severity: OpsSeverity;
  source: string;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  resolved: boolean;
  sampleUrl: string | null;
  sampleStack: string | null;
}

export interface OpsApiRouteStat {
  method: string;
  routeKey: string;
  callCount: number;
  successRate: number;
  failRate: number;
  avgMs: number;
  minMs: number | null;
  maxMs: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  speedColor: OpsStatusColor;
}

export interface OpsPageStat {
  pathKey: string;
  pageViews: number;
  uniqueVisitors: number;
  avgDwellMs: number;
  bounceRate: number | null;
  entrances: number;
  exits: number;
}

export interface OpsFeatureStat {
  featureKey: string;
  eventCount: number;
  uniqueUsers: number;
}

export interface OpsServerSample {
  sampledAt: string;
  cpuPct: number | null;
  memoryPct: number | null;
  diskPct: number | null;
  uptimeSec: number | null;
  restartCount: number;
  buildVersion: string | null;
}

export interface OpsDbQueryRow {
  id: number;
  sampledAt: string;
  queryFingerprint: string;
  queryPreview: string;
  durationMs: number;
  isSlow: boolean;
}

export interface OpsLogRow {
  id: number;
  loggedAt: string;
  level: string;
  kind: OpsLogKind | string;
  message: string;
  userId: string | null;
  ipAddress: string | null;
  apiRoute: string | null;
}

export interface OpsAlertRow {
  id: string;
  createdAt: string;
  alertKey: string;
  severity: OpsSeverity | string;
  title: string;
  message: string;
  acknowledged: boolean;
}

export interface OpsSecurityRow {
  id: number;
  occurredAt: string;
  eventType: string;
  severity: string;
  userId: string | null;
  ipAddress: string | null;
  path: string | null;
  message: string | null;
}

export interface OpsAuditRow {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  meta: Record<string, unknown>;
}

export interface OpsDashboardSnapshot {
  health: OpsHealthSnapshot;
  kpi: OpsKpiCard;
  visitorsSeries: OpsSeriesPoint[];
  signupsSeries: OpsSeriesPoint[];
  dauSeries: OpsSeriesPoint[];
  apiLatencySeries: OpsSeriesPoint[];
  errorSeries: OpsSeriesPoint[];
  cpuSeries: OpsSeriesPoint[];
  memorySeries: OpsSeriesPoint[];
  topPages: OpsPageStat[];
  topFeatures: OpsFeatureStat[];
  slowApis: OpsApiRouteStat[];
  recentErrors: OpsErrorGroupRow[];
  recentAudits: OpsAuditRow[];
  recentSignups: Array<{ id: string; email: string; displayName: string; createdAt: string }>;
  openAlerts: OpsAlertRow[];
  dbSlowQueries: OpsDbQueryRow[];
}

export interface OpsIngestEvent {
  type: 'page_view' | 'feature' | 'error' | 'session_ping' | 'pwa' | 'security';
  occurredAt?: string;
  pathKey?: string;
  featureKey?: string;
  dwellMs?: number;
  isEntrance?: boolean;
  isExit?: boolean;
  isBounce?: boolean;
  sessionId?: string;
  error?: {
    title: string;
    message?: string;
    stack?: string;
    severity?: OpsSeverity;
    source?: string;
    url?: string;
    fingerprint?: string;
  };
  meta?: Record<string, unknown>;
  browser?: string;
  os?: string;
  device?: string;
  appVersion?: string;
}

export interface OpsIngestPayload {
  events: OpsIngestEvent[];
}
