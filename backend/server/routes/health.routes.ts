import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';
import * as drHealthController from '../controllers/dr-health.controller.js';

export const healthRouter = Router();

/** Render liveness — always 200 while process is up (do not add DB checks). */
healthRouter.get('/health', healthController.healthCheck);
healthRouter.get('/warmup', healthController.warmup);
/** Readiness under API prefix (DB + storage). */
healthRouter.get('/ready', (req, res, next) => {
  void drHealthController.readyCheck(req, res, next);
});
/**
 * Process liveness under API prefix.
 * Named `/liveness` (not `/live`) to avoid colliding with live-dashboard routes.
 */
healthRouter.get('/liveness', (req, res) => {
  drHealthController.liveCheck(req, res);
});
/** Deploy metadata (env / version / commit) — non-secret. */
healthRouter.get('/meta', (req, res) => {
  drHealthController.metaCheck(req, res);
});

