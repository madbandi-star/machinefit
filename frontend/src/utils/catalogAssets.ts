/** Static catalog asset helpers (GitHub Pages `/machinefit/assets/...`). */

const BRAND_SLUGS: Record<string, string> = {
  HAMMER_STRENGTH: 'hammer_strength',
  LIFE_FITNESS: 'life_fitness',
  CYBEX: 'cybex',
  TECHNOGYM: 'technogym',
};

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

/** Prefer API primaryImageUrl; fall back to packaged machine SVG when known. */
export function resolveMachineImageUrl(
  machineCode: string,
  primaryImageUrl?: string | null
): string | undefined {
  if (primaryImageUrl) return primaryImageUrl;

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
