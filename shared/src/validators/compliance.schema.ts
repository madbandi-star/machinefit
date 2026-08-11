import { z } from 'zod';
import {
  CONTENT_REPORT_REASONS,
  DEFAULT_LEGAL_REGION,
  LEGAL_DOC_TYPES,
  LEGAL_REGIONS,
  PROFILE_FEATURE_CONSENT_TYPES,
  SUPPORT_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
} from '../constants/legal.js';

export const consentUpdateSchema = z.object({
  marketingOptIn: z.boolean().optional(),
  locationOptIn: z.boolean().optional(),
  pushServiceOptIn: z.boolean().optional(),
  regionCode: z.enum(LEGAL_REGIONS).optional(),
  legalVersion: z.string().min(1).max(32).optional(),
});

/** Record feature-scoped profile data processing consent (body metrics / birth). */
export const featureConsentSchema = z.object({
  consentType: z.enum(PROFILE_FEATURE_CONSENT_TYPES),
  agreed: z.literal(true),
  regionCode: z.enum(LEGAL_REGIONS).optional(),
});

export const createSupportTicketSchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES).default('general'),
  subject: z.string().min(2).max(200),
  body: z.string().min(2).max(5000),
});

export const supportTicketMessageSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const adminSupportTicketUpdateSchema = z.object({
  status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
  reply: z.string().min(1).max(5000).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

export const contentReportSchema = z.object({
  reason: z.enum(CONTENT_REPORT_REASONS),
  description: z.string().max(1000).optional(),
});

export const legalDocumentsQuerySchema = z.object({
  regionCode: z.string().min(2).max(16).optional().default(DEFAULT_LEGAL_REGION),
  docType: z.enum(LEGAL_DOC_TYPES).optional(),
});

export const adminLegalDocumentSchema = z.object({
  regionCode: z.enum(LEGAL_REGIONS).default(DEFAULT_LEGAL_REGION),
  docType: z.enum(LEGAL_DOC_TYPES),
  version: z.string().min(1).max(32),
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional(),
  bodyMd: z.string().max(100_000).optional(),
  isActive: z.boolean().optional().default(true),
});

export const adminSanctionSchema = z.object({
  userId: z.string().uuid(),
  sanctionType: z.enum(['warning', 'temp_suspend', 'content_mute']),
  reason: z.string().max(1000).optional(),
  endsAt: z.string().datetime().optional().nullable(),
});

export type ConsentUpdateInput = z.infer<typeof consentUpdateSchema>;
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
