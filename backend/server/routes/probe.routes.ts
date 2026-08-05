import { Router } from 'express';
import * as drHealthController from '../controllers/dr-health.controller.js';

/**
 * Root-level probes (outside API_BASE_PATH).
 * Avoids colliding with product route `/api/v1/live/*` (live dashboard).
 */
export const probeRouter = Router();

probeRouter.get('/health', (req, res, next) => {
  void drHealthController.drHealthCheck(req, res, next);
});
probeRouter.get('/ready', (req, res, next) => {
  void drHealthController.readyCheck(req, res, next);
});
probeRouter.get('/live', (req, res) => {
  drHealthController.liveCheck(req, res);
});
