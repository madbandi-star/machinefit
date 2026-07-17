import type { Brand } from '@machinefit/shared';
import { BRAND_CODES } from '@machinefit/shared';

const BRANDS_BEFORE_CYBEX = [BRAND_CODES.FREE_WEIGHT, BRAND_CODES.BODYWEIGHT] as const;

const FALLBACK_SEARCH_BRANDS: Brand[] = [
  {
    id: 'brand-free-weight',
    code: BRAND_CODES.FREE_WEIGHT,
    name: { ko: '프리웨이트', en: 'Free Weight', ja: 'フリーウェイト', zh: '自由重量' },
    isActive: true,
  },
  {
    id: 'brand-bodyweight',
    code: BRAND_CODES.BODYWEIGHT,
    name: { ko: '맨몸운동', en: 'Bodyweight', ja: '自重トレ', zh: '自重训练' },
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

  const beforeCybex = BRANDS_BEFORE_CYBEX.map((code) =>
    merged.find((brand) => brand.code === code)
  ).filter((brand): brand is Brand => !!brand);

  const rest = merged.filter((brand) => !BRANDS_BEFORE_CYBEX.includes(brand.code as typeof BRANDS_BEFORE_CYBEX[number]));
  const cybexIndex = rest.findIndex((brand) => brand.code === BRAND_CODES.CYBEX);

  if (cybexIndex === -1) {
    return [...beforeCybex, ...rest];
  }

  return [...rest.slice(0, cybexIndex), ...beforeCybex, ...rest.slice(cybexIndex)];
}
