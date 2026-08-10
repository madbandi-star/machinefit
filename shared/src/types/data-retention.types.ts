export type RetentionDataCategory =
  | 'personal'
  | 'payment'
  | 'service'
  | 'log'
  | 'community'
  | 'workout'
  | 'auth'
  | 'other';

export type RetentionReason =
  | 'legal'
  | 'contract'
  | 'consent'
  | 'operations'
  | 'security'
  | 'dispute'
  | 'other';

export type RetentionPeriodUnit = 'day' | 'month' | 'year';

export type RetentionStartBasis =
  | 'signup_at'
  | 'withdrawn_at'
  | 'created_at'
  | 'updated_at'
  | 'transaction_at'
  | 'paid_at'
  | 'contract_end_at'
  | 'last_used_at'
  | 'admin_set'
  | 'other';

export type RetentionDeletionMethod =
  | 'hard_delete'
  | 'anonymize'
  | 'soft_delete'
  | 'archive';

export type DataRetentionRecordStatus =
  | 'ACTIVE'
  | 'RETENTION'
  | 'DELETE_SCHEDULED'
  | 'DELETE_PENDING'
  | 'DELETE_PROCESSING'
  | 'DELETE_COMPLETED'
  | 'DELETE_FAILED'
  | 'ANONYMIZED'
  | 'EXEMPTED'
  | 'HOLD';

export interface RetentionConsentCatalogItem {
  id: string;
  code: string;
  nameKo: string;
  nameEn: string;
  consentKind: string;
  isRequired: boolean;
  withdrawable: boolean;
  description: string;
  isActive: boolean;
}

export interface RetentionPolicy {
  id: string;
  code: string;
  name: string;
  description: string;
  dataCategory: RetentionDataCategory;
  tableNames: string[];
  retentionReason: RetentionReason;
  isLegalHold: boolean;
  legalBasisNote: string;
  relatedPolicyDoc: string;
  relatedTermsDoc: string;
  consentCatalogId: string | null;
  consentCode: string | null;
  consentNameKo: string | null;
  periodValue: number;
  periodUnit: RetentionPeriodUnit;
  startBasis: RetentionStartBasis;
  autoDelete: boolean;
  deletionMethod: RetentionDeletionMethod;
  retryLimit: number;
  isActive: boolean;
  currentVersion: number;
  updatedAt: string;
  updatedBy: string | null;
  /** Sample D-Day for withdrawn_at = today (informational). */
  sampleScheduledDeletionAt: string;
  sampleDaysRemaining: number;
}

export interface RetentionPolicyVersion {
  id: string;
  policyId: string;
  version: number;
  snapshot: Record<string, unknown>;
  changeReason: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface DataRetentionRecord {
  id: string;
  policyId: string;
  policyCode: string;
  policyName: string;
  policyVersion: number;
  subjectType: string;
  subjectId: string;
  userId: string | null;
  userDisplayName: string | null;
  retentionStartAt: string;
  scheduledDeletionAt: string;
  daysRemaining: number;
  status: DataRetentionRecordStatus;
  hold: boolean;
  holdReason: string;
  holdUntil: string | null;
  lastError: string | null;
  retryCount: number;
  deletedAt: string | null;
  updatedAt: string;
}

export interface DeletionExecutionLog {
  id: string;
  recordId: string | null;
  policyId: string | null;
  policyCode: string | null;
  action: string;
  success: boolean;
  rowsAffected: number;
  errorMessage: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface DataRetentionSummary {
  policyTotal: number;
  policyActive: number;
  scheduledTotal: number;
  dueIn7Days: number;
  dueIn30Days: number;
  deleteFailed: number;
  onHold: number;
  completed: number;
  anonymized: number;
}

export interface RetentionPolicyImpactPreview {
  policyId: string;
  affectedRecords: number;
  scheduleChanged: number;
  sample: Array<{
    recordId: string;
    subjectId: string;
    before: string;
    after: string;
  }>;
}
