import type { Request, Response } from 'express';
import { qrService } from '../services/qr.service.js';
import { getParam } from '../utils/params.util.js';

export async function resolveQrCode(req: Request, res: Response): Promise<void> {
  const result = await qrService.resolve(getParam(req.params.qrCode));
  res.json({ success: true, data: result });
}

export async function scanQrCode(req: Request, res: Response): Promise<void> {
  const qrCode = getParam(req.params.qrCode);
  const result = await qrService.scan(qrCode, {
    userId: req.user?.userId,
    sessionId: typeof req.body?.sessionId === 'string' ? req.body.sessionId : undefined,
  });
  res.json({ success: true, data: result });
}
