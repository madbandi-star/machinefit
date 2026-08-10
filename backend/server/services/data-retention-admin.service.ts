import {
  type RetentionHoldInput,
  type RetentionPolicyCreateInput,
  type RetentionPolicyListQuery,
  type RetentionPolicyUpdateInput,
  type RetentionScheduledQuery,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { dataRetentionRepository } from '../repositories/data-retention.repository.js';
import { complianceRepository } from '../repositories/compliance.repository.js';

function audit(
  actorUserId: string | null | undefined,
  action: string,
  entityId: string | null,
  detail: Record<string, unknown>,
  meta?: { ip?: string | null; userAgent?: string | null; role?: string | null }
) {
  void complianceRepository.writeAuditLog({
    actorId: actorUserId ?? null,
    actorRole: meta?.role ?? null,
    action,
    targetType: 'retention_policy',
    targetId: entityId ?? undefined,
    meta: detail,
    ipAddress: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
  });
}

export class DataRetentionAdminService {
  async getSummary() {
    return dataRetentionRepository.summary();
  }

  async listPolicies(query: RetentionPolicyListQuery) {
    return dataRetentionRepository.listPolicies(query);
  }

  async getPolicy(id: string) {
    const policy = await dataRetentionRepository.getPolicy(id);
    if (!policy) throw new AppError(404, 'NOT_FOUND', 'Policy not found');
    const versions = await dataRetentionRepository.listPolicyVersions(id);
    return { policy, versions };
  }

  async createPolicy(
    input: RetentionPolicyCreateInput,
    actorUserId: string,
    meta?: { ip?: string | null; userAgent?: string | null; role?: string | null }
  ) {
    const existing = await dataRetentionRepository.getPolicyByCode(input.code);
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Policy code already exists');
    }
    const created = await dataRetentionRepository.createPolicy(input, actorUserId);
    audit(actorUserId, 'retention.policy.create', created.id, { code: created.code }, meta);
    return created;
  }

  async updatePolicy(
    id: string,
    input: RetentionPolicyUpdateInput & { confirmImpact?: boolean },
    actorUserId: string,
    meta?: { ip?: string | null; userAgent?: string | null; role?: string | null }
  ) {
    const before = await dataRetentionRepository.getPolicy(id);
    if (!before) throw new AppError(404, 'NOT_FOUND', 'Policy not found');

    const periodChanging =
      (input.periodValue != null && input.periodValue !== before.periodValue) ||
      (input.periodUnit != null && input.periodUnit !== before.periodUnit);

    if (periodChanging && !input.confirmImpact) {
      const impact = await dataRetentionRepository.previewPeriodChangeImpact(
        id,
        input.periodValue ?? before.periodValue,
        input.periodUnit ?? before.periodUnit
      );
      return {
        requiresConfirmation: true as const,
        impact,
        message:
          '보존기간 변경은 기존 삭제 예정 레코드의 예정일을 재계산합니다. confirmImpact=true 로 다시 요청하세요.',
      };
    }

    const updated = await dataRetentionRepository.updatePolicy(id, input, actorUserId);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Policy not found');

    let rescheduled = 0;
    if (periodChanging) {
      rescheduled = await dataRetentionRepository.rescheduleOpenRecordsForPolicy(
        id,
        updated.periodValue,
        updated.periodUnit
      );
    }

    audit(
      actorUserId,
      'retention.policy.update',
      id,
      {
        code: updated.code,
        before: {
          periodValue: before.periodValue,
          periodUnit: before.periodUnit,
          isActive: before.isActive,
          autoDelete: before.autoDelete,
        },
        after: {
          periodValue: updated.periodValue,
          periodUnit: updated.periodUnit,
          isActive: updated.isActive,
          autoDelete: updated.autoDelete,
        },
        changeReason: input.changeReason,
        rescheduledRecords: rescheduled,
      },
      meta
    );

    return {
      policy: updated,
      rescheduledRecords: rescheduled,
      requiresConfirmation: false as const,
    };
  }

  async listScheduled(query: RetentionScheduledQuery) {
    return dataRetentionRepository.listScheduled(query);
  }

  async listDeletionLogs(limit = 100) {
    return dataRetentionRepository.listDeletionLogs(limit);
  }

  async listConsentCatalog() {
    return dataRetentionRepository.listConsentCatalog();
  }

  async createConsent(
    input: {
      code: string;
      nameKo: string;
      nameEn?: string;
      consentKind: string;
      isRequired?: boolean;
      withdrawable?: boolean;
      description?: string;
    },
    actorUserId: string,
    meta?: { ip?: string | null; userAgent?: string | null; role?: string | null }
  ) {
    const created = await dataRetentionRepository.createConsentCatalogItem(input);
    audit(actorUserId, 'retention.consent.create', created.id, { code: created.code }, meta);
    return created;
  }

  async setHold(
    recordId: string,
    input: RetentionHoldInput,
    actorUserId: string,
    meta?: { ip?: string | null; userAgent?: string | null; role?: string | null }
  ) {
    if (input.hold) {
      if (!input.holdReason?.trim()) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Hold reason is required');
      }
      if (!input.holdUntil) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'holdUntil is required (indefinite hold is not allowed)'
        );
      }
    }
    const updated = await dataRetentionRepository.setHold(recordId, {
      hold: input.hold,
      holdReason: input.holdReason ?? '',
      holdUntil: input.holdUntil,
      holdBy: actorUserId,
    });
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Record not found');
    audit(
      actorUserId,
      input.hold ? 'retention.record.hold' : 'retention.record.hold_release',
      recordId,
      {
        reason: input.holdReason ?? null,
        holdUntil: input.holdUntil ?? null,
        subjectId: updated.subjectId,
        policyCode: updated.policyCode,
      },
      meta
    );
    return updated;
  }

  async syncWithdrawnRecords() {
    return dataRetentionRepository.upsertWithdrawnUserRecords();
  }
}

export const dataRetentionAdminService = new DataRetentionAdminService();
