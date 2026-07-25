import type {
  ConsentType,
  ContentReportReason,
  LegalDocType,
  LegalRegionCode,
  SupportCategory,
  SupportTicketStatus,
} from '../constants/legal.js';

export interface LegalDocument {
  id: string;
  regionCode: LegalRegionCode | string;
  docType: LegalDocType | string;
  version: string;
  title: string;
  summary?: string | null;
  bodyMd?: string | null;
  effectiveAt: string;
  isActive: boolean;
}

export interface UserConsentRecord {
  id?: string;
  consentType: ConsentType | string;
  version: string;
  agreed: boolean;
  agreedAt: string;
  regionCode?: string;
  source?: string;
}

export interface PrivacyDataSummary {
  profile: {
    id: string;
    email: string;
    displayName: string;
    gender?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    age?: number | null;
    workoutGoal?: string | null;
    experienceLevel?: string | null;
    homeGymName?: string | null;
    marketingOptIn: boolean;
    locationOptIn: boolean;
    pushServiceOptIn: boolean;
    createdAt: string;
  };
  location?: {
    countryCode?: string | null;
    stateId?: string | null;
    cityId?: string | null;
    districtId?: string | null;
    hasCoordinates: boolean;
    visibility?: string | null;
  } | null;
  consents: UserConsentRecord[];
  counts: {
    workoutLogs: number;
    favorites: number;
    photoPosts: number;
    communityPosts: number;
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: SupportCategory | string;
  subject: string;
  status: SupportTicketStatus | string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  latestMessagePreview?: string | null;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorRole: 'user' | 'admin' | string;
  body: string;
  createdAt: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportTicketMessage[];
}

export interface CreateContentReportInput {
  reason: ContentReportReason | string;
  description?: string;
}

export interface AdminAuditLog {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt: string;
}

export interface ComplianceOverview {
  pendingSupportTickets: number;
  pendingCommunityReports: number;
  marketingOptInUsers: number;
  locationOptInUsers: number;
  activeLegalDocuments: number;
  recentLoginFailures: number;
}
