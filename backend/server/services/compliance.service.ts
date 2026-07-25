import {
  LEGAL_DOC_VERSION,
  DEFAULT_LEGAL_REGION,
  type ConsentUpdateInput,
  type CreateSupportTicketInput,
} from '@machinefit/shared';
import { complianceRepository } from '../repositories/compliance.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

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
      locationOptIn?: boolean;
      pushServiceOptIn?: boolean;
    } = {};
    const consentItems: Array<{ type: string; version: string; agreed: boolean }> = [];

    if (input.marketingOptIn !== undefined) {
      flags.marketingOptIn = input.marketingOptIn;
      consentItems.push({ type: 'marketing', version, agreed: input.marketingOptIn });
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
      locationOptIn: user?.locationOptIn ?? false,
      pushServiceOptIn: user?.pushServiceOptIn ?? true,
    };
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
