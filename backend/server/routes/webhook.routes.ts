import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';

/**
 * Provider webhook stubs — no auth (signature verified inside provider adapter).
 * Currently mock-only via DummyPaymentProvider parser.
 */
export const webhookRouter = Router();

webhookRouter.post('/:provider', webhookController.handleWebhook);
