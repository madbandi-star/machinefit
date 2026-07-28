/**
 * Allow only http(s) URLs for user-controlled href attributes.
 * Returns null when the value is missing or uses a dangerous scheme.
 */
export function safeHttpUrl(raw?: string | null): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}
