import { API_BASE_URL } from '@/services/http/axios-client';
import { resolveBrandMediaUrl } from './brandMediaUrl';

/** Static catalog asset helpers (GitHub Pages `/machinefit/assets/...`). */

const BRAND_SLUGS: Record<string, string> = {
  HAMMER_STRENGTH: 'hammer_strength',
  LIFE_FITNESS: 'life_fitness',
  CYBEX: 'cybex',
  TECHNOGYM: 'technogym',
};

/** Packaged third-party product photos without a license file — do not serve. */
const UNLICENSED_PACKAGED_PHOTOS = new Set<string>([
  'HS_ISO_LATERAL_HIGH_ROW',
  'HS_ISO_LATERAL_ROW',
  'HS_LAT_PULLDOWN',
  'HS_ISO_LATERAL_CHEST_PRESS',
  'HS_ISO_LATERAL_INCLINE_CHEST_PRESS',
  'HS_SHOULDER_PRESS',
  'HS_LEG_PRESS',
  'HS_LEG_EXTENSION',
  'HS_LEG_CURL',
  'HS_V_SQUAT',
]);

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
  'HS_ISO_LATERAL_INCLINE_CHEST_PRESS',
  'HS_ISO_LATERAL_ROW',
  'HS_LAT_PULLDOWN',
  'HS_LEG_CURL',
  'HS_LEG_EXTENSION',
  'HS_LEG_PRESS',
  'HS_PEC_FLY',
  'HS_SELECTORIZED_CHEST_PRESS',
  'HS_SHOULDER_PRESS',
  'HS_TRICEPS_EXTENSION',
  'HS_V_SQUAT',
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

/** True when search brand chips should render a full wordmark (no companion text). */
export function brandUsesWordmarkChip(_brandCode: string): boolean {
  return false;
}

/** Prefer operator SVG / API logo. Do not ship unlicensed brand wordmark PNGs. */
export function resolveBrandLogoUrl(brandCode: string, logoUrl?: string | null): string | undefined {
  if (logoUrl) {
    const resolved = resolveBrandMediaUrl(logoUrl) || logoUrl;
    // Guard against accidental cross-brand media URLs (e.g. wrong admin mapping).
    if (resolved.includes('/media/brand-assets/')) {
      const marker = '/media/brand-assets/';
      const start = resolved.indexOf(marker) + marker.length;
      const rest = resolved.slice(start);
      const codeInUrl = decodeURIComponent(rest.split('/')[0] || '').toUpperCase();
      if (codeInUrl && codeInUrl !== brandCode.toUpperCase()) {
        // Fall through to packaged SVG for this brand code.
      } else {
        return resolved;
      }
    } else {
      return resolved;
    }
  }
  const slug = brandAssetSlug(brandCode);
  if (!slug) return undefined;
  return `${assetBase()}assets/brands/${slug}.svg`;
}

function brandSlugForMachineCode(machineCode: string): string | null {
  const prefix = machineCode.split('_')[0];
  if (prefix === 'HS') return 'hammer_strength';
  if (prefix === 'LF') return 'life_fitness';
  if (prefix === 'CY') return 'cybex';
  if (prefix === 'TG') return 'technogym';
  return null;
}

function packagedMachineAssetUrl(machineCode: string): string | undefined {
  if (!KNOWN_MACHINE_ASSETS.has(machineCode)) return undefined;
  if (UNLICENSED_PACKAGED_PHOTOS.has(machineCode)) return undefined;
  const brandSlug = brandSlugForMachineCode(machineCode);
  if (!brandSlug) return undefined;
  return `${assetBase()}assets/machines/${brandSlug}/${machineCode.toLowerCase()}.svg`;
}

function isUnlicensedPackagedPhotoUrl(url: string): boolean {
  return /\/assets\/machines\/[^/]+\/hs_[^/]+\.png(\?|$)/i.test(url)
    || /\/assets\/brands\/life_fitness_wordmark\.png(\?|$)/i.test(url);
}

function isBundledMachineAssetUrl(url: string): boolean {
  return /\/assets\/machines\//i.test(url);
}

function isAdminMachineCoverUrl(url: string): boolean {
  return /\/media\/machine-covers\//i.test(url);
}

/** Point `/media/machine-covers/...` at the configured API host (relative or wrong host). */
function normalizeMachineCoverMediaUrl(url: string): string {
  const apiBase = API_BASE_URL.replace(/\/+$/, '');
  const marker = '/media/machine-covers/';
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(marker);
    if (idx < 0) return url;
    return `${apiBase}${parsed.pathname.slice(idx)}${parsed.search}`;
  } catch {
    const idx = url.indexOf(marker);
    if (idx >= 0) return `${apiBase}${url.slice(idx)}`;
    if (url.startsWith('/')) return `${apiBase}${url}`;
    return url;
  }
}

/**
 * Admin/API covers win over packaged catalog SVGs.
 * Unlicensed bundled product PNGs stay blocked; other remote covers (incl. Supabase) show.
 */
export function resolveMachineImageUrl(
  machineCode: string,
  primaryImageUrl?: string | null
): string | undefined {
  if (primaryImageUrl && !isUnlicensedPackagedPhotoUrl(primaryImageUrl)) {
    if (isAdminMachineCoverUrl(primaryImageUrl)) {
      return normalizeMachineCoverMediaUrl(primaryImageUrl);
    }
    // Operator uploads often store Supabase public URLs — do not drop them for placeholder.
    if (!isBundledMachineAssetUrl(primaryImageUrl)) {
      return primaryImageUrl.startsWith('/')
        ? `${API_BASE_URL.replace(/\/+$/, '')}${primaryImageUrl}`
        : primaryImageUrl;
    }
  }

  const packaged = packagedMachineAssetUrl(machineCode);
  if (packaged) return packaged;

  if (
    primaryImageUrl &&
    !isUnlicensedPackagedPhotoUrl(primaryImageUrl) &&
    primaryImageUrl.toLowerCase().endsWith('.svg')
  ) {
    return primaryImageUrl;
  }

  return machinePlaceholderUrl();
}

/** Public media URL for admin machine covers (optional per-muscle variant). */
export function machineCoverMediaUrl(
  machineCode: string,
  targetMuscleGroup?: string | null
): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  if (targetMuscleGroup) {
    return `${base}/media/machine-covers/${encodeURIComponent(machineCode)}/${encodeURIComponent(targetMuscleGroup)}/main`;
  }
  return `${base}/media/machine-covers/${encodeURIComponent(machineCode)}/main`;
}

/**
 * Records / home cards: prefer API image, then muscle/default cover endpoint, then packaged.
 * Cover URLs are tried even when search was never opened (plan-add / log-only rows).
 */
export function resolveRecordMachineImageUrl(
  machineCode: string,
  options?: {
    primaryImageUrl?: string | null;
    targetMuscleGroup?: string | null;
    preferMuscleCover?: boolean;
  }
): string | undefined {
  const preferMuscle = Boolean(options?.preferMuscleCover && options.targetMuscleGroup);
  if (preferMuscle) {
    return (
      resolveMachineImageUrl(
        machineCode,
        machineCoverMediaUrl(machineCode, options?.targetMuscleGroup)
      ) ?? resolveMachineImageUrl(machineCode, options?.primaryImageUrl)
    );
  }

  const fromApiOrPackaged = resolveMachineImageUrl(machineCode, options?.primaryImageUrl);
  const placeholder = machinePlaceholderUrl();
  if (fromApiOrPackaged && fromApiOrPackaged !== placeholder) {
    return fromApiOrPackaged;
  }

  if (options?.targetMuscleGroup) {
    return machineCoverMediaUrl(machineCode, options.targetMuscleGroup);
  }
  return machineCoverMediaUrl(machineCode);
}

export function machinePlaceholderUrl(): string {
  return `${assetBase()}assets/machines/placeholder.svg`;
}

/** True when the resolved URL is a common/standard-type catalog photo (not brand-specific). */
export function isStandardMachineImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\/media\/standard-machine-images\//i.test(url);
}
