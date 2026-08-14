/**
 * MachineFit public username (stored as users.display_name / User.displayName).
 *
 * Privacy design (technical control — not a legal determination):
 * - Social provider profile names are NEVER used as inputs here.
 * - Random signup usernames are MachineFit-generated only.
 * - validateUsername() is the single gate for signup assignment, self-change, and admin change.
 */

import { findBlockedContentMatch } from './content-safety.js';

export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 32;
/** Lifetime self-serve username changes allowed per account (My Page). */
export const USERNAME_MAX_CHANGES = 3;

/** Fitness-themed Korean prefixes for auto-generated signup usernames. */
export const USERNAME_RANDOM_PREFIXES = [
  '머신러너',
  '핏메이트',
  '운동러',
  '헬스러',
  '머신핏유저',
  '짐메이트',
  '스트롱러',
  '리프터',
  '핏러너',
  '헬스메이트',
] as const;

export type UsernameValidationCode =
  | 'EMPTY'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_CHARS'
  | 'HAS_SPACE'
  | 'PROFANITY'
  | 'IMPERSONATION'
  | 'PHONE_LIKE'
  | 'EMAIL_LIKE'
  | 'REAL_NAME_LIKE'
  | 'RESERVED'
  | 'PROVIDER_NAME_MATCH';

export type UsernameValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; code: UsernameValidationCode; message: string };

const RESERVED = new Set(
  [
    'admin',
    'administrator',
    'root',
    'system',
    'support',
    'official',
    'machinefit',
    '머신핏',
    '관리자',
    '운영자',
    '공식',
    '공식계정',
    '고객센터',
    '헬프',
    'help',
    'moderator',
    'staff',
    '탈퇴회원',
  ].map((s) => s.toLowerCase())
);

/** Common Korean surnames used only for obvious full-name shaped strings. */
const KOREAN_SURNAMES =
  '김|이|박|최|정|강|조|윤|장|임|한|오|서|신|권|황|안|송|류|전|홍|고|문|양|손|배|백|허|유|남|심|노|하|곽|성|차|주|우|구|나|민|진|엄|채|원|천|방|공|현|함|변|염|석|선|설|마|길|연|위|표|명|기|반|왕|금|옥|육|인|맹|제|모|어|추';

/** Hangul syllables / Latin letters / digits / underscore — no spaces or symbols. */
const ALLOWED_RE = /^[\uAC00-\uD7A3a-zA-Z0-9_]+$/;

const REAL_NAME_HANGUL_RE = new RegExp(`^(?:${KOREAN_SURNAMES})[가-힣]{1,2}$`);

const IMPERSONATION_RE =
  /(관리자|운영자|공식계정|공식\s*계정|고객센터|machinefit\s*official|mf\s*admin)/i;

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0]! % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/** Unicode NFC + trim + strip zero-width / control chars. Does not alter letter case. */
export function normalizeUsername(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

/** Case-insensitive key for uniqueness (Latin). Hangul unchanged. */
export function usernameUniqueKey(normalized: string): string {
  return normalized.normalize('NFC').toLocaleLowerCase('en-US');
}

/**
 * Auto-assign on social signup. Never accepts provider/PII inputs.
 */
export function generateRandomUsername(): string {
  const prefix =
    USERNAME_RANDOM_PREFIXES[randomInt(USERNAME_RANDOM_PREFIXES.length)] ?? '머신핏유저';
  const digits = String(randomInt(10000)).padStart(4, '0');
  return `${prefix}${digits}`;
}

/** Nickname-style endings — do not treat as real names even with a surname prefix. */
const NICKNAME_STYLE_SUFFIX_RE = /(맨|씨|님|킹|짱|러|너|터|즈|요|잉|쿤|돌이|순이)$/;

/**
 * Obvious Korean full-name shape only (e.g. 홍길동, 김철수).
 * Does NOT block nicknames that merely contain a surname (헬창김씨, 김치맨, 운동하는박씨).
 */
export function looksLikeKoreanRealName(normalized: string): boolean {
  if (!/^[가-힣]{2,4}$/.test(normalized)) return false;
  if (/\d/.test(normalized)) return false;
  if (NICKNAME_STYLE_SUFFIX_RE.test(normalized)) return false;
  return REAL_NAME_HANGUL_RE.test(normalized);
}

/**
 * Compare user-chosen username to a transient provider profile name.
 * Call only with in-memory provider name; do not persist provider names for this check.
 */
export function usernameMatchesProviderProfileName(
  normalizedUsername: string,
  providerProfileName: string | null | undefined
): boolean {
  if (!providerProfileName) return false;
  const a = usernameUniqueKey(normalizeUsername(normalizedUsername).replace(/\s+/g, ''));
  const b = usernameUniqueKey(normalizeUsername(providerProfileName).replace(/\s+/g, ''));
  if (!a || !b) return false;
  if (a === b) return true;
  // Compact Latin transliteration-ish: ignore non-alphanumerics
  const compact = (s: string) => s.replace(/[^a-z0-9가-힣]/g, '');
  return compact(a) === compact(b) && compact(a).length >= 2;
}

export function validateUsername(
  raw: string,
  options?: { providerProfileName?: string | null }
): UsernameValidationResult {
  const normalized = normalizeUsername(raw);
  if (!normalized) {
    return { ok: false, code: 'EMPTY', message: 'Username is required' };
  }
  if (/\s/.test(normalized)) {
    return { ok: false, code: 'HAS_SPACE', message: 'Username cannot contain spaces' };
  }
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return { ok: false, code: 'TOO_SHORT', message: 'Username is too short' };
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return { ok: false, code: 'TOO_LONG', message: 'Username is too long' };
  }
  if (!ALLOWED_RE.test(normalized)) {
    return {
      ok: false,
      code: 'INVALID_CHARS',
      message: 'Username contains invalid characters',
    };
  }
  if (/@/.test(normalized) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(normalized)) {
    return { ok: false, code: 'EMAIL_LIKE', message: 'Email-shaped usernames are not allowed' };
  }
  if (/^0\d{8,11}$/.test(normalized) || /^01[016789]\d{7,8}$/.test(normalized)) {
    return { ok: false, code: 'PHONE_LIKE', message: 'Phone-shaped usernames are not allowed' };
  }
  if (RESERVED.has(usernameUniqueKey(normalized))) {
    return { ok: false, code: 'RESERVED', message: 'This username is reserved' };
  }
  if (IMPERSONATION_RE.test(normalized)) {
    return {
      ok: false,
      code: 'IMPERSONATION',
      message: 'Username appears to impersonate staff or official accounts',
    };
  }
  if (findBlockedContentMatch(normalized)) {
    return { ok: false, code: 'PROFANITY', message: 'Username violates content policy' };
  }
  if (looksLikeKoreanRealName(normalized)) {
    return {
      ok: false,
      code: 'REAL_NAME_LIKE',
      message: 'Real-name-shaped usernames are not allowed',
    };
  }
  if (usernameMatchesProviderProfileName(normalized, options?.providerProfileName)) {
    return {
      ok: false,
      code: 'PROVIDER_NAME_MATCH',
      message: 'Username must not match the social profile name',
    };
  }
  return { ok: true, normalized };
}
