/**
 * Lightweight keyword filter for UGC (community). Not a substitute for human moderation.
 * Rejects obvious abuse/NSFW tokens; clean content passes unchanged.
 */

const BLOCKED_PATTERNS: RegExp[] = [
  /시발|씨발|병신|지랄|개새끼|니애미/i,
  /\bf+u+c+k+\b/i,
  /\bshit\b/i,
  /\basshole\b/i,
  /야동|포르노|음란물|아동포르노|child\s*porn/i,
  /자살\s*방법|폭탄\s*제조/i,
];

export function findBlockedContentMatch(text: string): string | null {
  const sample = text.trim();
  if (!sample) return null;
  for (const re of BLOCKED_PATTERNS) {
    if (re.test(sample)) {
      return re.source.slice(0, 40);
    }
  }
  return null;
}

export function assertContentAllowed(text: string): void {
  const hit = findBlockedContentMatch(text);
  if (hit) {
    const err = new Error('CONTENT_POLICY_VIOLATION');
    (err as Error & { code: string }).code = 'CONTENT_POLICY_VIOLATION';
    throw err;
  }
}
