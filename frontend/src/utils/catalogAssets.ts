/** Static catalog asset helpers (GitHub Pages `/machinefit/assets/...`). */

const BRAND_SLUGS: Record<string, string> = {
  HAMMER_STRENGTH: 'hammer_strength',
  LIFE_FITNESS: 'life_fitness',
  CYBEX: 'cybex',
  TECHNOGYM: 'technogym',
};

/** Packaged SVGs under `public/assets/machines/**` — only these local paths are emitted. */
const KNOWN_MACHINE_ASSETS = new Set<string>([
  'CY_ABDOMINAL',
  'CY_BACK_EXTENSION',
  'CY_BICEPS_CURL',
  'CY_CHEST_PRESS',
  'CY_LAT_PULLDOWN',
  'CY_LEG_CURL',
  'CY_LEG_EXTENSION',
  'CY_LEG_PRESS',
  'CY_PEC_FLY',
  'CY_SEATED_ROW',
  'CY_SHOULDER_PRESS',
  'CY_TRICEPS_EXTENSION',
  'HS_BICEPS_CURL',
  'HS_ISO_LATERAL_CHEST_PRESS',
  'HS_ISO_LATERAL_HIGH_ROW',
  'HS_ISO_LATERAL_ROW',
  'HS_LAT_PULLDOWN',
  'HS_LEG_CURL',
  'HS_LEG_EXTENSION',
  'HS_LEG_PRESS',
  'HS_PEC_FLY',
  'HS_SELECTORIZED_CHEST_PRESS',
  'HS_SHOULDER_PRESS',
  'HS_TRICEPS_EXTENSION',
  'LF_ABDOMINAL',
  'LF_BACK_EXTENSION',
  'LF_BICEPS_CURL',
  'LF_CHEST_PRESS',
  'LF_LAT_PULLDOWN',
  'LF_LEG_CURL',
  'LF_LEG_EXTENSION',
  'LF_LEG_PRESS',
  'LF_PEC_FLY',
  'LF_SEATED_ROW',
  'LF_SHOULDER_PRESS',
  'LF_TRICEPS_PRESS',
  'TG_ABDOMINAL',
  'TG_BICEPS_CURL',
  'TG_CHEST_PRESS',
  'TG_LAT_MACHINE',
  'TG_LEG_CURL',
  'TG_LEG_EXTENSION',
  'TG_LEG_PRESS',
  'TG_LOWER_BACK',
  'TG_LOW_ROW',
  'TG_PEC_FLY',
  'TG_SHOULDER_PRESS',
  'TG_TRICEPS_EXTENSION',
]);

function assetBase(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export function brandAssetSlug(brandCode: string): string | null {
  return BRAND_SLUGS[brandCode] ?? null;
}

/** Prefer API logoUrl; fall back to packaged brand SVG when missing. */
export function resolveBrandLogoUrl(brandCode: string, logoUrl?: string | null): string | undefined {
  if (logoUrl) return logoUrl;
  const slug = brandAssetSlug(brandCode);
  if (!slug) return undefined;
  return `${assetBase()}assets/brands/${slug}.svg`;
}

/** Prefer API primaryImageUrl; fall back to packaged machine SVG only when the file exists. */
export function resolveMachineImageUrl(
  machineCode: string,
  primaryImageUrl?: string | null
): string | undefined {
  if (primaryImageUrl) return primaryImageUrl;

  if (!KNOWN_MACHINE_ASSETS.has(machineCode)) return undefined;

  const prefix = machineCode.split('_')[0];
  const brandSlug =
    prefix === 'HS'
      ? 'hammer_strength'
      : prefix === 'LF'
        ? 'life_fitness'
        : prefix === 'CY'
          ? 'cybex'
          : prefix === 'TG'
            ? 'technogym'
            : null;
  if (!brandSlug) return undefined;

  return `${assetBase()}assets/machines/${brandSlug}/${machineCode.toLowerCase()}.svg`;
}

export function machinePlaceholderUrl(): string {
  return `${assetBase()}assets/machines/placeholder.svg`;
}
