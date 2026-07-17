import type { Brand } from '@machinefit/shared';
import { BRAND_CODES } from '@machinefit/shared';

const BRAND_SEARCH_ORDER = [
  BRAND_CODES.BODYWEIGHT,
  BRAND_CODES.FREE_WEIGHT,
  BRAND_CODES.HAMMER_STRENGTH,
  BRAND_CODES.LIFE_FITNESS,
  BRAND_CODES.CYBEX,
  BRAND_CODES.TECHNOGYM,
] as const;

const FALLBACK_SEARCH_BRANDS: Brand[] = [
  {
    id: 'brand-bodyweight',
    code: BRAND_CODES.BODYWEIGHT,
    name: { ko: '맨몸운동', en: 'Bodyweight', ja: '自重トレ', zh: '自重训练' },
    isActive: true,
  },
  {
    id: 'brand-free-weight',
    code: BRAND_CODES.FREE_WEIGHT,
    name: { ko: '프리웨이트', en: 'Free Weight', ja: 'フリーウェイト', zh: '自由重量' },
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

export function prepareBrandsForMachineSearch(brands: Brand[]): Brand[] {
  const merged = mergeMissingBrands(brands);
  const ordered: Brand[] = [];

  for (const code of BRAND_SEARCH_ORDER) {
    const brand = merged.find((item) => item.code === code);
    if (brand) ordered.push(brand);
  }

  for (const brand of merged) {
    if (!BRAND_SEARCH_ORDER.includes(brand.code as (typeof BRAND_SEARCH_ORDER)[number])) {
      ordered.push(brand);
    }
  }

  return ordered;
}
