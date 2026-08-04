import { Router } from 'express';
import { Role } from '@machinefit/shared';
import { authMiddleware, optionalAuthMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';
import * as opsController from '../controllers/ops.controller.js';

export const opsRouter = Router();

/** Public/authenticated ingest — never require admin (clients report telemetry). */
opsRouter.post('/ingest', optionalAuthMiddleware, (req, res, next) => {
  void opsController.ingest(req, res, next);
});

/** Detailed health (also used by ops dashboard). */
opsRouter.get('/health', (req, res, next) => {
  void opsController.healthDetailed(req, res, next);
});

const admin = Router();
admin.use(authMiddleware, requireMinRole(Role.ADMIN));
admin.get('/dashboard', (req, res, next) => {
  void opsController.dashboard(req, res, next);
});
admin.get('/errors', (req, res, next) => {
  void opsController.errors(req, res, next);
});
admin.post('/errors/:id/resolve', (req, res, next) => {
  void opsController.resolveError(req, res, next);
});
admin.get('/api-stats', (req, res, next) => {
  void opsController.apiStats(req, res, next);
});
admin.get('/pages', (req, res, next) => {
  void opsController.pageStats(req, res, next);
});
admin.get('/features', (req, res, next) => {
  void opsController.featureStats(req, res, next);
});
admin.get('/logs', (req, res, next) => {
  void opsController.logs(req, res, next);
});
admin.get('/logs/export.csv', (req, res, next) => {
  void opsController.exportLogsCsv(req, res, next);
});
admin.get('/security', (req, res, next) => {
  void opsController.security(req, res, next);
});
admin.get('/audits', (req, res, next) => {
  void opsController.audits(req, res, next);
});
admin.get('/alerts', (req, res, next) => {
  void opsController.alerts(req, res, next);
});
admin.post('/alerts/:id/ack', (req, res, next) => {
  void opsController.ackAlert(req, res, next);
});
admin.get('/db/slow-queries', (req, res, next) => {
  void opsController.slowQueries(req, res, next);
});
admin.get('/reports', (req, res, next) => {
  void opsController.report(req, res, next);
});

opsRouter.use('/admin', admin);
