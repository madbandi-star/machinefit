import type { Request, Response } from 'express';
import { billingService } from '../services/billing.service.js';
import { PAYMENT_PROVIDER_IDS } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';

const PROVIDER_SET = new Set<string>(PAYMENT_PROVIDER_IDS);

type ReqWithRaw = Request & { rawBody?: string };

/**
 * Webhook endpoint per provider path.
 * Polar: POST /webhook/polar and POST /polar/webhook
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const provider = String(req.params.provider || 'polar').toLowerCase();
  if (!PROVIDER_SET.has(provider)) {
    throw new AppError(404, 'UNKNOWN_PROVIDER', `Unknown payment provider: ${provider}`);
  }

  const raw =
    (req as ReqWithRaw).rawBody ??
    (typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}));

  const data = await billingService.handleProviderWebhook(
    provider,
    req.headers as Record<string, string | string[] | undefined>,
    raw
  );

  res.status(202).json({ success: true, data });
}

/** Spec alias: POST /polar/webhook */
export async function handlePolarWebhook(req: Request, res: Response): Promise<void> {
  req.params.provider = 'polar';
  return handleWebhook(req, res);
}
