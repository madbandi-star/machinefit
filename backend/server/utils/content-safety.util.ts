import { findBlockedContentMatch } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';

/**
 * Reject free-text UGC that matches the shared keyword blocklist.
 * Call at write boundaries (services/controllers) before persistence.
 */
export function assertSafeUgc(...parts: Array<string | undefined | null>): void {
  for (const part of parts) {
    if (part == null) continue;
    const sample = String(part);
    if (!sample.trim()) continue;
    if (findBlockedContentMatch(sample)) {
      throw new AppError(
        400,
        'CONTENT_POLICY_VIOLATION',
        'Content violates community guidelines'
      );
    }
  }
}
