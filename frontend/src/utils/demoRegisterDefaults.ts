import { DEMO_PASSWORD } from '@machinefit/shared';

/** Local counter for sequential demo ids: demo_test1, demo_test2, ... */
const DEMO_REGISTER_SEQ_KEY = 'machinefit:demo-register-seq-v2';

export const DEMO_REGISTER_PASSWORD = DEMO_PASSWORD;
export const DEMO_HOME_GYM_NAME = '머신핏GYM';
/** Default login email local-part (full email uses gmail.com). */
export const DEMO_LOGIN_ID = 'demo_test';
export const DEMO_LOGIN_EMAIL = `${DEMO_LOGIN_ID}@gmail.com`;

export const POPULAR_EMAIL_DOMAINS = [
  'gmail.com',
  'naver.com',
  'daum.net',
  'outlook.com',
  'kakao.com',
] as const;

export type PopularEmailDomain = (typeof POPULAR_EMAIL_DOMAINS)[number];

function readDemoSeq(): number {
  try {
    const raw = localStorage.getItem(DEMO_REGISTER_SEQ_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeDemoSeq(value: number): void {
  try {
    localStorage.setItem(DEMO_REGISTER_SEQ_KEY, String(value));
  } catch {
    // ignore storage errors in demo helper
  }
}

function formatDemoId(seq: number): string {
  return `demo_test${seq}`;
}

export function getDemoRegisterSlot(): { displayName: string; emailLocal: string; seq: number } {
  const seq = readDemoSeq() + 1;
  const demoId = formatDemoId(seq);
  return {
    seq,
    displayName: demoId,
    emailLocal: demoId,
  };
}

export function markDemoRegisterSlotUsed(): void {
  writeDemoSeq(readDemoSeq() + 1);
}

export function buildDemoEmail(localPart: string, domain: string): string {
  return `${localPart.trim()}@${normalizeEmailDomain(domain)}`;
}

export function normalizeEmailDomain(domain: string): string {
  return domain.trim().replace(/^@+/, '').toLowerCase();
}

export function isPopularEmailDomain(domain: string): domain is PopularEmailDomain {
  return (POPULAR_EMAIL_DOMAINS as readonly string[]).includes(domain);
}
