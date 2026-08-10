import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';
import { webhookRateLimit } from '../middlewares/rate-limit.middleware.js';

/**
 * Provider webhooks — no JWT (signature verified inside provider adapter).
 * Polar: POST /api/v1/webhook/polar
 */
export const webhookRouter = Router();

webhookRouter.post('/:provider', webhookRateLimit, webhookController.handleWebhook);
