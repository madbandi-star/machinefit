export function isValidMachineCode(code: string): boolean {
  return /^[A-Z0-9_]+$/.test(code) && code.length >= 3 && code.length <= 80;
}

export function buildMachineCode(brandCode: string, machineSlug: string): string {
  const brand = brandCode.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const slug = machineSlug.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return `${brand}_${slug}`;
}

export function parseMachineCode(code: string): { brandPrefix: string; slug: string } | null {
  if (!isValidMachineCode(code)) return null;
  const parts = code.split('_');
  if (parts.length < 2) return null;
  return {
    brandPrefix: parts[0],
    slug: parts.slice(1).join('_'),
  };
}
