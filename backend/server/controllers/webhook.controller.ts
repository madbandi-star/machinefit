import type { Request, Response } from 'express';
import { billingService } from '../services/billing.service.js';
import { PAYMENT_PROVIDER_IDS } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';

const PROVIDER_SET = new Set<string>(PAYMENT_PROVIDER_IDS);

/**
 * Mock webhook endpoint per provider path.
 * Verification + event application are separated in billing.service.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const provider = String(req.params.provider || '').toLowerCase();
  if (!PROVIDER_SET.has(provider)) {
    throw new AppError(404, 'UNKNOWN_PROVIDER', `Unknown payment provider: ${provider}`);
  }

  const rawBody =
    typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body ?? {});

  const data = await billingService.handleProviderWebhook(
    provider,
    req.headers as Record<string, string | string[] | undefined>,
    rawBody
  );

  res.json({ success: true, data });
}
