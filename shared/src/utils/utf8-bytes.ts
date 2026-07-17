export const WORKOUT_DIARY_MAX_BYTES = 100;

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function truncateUtf8(value: string, maxBytes: number): string {
  if (getUtf8ByteLength(value) <= maxBytes) return value;

  let result = '';
  for (const char of value) {
    const candidate = result + char;
    if (getUtf8ByteLength(candidate) > maxBytes) break;
    result = candidate;
  }
  return result;
}
