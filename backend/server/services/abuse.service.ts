import type { AbuseEventSeverity, AbuseEventType } from '@machinefit/shared';
import { abuseRepository, hashIp } from '../repositories/abuse.repository.js';
import { logger } from '../utils/logger.js';

/** Fire-and-forget abuse signal — never throws to callers. */
export function recordAbuseSafe(input: {
  userId?: string | null;
  ip?: string | null;
  endpoint?: string;
  eventType: AbuseEventType | string;
  severity?: AbuseEventSeverity;
  requestCount?: number;
  metadata?: Record<string, unknown>;
}): void {
  void abuseRepository
    .record({
      userId: input.userId,
      ipHash: hashIp(input.ip),
      endpoint: input.endpoint,
      eventType: input.eventType,
      severity: input.severity,
      requestCount: input.requestCount,
      metadata: input.metadata,
    })
    .catch((err) => {
      logger.warn('abuse.record failed', { err, eventType: input.eventType });
    });
}
