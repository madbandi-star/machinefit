import { ROUTES } from '@/constants/routes';

const MACHINE_CODE_PATTERN = /^[A-Z0-9_]+$/;

export function extractQrCode(raw: string): string {
  return raw.trim();
}

export function parseMachineCodeFromQrPayload(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith('MF-')) {
    return value.slice(3);
  }

  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/machines\/([^/?#]+)/i);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    // not a URL
  }

  const pathMatch = value.match(/\/machines\/([^/?#]+)/i);
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);

  if (MACHINE_CODE_PATTERN.test(value)) return value;

  return null;
}

export function machineDetailPath(machineCode: string): string {
  return ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode);
}
