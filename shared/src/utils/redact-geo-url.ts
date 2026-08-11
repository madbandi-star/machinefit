const GEO_QUERY_KEYS = new Set(['lat', 'lng', 'latitude', 'longitude']);

/** Strip user GPS query params from URLs before logs / Sentry. */
export function redactGeoFromUrl(url: string | undefined | null): string {
  if (!url) return '';
  const qIndex = url.indexOf('?');
  if (qIndex < 0) return url;
  const path = url.slice(0, qIndex);
  const qs = url.slice(qIndex + 1);
  try {
    const params = new URLSearchParams(qs);
    let changed = false;
    for (const key of [...params.keys()]) {
      if (GEO_QUERY_KEYS.has(key.toLowerCase())) {
        params.delete(key);
        changed = true;
      }
    }
    if (!changed) return url;
    const next = params.toString();
    return next ? `${path}?${next}` : path;
  } catch {
    return path;
  }
}
