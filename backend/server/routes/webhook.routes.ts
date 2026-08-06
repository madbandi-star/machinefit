import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';

/**
 * Provider webhooks — no JWT (signature verified inside provider adapter).
 * Polar: POST /api/v1/webhook/polar
 */
export const webhookRouter = Router();

webhookRouter.post('/:provider', webhookController.handleWebhook);
