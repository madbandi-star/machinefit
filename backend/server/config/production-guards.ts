import { env } from './env.js';
import { logger } from '../utils/logger.js';

const WEAK_JWT = new Set([
  'dev-secret-change-in-production',
  'dev-refresh-secret-change-in-production',
  'change-me-in-production',
  'change-me-refresh-in-production',
  'secret',
  'jwt-secret',
]);

/**
 * Fail closed in production when critical runtime config is missing/weak.
 * Call once at process bootstrap before accepting traffic.
 */
export function assertProductionSafety(): void {
  if (env.NODE_ENV !== 'production') return;

  const failures: string[] = [];

  if (!env.DATABASE_URL?.trim()) {
    failures.push('DATABASE_URL is required in production (refuse in-memory mock mode)');
  }

  if (!env.JWT_SECRET?.trim() || WEAK_JWT.has(env.JWT_SECRET) || env.JWT_SECRET.length < 32) {
    failures.push('JWT_SECRET must be a strong secret (≥32 chars) in production');
  }

  if (
    !env.JWT_REFRESH_SECRET?.trim() ||
    WEAK_JWT.has(env.JWT_REFRESH_SECRET) ||
    env.JWT_REFRESH_SECRET.length < 32
  ) {
    failures.push('JWT_REFRESH_SECRET must be a strong secret (≥32 chars) in production');
  }

  if (env.JWT_SECRET && env.JWT_REFRESH_SECRET && env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    failures.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  if (failures.length > 0) {
    for (const message of failures) {
      logger.error(`[production-guard] ${message}`);
    }
    throw new Error(`Production safety check failed: ${failures.join('; ')}`);
  }
}
