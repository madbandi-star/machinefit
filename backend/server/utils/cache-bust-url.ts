/** Append or replace a `v=` query param so immutable CDN/browser caches refetch. */
export function withCacheBust(url: string | null | undefined, version: number): string | null {
  if (!url) return null;
  const cleaned = url
    .replace(/([?&])v=[^&]*/g, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?');
  const separator = cleaned.includes('?') ? '&' : '?';
  return `${cleaned}${separator}v=${version}`;
}
