const DEMO_REGISTER_SEQ_KEY = 'machinefit:demo-register-seq';

export const DEMO_REGISTER_PASSWORD = 'demo1234';
export const DEMO_HOME_GYM_NAME = '머신핏GYM';

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

export function getDemoRegisterSlot(): { displayName: string; emailLocal: string; seq: number } {
  const seq = readDemoSeq() + 1;
  return {
    seq,
    displayName: `demo_test_#${seq}`,
    emailLocal: `demo_test_${seq}`,
  };
}

export function markDemoRegisterSlotUsed(): void {
  writeDemoSeq(readDemoSeq() + 1);
}

export function buildDemoEmail(localPart: string, domain: string): string {
  return `${localPart.trim()}@${domain}`;
}
