import type { Brand } from '@machinefit/shared';
import { BRAND_CODES } from '@machinefit/shared';

/** Only used when the catalog omits these search categories. */
const FALLBACK_SEARCH_BRANDS: Brand[] = [
  {
    id: 'brand-bodyweight',
    code: BRAND_CODES.BODYWEIGHT,
    name: { ko: '맨몸', en: 'Bodyweight', ja: '自重', zh: '自重' },
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'brand-free-weight',
    code: BRAND_CODES.FREE_WEIGHT,
    name: { ko: '프리', en: 'Free', ja: 'フリー', zh: '自由重量' },
    sortOrder: 1,
    isActive: true,
  },
];

function mergeMissingBrands(brands: Brand[]): Brand[] {
  const merged = [...brands];

  for (const fallback of FALLBACK_SEARCH_BRANDS) {
    if (!merged.some((brand) => brand.code === fallback.code)) {
      merged.push(fallback);
    }
  }

  return merged;
}

/** Admin brands.displayOrder (`sortOrder`) ascending, then code. */
export function compareBrandsByDisplayOrder(a: Brand, b: Brand): number {
  const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (byOrder !== 0) return byOrder;
  return a.code.localeCompare(b.code);
}

export function prepareBrandsForMachineSearch(
  brands: Brand[],
  options?: { includeFallbacks?: boolean }
): Brand[] {
  const merged =
    options?.includeFallbacks === false ? [...brands] : mergeMissingBrands(brands);
  return merged.sort(compareBrandsByDisplayOrder);
}
