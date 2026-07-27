/** Build a single #Hashtag token from a display name / gym name. */
export function toShareHashtag(raw: string | null | undefined): string {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/#/g, '')
    .replace(/\s+/g, '');
  if (!cleaned) return '';
  return `#${cleaned}`;
}

/**
 * Prefix tags (drawn above) then base tags from i18n (e.g. `#MachineFit #업적`).
 * Footer draws one tag per line, top → bottom.
 */
export function buildShareHashtags(prefixTags: string[], baseHashtags: string): string {
  const prefix = prefixTags.map((t) => t.trim()).filter(Boolean);
  const base = baseHashtags.split(/\s+/).filter(Boolean);
  return [...prefix, ...base].join(' ');
}

export function countShareHashtagLines(hashtags: string): number {
  return Math.max(1, hashtags.split(/\s+/).filter(Boolean).length);
}

/** Grow footer so multi-line hashtags on the right stay inside the card. */
export function measureShareFooterH(
  hashtags: string,
  options?: { minH?: number; lineH?: number; textH?: number }
): number {
  const minH = options?.minH ?? 56;
  const lineH = options?.lineH ?? 26;
  const textH = options?.textH ?? 24;
  const n = countShareHashtagLines(hashtags);
  return Math.max(minH, (n - 1) * lineH + textH + 8);
}
