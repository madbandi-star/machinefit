import {
  LEGAL_DOC_VERSION,
  DEFAULT_LEGAL_REGION,
  PRIVACY_DELETION_INVENTORY,
  type AdminPrivacyRightsBulkDeleteInput,
  type AdminPrivacyRightsBulkUpdateInput,
  type AdminPrivacyRightsUpdateInput,
  type ConsentUpdateInput,
  type CreatePrivacyRightsRequestInput,
  type CreateSupportTicketInput,
} from '@machinefit/shared';
import { complianceRepository } from '../repositories/compliance.repository.js';
import { privacyRightsRepository } from '../repositories/privacy-rights.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

async function applyRightsFulfillment(
  existing: Awaited<ReturnType<typeof privacyRightsRepository.getById>>,
  input: AdminPrivacyRightsUpdateInput
) {
  if (!existing || input.status !== 'completed') return;

  const shouldApplyStop =
    input.applyProcessingStop === true ||
    (input.applyProcessingStop !== false && existing.requestType === 'processing_stop');
  if (shouldApplyStop && existing.requestType === 'processing_stop') {
    await privacyRightsRepository.setProcessingSuspended(
      existing.userId,
      true,
      input.resultMessage ?? 'Admin completed processing stop'
    );
  }

  const shouldApplyCorrection =
    input.applyCorrection === true ||
    (input.applyCorrection !== false && existing.requestType === 'correction');
  if (shouldApplyCorrection && existing.requestType === 'correction') {
    const fieldKey = String(existing.payload?.fieldKey ?? '');
    const requestedValue = String(existing.payload?.requestedValue ?? '').trim();
    if (fieldKey === 'displayName' && requestedValue) {
      await userRepository.updateProfile(existing.userId, {
        displayName: requestedValue.slice(0, 80),
      });
    }
  }
}

export const complianceService = {
  listLegalDocuments(regionCode = DEFAULT_LEGAL_REGION, docType?: string) {
    return complianceRepository.listLegalDocuments(regionCode, docType);
  },

  async getPrivacySummary(userId: string) {
    const summary = await complianceRepository.getPrivacySummary(userId);
    if (!summary) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return summary;
  },

  async exportPrivacy(userId: string) {
    const payload = await complianceRepository.buildExportPayload(userId);
    if (!payload) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return payload;
  },

  listConsents(userId: string) {
    return complianceRepository.listConsents(userId);
  },

  async updateConsents(
    userId: string,
    input: ConsentUpdateInput,
    meta?: { ipAddress?: string | null; userAgent?: string | null; source?: string }
  ) {
    const version = input.legalVersion || LEGAL_DOC_VERSION;
    const regionCode = input.regionCode || DEFAULT_LEGAL_REGION;
    const flags: {
      marketingOptIn?: boolean;
      eventOptIn?: boolean;
      locationOptIn?: boolean;
      pushServiceOptIn?: boolean;
    } = {};
    const consentItems: Array<{ type: string; version: string; agreed: boolean }> = [];

    if (input.marketingOptIn !== undefined) {
      flags.marketingOptIn = input.marketingOptIn;
      consentItems.push({ type: 'marketing', version, agreed: input.marketingOptIn });
    }
    if (input.eventOptIn !== undefined) {
      flags.eventOptIn = input.eventOptIn;
      consentItems.push({ type: 'event', version, agreed: input.eventOptIn });
    }
    if (input.locationOptIn !== undefined) {
      flags.locationOptIn = input.locationOptIn;
      consentItems.push({ type: 'location', version, agreed: input.locationOptIn });
      if (!input.locationOptIn) {
        // Withdrawal: clear stored coordinates/region row (PIPA minimization)
        try {
          const { locationRepository } = await import('../repositories/location.repository.js');
          await locationRepository.deleteUserLocation(userId);
        } catch {
          /* location table may be unavailable in some envs */
        }
      }
    }
    if (input.pushServiceOptIn !== undefined) {
      flags.pushServiceOptIn = input.pushServiceOptIn;
      consentItems.push({ type: 'push_service', version, agreed: input.pushServiceOptIn });
    }

    await complianceRepository.setPrivacyFlags(userId, flags);
    await complianceRepository.recordConsentMeta(userId, consentItems, {
      regionCode,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      source: meta?.source ?? 'settings',
    });

    const user = await userRepository.findById(userId);
    return {
      marketingOptIn: user?.marketingOptIn ?? false,
      eventOptIn: user?.eventOptIn ?? false,
      locationOptIn: user?.locationOptIn ?? false,
      pushServiceOptIn: user?.pushServiceOptIn ?? true,
    };
  },

  getPrivacyProcessingPurposes() {
    return privacyRightsRepository.getProcessingPurposes();
  },

  listPrivacyRightsRequests(userId: string) {
    return privacyRightsRepository.listForUser(userId);
  },

  async getPrivacyRightsRequest(requestId: string, userId: string) {
    const row = await privacyRightsRepository.getForUser(requestId, userId);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Rights request not found');
    return row;
  },

  async createPrivacyRightsRequest(
    userId: string,
    input: CreatePrivacyRightsRequestInput,
    meta?: { ipAddress?: string | null; userAgent?: string | null }
  ) {
    // Immediate optional consent withdraws — apply now + log completed request.
    if (input.requestType === 'consent_withdraw') {
      const target = input.consentTarget;
      if (!target) {
        throw new AppError(400, 'VALIDATION_ERROR', 'consentTarget is required');
      }
      if (target === 'privacy_essential') {
        const created = await privacyRightsRepository.create(userId, input, {
          status: 'rejected',
          resultMessage:
            '서비스 제공에 필수적인 개인정보 처리 동의는 앱 내 철회만으로 종료할 수 없습니다. 회원탈퇴 절차를 이용해 주세요.',
          payload: {
            requiresAccountWithdrawal: true,
            deletable: PRIVACY_DELETION_INVENTORY.deletable,
            retained: PRIVACY_DELETION_INVENTORY.retained,
          },
        });
        await complianceRepository.writeAuditLog({
          actorId: userId,
          action: 'privacy.rights.consent_withdraw.essential_blocked',
          targetType: 'privacy_rights_request',
          targetId: created.id,
          meta: { target, ip: meta?.ipAddress },
        });
        return created;
      }
      const patch: ConsentUpdateInput = {};
      if (target === 'marketing') patch.marketingOptIn = false;
      if (target === 'event') patch.eventOptIn = false;
      if (target === 'push_service') patch.pushServiceOptIn = false;
      if (target === 'location') patch.locationOptIn = false;
      await this.updateConsents(userId, patch, {
        ...meta,
        source: 'privacy_rights',
      });
      return privacyRightsRepository.create(userId, input, {
        status: 'completed',
        resultMessage: '선택 동의를 철회하고 즉시 반영했습니다.',
      });
    }

    if (input.requestType === 'access') {
      // Access is fulfilled by providing export/summary; record as completed.
      return privacyRightsRepository.create(userId, input, {
        status: 'completed',
        resultMessage:
          '개인정보 열람·다운로드 기능을 제공했습니다. 권리 센터에서 JSON 다운로드 및 요약 열람이 가능합니다.',
      });
    }

    if (input.requestType === 'deletion') {
      if (!input.acknowledgedInventory || !input.confirmed) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Deletion requires inventory acknowledgement and confirmation'
        );
      }
      const created = await privacyRightsRepository.create(userId, input, {
        status: 'received',
        payload: {
          deletable: PRIVACY_DELETION_INVENTORY.deletable,
          retained: PRIVACY_DELETION_INVENTORY.retained,
          note: '법정 보존 데이터는 즉시 삭제되지 않습니다. 계정 전체 종료는 회원탈퇴를 이용하세요.',
        },
      });
      await complianceRepository.writeAuditLog({
        actorId: userId,
        action: 'privacy.rights.deletion.requested',
        targetType: 'privacy_rights_request',
        targetId: created.id,
        meta: { ip: meta?.ipAddress },
      });
      return created;
    }

    if (input.requestType === 'processing_stop') {
      if (!input.confirmed) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Processing stop requires confirmation');
      }
      // Optional processing stop can be applied immediately; essential service continues.
      await privacyRightsRepository.setProcessingSuspended(
        userId,
        true,
        'User requested processing stop for optional personal data uses'
      );
      const created = await privacyRightsRepository.create(userId, input, {
        status: 'completed',
        resultMessage:
          '선택적 개인정보 처리(마케팅·이벤트·부가 분석)를 정지했습니다. 계정·운동기록 등 필수 서비스 처리는 계속되며, 전체 종료는 회원탈퇴가 필요합니다.',
        payload: {
          suspendedOptional: true,
          serviceContinues: true,
        },
      });
      await complianceRepository.writeAuditLog({
        actorId: userId,
        action: 'privacy.rights.processing_stop.applied',
        targetType: 'privacy_rights_request',
        targetId: created.id,
        meta: { ip: meta?.ipAddress },
      });
      return created;
    }

    if (input.requestType === 'correction') {
      if (!input.fieldKey || input.requestedValue == null) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Correction requires fieldKey and requestedValue'
        );
      }
      const created = await privacyRightsRepository.create(userId, input, {
        status: 'received',
      });
      await complianceRepository.writeAuditLog({
        actorId: userId,
        action: 'privacy.rights.correction.requested',
        targetType: 'privacy_rights_request',
        targetId: created.id,
        meta: { fieldKey: input.fieldKey, ip: meta?.ipAddress },
      });
      return created;
    }

    throw new AppError(400, 'VALIDATION_ERROR', 'Unsupported request type');
  },

  listAdminPrivacyRightsRequests(filters?: {
    status?: string;
    requestType?: string;
  }) {
    return privacyRightsRepository.listAdmin(filters);
  },

  async adminUpdatePrivacyRightsRequest(
    requestId: string,
    adminId: string,
    input: AdminPrivacyRightsUpdateInput
  ) {
    const existing = await privacyRightsRepository.getById(requestId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Rights request not found');

    if (input.status === 'rejected' && !input.rejectionReason && !input.resultMessage) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Rejection reason is required');
    }

    await applyRightsFulfillment(existing, input);

    const updated = await privacyRightsRepository.updateAdmin(requestId, adminId, {
      status: input.status,
      resultMessage: input.resultMessage,
      rejectionReason: input.rejectionReason,
    });

    await complianceRepository.writeAuditLog({
      actorId: adminId,
      action: 'privacy.rights.admin.update',
      targetType: 'privacy_rights_request',
      targetId: requestId,
      meta: {
        status: input.status,
        requestType: existing.requestType,
        noteLegalRetention: input.noteLegalRetention,
        applyCorrection: input.applyCorrection,
        applyProcessingStop: input.applyProcessingStop,
      },
    });
    return updated;
  },

  async adminBulkUpdatePrivacyRightsRequests(
    adminId: string,
    input: AdminPrivacyRightsBulkUpdateInput
  ) {
    if (input.status === 'rejected' && !input.rejectionReason && !input.resultMessage) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Rejection reason is required');
    }

    const updated: NonNullable<
      Awaited<ReturnType<typeof privacyRightsRepository.getById>>
    >[] = [];
    const missing: string[] = [];

    for (const id of input.ids) {
      const existing = await privacyRightsRepository.getById(id);
      if (!existing) {
        missing.push(id);
        continue;
      }
      await applyRightsFulfillment(existing, input);
      const row = await privacyRightsRepository.updateAdmin(id, adminId, {
        status: input.status,
        resultMessage: input.resultMessage,
        rejectionReason: input.rejectionReason,
      });
      if (row) updated.push(row);
    }

    await complianceRepository.writeAuditLog({
      actorId: adminId,
      action: 'privacy.rights.admin.bulk_update',
      targetType: 'privacy_rights_request',
      targetId: input.ids[0],
      meta: {
        status: input.status,
        count: updated.length,
        missingCount: missing.length,
        ids: input.ids,
        noteLegalRetention: input.noteLegalRetention,
      },
    });

    return { updated, missing, count: updated.length };
  },

  async adminDeletePrivacyRightsRequests(
    adminId: string,
    input: AdminPrivacyRightsBulkDeleteInput
  ) {
    const deleted = await privacyRightsRepository.deleteByIds(input.ids);
    await complianceRepository.writeAuditLog({
      actorId: adminId,
      action: 'privacy.rights.admin.delete',
      targetType: 'privacy_rights_request',
      targetId: input.ids[0],
      meta: { ids: input.ids, deleted },
    });
    return { deleted };
  },

  createTicket(userId: string, input: CreateSupportTicketInput) {
    return complianceRepository.createSupportTicket(userId, input);
  },

  listTickets(userId: string) {
    return complianceRepository.listUserTickets(userId);
  },

  async getTicket(ticketId: string, userId: string) {
    const ticket = await complianceRepository.getSupportTicket(ticketId, userId);
    if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
    return ticket;
  },

  async addUserMessage(ticketId: string, userId: string, body: string) {
    const ticket = await complianceRepository.getSupportTicket(ticketId, userId);
    if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
    if (ticket.status === 'closed') {
      throw new AppError(400, 'TICKET_CLOSED', 'Ticket is closed');
    }
    return complianceRepository.addTicketMessage(ticketId, userId, 'user', body);
  },

  getOverview() {
    return complianceRepository.getOverview();
  },

  listAdminTickets(status?: string) {
    return complianceRepository.listAdminTickets(status);
  },

  async adminUpdateTicket(
    ticketId: string,
    adminId: string,
    input: { status?: string; reply?: string; priority?: string }
  ) {
    const existing = await complianceRepository.getSupportTicket(ticketId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
    if (input.reply) {
      await complianceRepository.addTicketMessage(ticketId, adminId, 'admin', input.reply);
    }
    const updated = await complianceRepository.updateAdminTicket(ticketId, {
      status: input.status,
      priority: input.priority,
      assignedAdminId: adminId,
    });
    await complianceRepository.writeAuditLog({
      actorId: adminId,
      action: 'support.ticket.update',
      targetType: 'support_ticket',
      targetId: ticketId,
      meta: { status: input.status, hasReply: Boolean(input.reply) },
    });
    return updated;
  },

  listAuditLogs(limit?: number) {
    return complianceRepository.listAuditLogs(limit);
  },

  upsertLegalDocument(
    adminId: string,
    input: {
      regionCode: string;
      docType: string;
      version: string;
      title: string;
      summary?: string;
      bodyMd?: string;
      isActive?: boolean;
    }
  ) {
    return complianceRepository.upsertLegalDocument({ ...input, createdBy: adminId }).then(
      async (doc) => {
        await complianceRepository.writeAuditLog({
          actorId: adminId,
          action: 'legal.document.upsert',
          targetType: 'legal_document',
          targetId: doc.id,
          meta: { regionCode: doc.regionCode, docType: doc.docType, version: doc.version },
        });
        return doc;
      }
    );
  },

  searchConsents(userId?: string) {
    return complianceRepository.adminSearchConsents(userId);
  },

  async createSanction(
    adminId: string,
    input: {
      userId: string;
      sanctionType: string;
      reason?: string;
      endsAt?: string | null;
    }
  ) {
    const created = await complianceRepository.createSanction({
      ...input,
      createdBy: adminId,
    });
    await complianceRepository.writeAuditLog({
      actorId: adminId,
      action: 'user.sanction.create',
      targetType: 'user',
      targetId: input.userId,
      meta: { sanctionType: input.sanctionType, sanctionId: created.id },
    });
    return created;
  },
};
