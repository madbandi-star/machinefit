import type { Request } from 'express';
import { complianceRepository } from '../repositories/compliance.repository.js';

/** Fire-and-forget admin audit row. Never throws into the request. */
export function writeAdminAudit(
  req: Request,
  input: {
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
  }
): void {
  void complianceRepository
    .writeAuditLog({
      actorId: req.user?.userId ?? null,
      actorRole: req.user?.roleCode ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      meta: input.meta,
      ipAddress: req.ip ?? null,
      userAgent: String(req.headers['user-agent'] ?? '') || null,
    })
    .catch(() => undefined);
}
