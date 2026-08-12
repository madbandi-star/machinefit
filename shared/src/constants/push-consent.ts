import type { PushKind } from '../types/push-notification.types.js';
import type { NotificationType } from '../types/notification.types.js';

/** Consent gate required before delivering a push / inbox notification. */
export const PUSH_CONSENT_CATEGORIES = ['marketing', 'service'] as const;
export type PushConsentCategory = (typeof PUSH_CONSENT_CATEGORIES)[number];

/** Campaign kinds that are event / promotion (marketing). */
export const PUSH_MARKETING_KINDS: readonly PushKind[] = ['general', 'event'];

/** Campaign kinds that are non-marketing service notices. */
export const PUSH_SERVICE_KINDS: readonly PushKind[] = [
  'notice',
  'workout',
  'schedule',
  'trade',
];

export function getPushConsentCategoryForKind(kind: PushKind): PushConsentCategory {
  return PUSH_MARKETING_KINDS.includes(kind) ? 'marketing' : 'service';
}

/**
 * Operator / campaign-style inbox types that must respect consent toggles.
 * Peer social types (friend_*, photo_*, online_pt_*) stay transactional.
 */
export function getPushConsentCategoryForNotificationType(
  type: NotificationType
): PushConsentCategory | null {
  switch (type) {
    case 'push_general':
    case 'push_event':
    case 'announcement':
      return 'marketing';
    case 'push_notice':
    case 'push_workout':
    case 'push_schedule':
    case 'push_trade':
    case 'system':
      return 'service';
    default:
      return null;
  }
}

/**
 * Heuristic: marketing / promo wording must not be sent as a "service" kind.
 * Conservative — false positives block send; admin can switch kind to marketing.
 */
const MARKETING_CONTENT_PATTERNS: RegExp[] = [
  /할인/,
  /쿠폰/,
  /프로모션/,
  /이벤트/,
  /특가/,
  /세일/,
  /혜택/,
  /무료\s*체험/,
  /무료\s*1\s*개월/,
  /친구\s*초대/,
  /추천\s*인/,
  /구독\s*하/,
  /프리미엄/,
  /유료/,
  /구매\s*하/,
  /지금\s*가입/,
  /광고/,
  /\bdiscount\b/i,
  /\bcoupon\b/i,
  /\bpromo(tion)?\b/i,
  /\bevent\b/i,
  /\bsale\b/i,
  /\bfree\s*(month|trial)\b/i,
  /\bsubscribe\b/i,
  /\bpremium\b/i,
  /\bbuy\s+now\b/i,
  /\bspecial\s+offer\b/i,
  /\brefer(ral|\s*a\s*friend)?\b/i,
];

export function detectMarketingContent(title: string, body: string): boolean {
  const text = `${title}\n${body}`.trim();
  if (!text) return false;
  return MARKETING_CONTENT_PATTERNS.some((re) => re.test(text));
}

/**
 * Service-kind campaigns with marketing-looking copy must be rejected
 * (no silent reclassification / bypass).
 */
export function assertServiceKindContentAllowed(
  kind: PushKind,
  title: string,
  body: string
): { ok: true } | { ok: false; code: 'MARKETING_CONTENT_AS_SERVICE' } {
  const category = getPushConsentCategoryForKind(kind);
  if (category !== 'service') return { ok: true };
  if (detectMarketingContent(title, body)) {
    return { ok: false, code: 'MARKETING_CONTENT_AS_SERVICE' };
  }
  return { ok: true };
}
