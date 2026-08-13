import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as complianceController from '../controllers/compliance.controller.js';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';

export const complianceRouter = Router();

/** Public legal document catalog (region-aware). */
complianceRouter.get('/legal/documents', complianceController.listLegalDocuments);

/** Member privacy rights */
complianceRouter.get('/privacy/me', authMiddleware, complianceController.getPrivacySummary);
complianceRouter.get('/privacy/me/export', authMiddleware, complianceController.exportPrivacy);
complianceRouter.get('/privacy/me/consents', authMiddleware, complianceController.listMyConsents);
complianceRouter.patch(
  '/privacy/me/consents',
  authMiddleware,
  complianceController.updateMyConsents
);
complianceRouter.get(
  '/privacy/me/processing-purposes',
  authMiddleware,
  complianceController.getPrivacyProcessingPurposes
);
complianceRouter.get(
  '/privacy/me/rights-requests',
  authMiddleware,
  complianceController.listMyPrivacyRightsRequests
);
complianceRouter.get(
  '/privacy/me/rights-requests/:requestId',
  authMiddleware,
  complianceController.getMyPrivacyRightsRequest
);
complianceRouter.post(
  '/privacy/me/rights-requests',
  authMiddleware,
  complianceController.createMyPrivacyRightsRequest
);

/** Support / inquiry */
complianceRouter.post('/support/tickets', authMiddleware, complianceController.createTicket);
complianceRouter.get('/support/tickets', authMiddleware, complianceController.listTickets);
complianceRouter.get(
  '/support/tickets/:ticketId',
  authMiddleware,
  complianceController.getTicket
);
complianceRouter.post(
  '/support/tickets/:ticketId/messages',
  authMiddleware,
  complianceController.addTicketMessage
);

/** Admin compliance ops */
complianceRouter.get(
  '/admin/compliance/overview',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminOverview
);
complianceRouter.get(
  '/admin/compliance/consents',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminSearchConsents
);
complianceRouter.post(
  '/admin/compliance/documents',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminUpsertDocument
);
complianceRouter.get(
  '/admin/support/tickets',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminListTickets
);
complianceRouter.patch(
  '/admin/support/tickets/:ticketId',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminUpdateTicket
);
complianceRouter.get(
  '/admin/audit-logs',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminListAuditLogs
);
complianceRouter.post(
  '/admin/sanctions',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminCreateSanction
);
complianceRouter.get(
  '/admin/privacy-rights/requests',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminListPrivacyRightsRequests
);
complianceRouter.patch(
  '/admin/privacy-rights/requests/bulk',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminBulkUpdatePrivacyRightsRequests
);
complianceRouter.delete(
  '/admin/privacy-rights/requests',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminDeletePrivacyRightsRequests
);
complianceRouter.patch(
  '/admin/privacy-rights/requests/:requestId',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  complianceController.adminUpdatePrivacyRightsRequest
);
