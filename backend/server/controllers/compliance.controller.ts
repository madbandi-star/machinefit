import type { Request, Response } from 'express';
import {
  Role,
  adminLegalDocumentSchema,
  adminSanctionSchema,
  adminSupportTicketUpdateSchema,
  consentUpdateSchema,
  createSupportTicketSchema,
  legalDocumentsQuerySchema,
  supportTicketMessageSchema,
} from '@machinefit/shared';
import { complianceService } from '../services/compliance.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getRequestIp, getRequestUserAgent } from '../utils/request-meta.util.js';

function requireUser(req: Request) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user;
}

export async function listLegalDocuments(req: Request, res: Response): Promise<void> {
  const query = legalDocumentsQuerySchema.parse(req.query);
  const data = await complianceService.listLegalDocuments(query.regionCode, query.docType);
  res.json({ success: true, data });
}

export async function getPrivacySummary(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await complianceService.getPrivacySummary(user.userId);
  res.json({ success: true, data });
}

export async function exportPrivacy(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await complianceService.exportPrivacy(user.userId);
  res.json({ success: true, data });
}

export async function listMyConsents(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await complianceService.listConsents(user.userId);
  res.json({ success: true, data });
}

export async function updateMyConsents(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = consentUpdateSchema.parse(req.body);
  const data = await complianceService.updateConsents(user.userId, input, {
    ipAddress: getRequestIp(req),
    userAgent: getRequestUserAgent(req),
    source: 'settings',
  });
  res.json({ success: true, data });
}

export async function createTicket(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createSupportTicketSchema.parse(req.body);
  const data = await complianceService.createTicket(user.userId, input);
  res.status(201).json({ success: true, data });
}

export async function listTickets(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await complianceService.listTickets(user.userId);
  res.json({ success: true, data });
}

export async function getTicket(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await complianceService.getTicket(String(req.params.ticketId), user.userId);
  res.json({ success: true, data });
}

export async function addTicketMessage(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = supportTicketMessageSchema.parse(req.body);
  const data = await complianceService.addUserMessage(
    String(req.params.ticketId),
    user.userId,
    input.body
  );
  res.status(201).json({ success: true, data });
}

export async function adminOverview(_req: Request, res: Response): Promise<void> {
  const data = await complianceService.getOverview();
  res.json({ success: true, data });
}

export async function adminListTickets(req: Request, res: Response): Promise<void> {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const data = await complianceService.listAdminTickets(status);
  res.json({ success: true, data });
}

export async function adminUpdateTicket(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = adminSupportTicketUpdateSchema.parse(req.body);
  const data = await complianceService.adminUpdateTicket(
    String(req.params.ticketId),
    user.userId,
    input
  );
  res.json({ success: true, data });
}

export async function adminListAuditLogs(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const data = await complianceService.listAuditLogs(limit);
  res.json({ success: true, data });
}

export async function adminUpsertDocument(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = adminLegalDocumentSchema.parse(req.body);
  const data = await complianceService.upsertLegalDocument(user.userId, input);
  res.status(201).json({ success: true, data });
}

export async function adminSearchConsents(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  const data = await complianceService.searchConsents(userId);
  res.json({ success: true, data });
}

export async function adminCreateSanction(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (!user.roleCode || user.roleCode === Role.MEMBER) {
    /* requireMinRole on route handles this; keep controller thin */
  }
  const input = adminSanctionSchema.parse(req.body);
  const data = await complianceService.createSanction(user.userId, input);
  res.status(201).json({ success: true, data });
}
