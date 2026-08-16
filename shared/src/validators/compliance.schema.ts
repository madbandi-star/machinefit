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
import {
  PRIVACY_CORRECTION_FIELD_KEYS,
  PRIVACY_DELETION_CATEGORIES,
  PRIVACY_RIGHTS_REQUEST_TYPES,
} from '../constants/privacy-rights.js';

export const consentUpdateSchema = z.object({
  marketingOptIn: z.boolean().optional(),
  eventOptIn: z.boolean().optional(),
  locationOptIn: z.boolean().optional(),
  pushServiceOptIn: z.boolean().optional(),
  regionCode: z.enum(LEGAL_REGIONS).optional(),
  legalVersion: z.string().min(1).max(32).optional(),
});

export const createPrivacyRightsRequestSchema = z.object({
  requestType: z.enum(PRIVACY_RIGHTS_REQUEST_TYPES),
  subject: z.string().min(1).max(200).optional(),
  detail: z.string().max(5000).optional(),
  /** Correction: field / current / requested */
  fieldKey: z.string().max(80).optional(),
  currentValue: z.string().max(2000).optional(),
  requestedValue: z.string().max(2000).optional(),
  /** consent_withdraw target */
  consentTarget: z
    .enum(['marketing', 'event', 'push_service', 'location', 'privacy_essential'])
    .optional(),
  /** deletion / processing_stop confirmation */
  acknowledgedInventory: z.boolean().optional(),
  confirmed: z.boolean().optional(),
  /** deletion: which deletable categories the member wants removed */
  categories: z.array(z.enum(PRIVACY_DELETION_CATEGORIES)).max(20).optional(),
});

export const adminPrivacyRightsUpdateSchema = z.object({
  status: z.enum(['received', 'reviewing', 'completed', 'rejected']),
  resultMessage: z.string().max(5000).optional(),
  rejectionReason: z.string().max(5000).optional(),
  /** When completing processing_stop — apply suspend flag */
  applyProcessingStop: z.boolean().optional(),
  /** When completing correction — apply profile field change from payload when possible */
  applyCorrection: z.boolean().optional(),
  /** When completing deletion — note only; actual purge stays withdraw/retention pipeline */
  noteLegalRetention: z.boolean().optional(),
});

export const adminPrivacyRightsBulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['received', 'reviewing', 'completed', 'rejected']),
  resultMessage: z.string().max(5000).optional(),
  rejectionReason: z.string().max(5000).optional(),
  applyProcessingStop: z.boolean().optional(),
  applyCorrection: z.boolean().optional(),
  noteLegalRetention: z.boolean().optional(),
});

export const adminPrivacyRightsBulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

/** Admin applies category deletion or field correction against a rights request. */
export const adminPrivacyRightsFulfillSchema = z.object({
  mode: z.enum(['delete_categories', 'apply_correction']),
  categories: z.array(z.enum(PRIVACY_DELETION_CATEGORIES)).min(1).max(20).optional(),
  fieldKey: z.enum(PRIVACY_CORRECTION_FIELD_KEYS).optional(),
  correctionValue: z.string().max(2000).optional(),
  markCompleted: z.boolean().optional().default(false),
  resultMessage: z.string().max(5000).optional(),
});

/** Record feature-scoped profile data processing consent (body / birth / location-gym). */
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
export type CreatePrivacyRightsRequestInput = z.infer<
  typeof createPrivacyRightsRequestSchema
>;
export type AdminPrivacyRightsUpdateInput = z.infer<
  typeof adminPrivacyRightsUpdateSchema
>;
export type AdminPrivacyRightsBulkUpdateInput = z.infer<
  typeof adminPrivacyRightsBulkUpdateSchema
>;
export type AdminPrivacyRightsBulkDeleteInput = z.infer<
  typeof adminPrivacyRightsBulkDeleteSchema
>;
export type AdminPrivacyRightsFulfillInput = z.infer<
  typeof adminPrivacyRightsFulfillSchema
>;
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
