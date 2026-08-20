/**
 * Remove markdown-style horizontal rules (`---` alone on a line) from tip copy.
 * Keeps paragraph breaks; collapses runs of blank lines.
 */
export function stripHorizontalRuleSeparators(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !/^\s*-{3,}\s*$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Clean each tip string (and drop empties after stripping). */
export function stripProTipSeparatorsFromLines(lines: string[] | null | undefined): string[] {
  if (!lines?.length) return [];
  return lines
    .map((line) => stripHorizontalRuleSeparators(line))
    .filter(Boolean);
}

/** Clean locale → tip-lines maps used on machines.pro_tips. */
export function stripProTipSeparatorsFromLocalized(
  value: Record<string, string[]> | null | undefined
): Record<string, string[]> | undefined {
  if (!value) return undefined;
  const next: Record<string, string[]> = {};
  for (const [locale, lines] of Object.entries(value)) {
    const cleaned = stripProTipSeparatorsFromLines(lines);
    if (cleaned.length) next[locale] = cleaned;
  }
  return Object.keys(next).length ? next : undefined;
}
