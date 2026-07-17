import { MAX_BODY_WEIGHT_KG } from './growth-insights.js';

export interface BoxingWeightClassDefinition {
  key: string;
  maxKg: number | null;
}

export interface BoxingWeightClassResult {
  key: string;
  minKg: number;
  maxKg: number;
  isUnlimited: boolean;
}

const MALE_BOXING_WEIGHT_CLASSES: BoxingWeightClassDefinition[] = [
  { key: 'minimumweight', maxKg: 47.6 },
  { key: 'lightFlyweight', maxKg: 48.9 },
  { key: 'flyweight', maxKg: 50.8 },
  { key: 'superFlyweight', maxKg: 52.2 },
  { key: 'bantamweight', maxKg: 53.5 },
  { key: 'superBantamweight', maxKg: 55.3 },
  { key: 'featherweight', maxKg: 57.2 },
  { key: 'superFeatherweight', maxKg: 59.0 },
  { key: 'lightweight', maxKg: 61.2 },
  { key: 'superLightweight', maxKg: 63.5 },
  { key: 'welterweight', maxKg: 66.7 },
  { key: 'superWelterweight', maxKg: 69.9 },
  { key: 'middleweight', maxKg: 72.6 },
  { key: 'superMiddleweight', maxKg: 76.2 },
  { key: 'lightHeavyweight', maxKg: 79.4 },
  { key: 'cruiserweight', maxKg: 90.7 },
  { key: 'heavyweight', maxKg: null },
];

const FEMALE_BOXING_WEIGHT_CLASSES: BoxingWeightClassDefinition[] = [
  { key: 'atomweight', maxKg: 46.3 },
  { key: 'minimumweight', maxKg: 47.6 },
  { key: 'lightFlyweight', maxKg: 48.9 },
  { key: 'flyweight', maxKg: 50.8 },
  { key: 'superFlyweight', maxKg: 52.2 },
  { key: 'bantamweight', maxKg: 53.5 },
  { key: 'superBantamweight', maxKg: 55.3 },
  { key: 'featherweight', maxKg: 57.2 },
  { key: 'superFeatherweight', maxKg: 59.0 },
  { key: 'lightweight', maxKg: 61.2 },
  { key: 'superLightweight', maxKg: 63.5 },
  { key: 'welterweight', maxKg: 66.7 },
  { key: 'superWelterweight', maxKg: 69.9 },
  { key: 'middleweight', maxKg: 72.6 },
  { key: 'superMiddleweight', maxKg: 76.2 },
  { key: 'lightHeavyweight', maxKg: 79.4 },
  { key: 'heavyweight', maxKg: null },
];

function getClassesForGender(gender?: string): BoxingWeightClassDefinition[] {
  return gender === 'female' ? FEMALE_BOXING_WEIGHT_CLASSES : MALE_BOXING_WEIGHT_CLASSES;
}

function toClassResult(
  cls: BoxingWeightClassDefinition,
  minKg: number,
  maxKg: number,
  isUnlimited: boolean
): BoxingWeightClassResult {
  return { key: cls.key, minKg, maxKg, isUnlimited };
}

/** Map body weight to a pro boxing weight class cohort (bottom/top class when out of range). */
export function getBoxingWeightClass(
  gender: string | undefined,
  weightKg: number
): BoxingWeightClassResult {
  const classes = getClassesForGender(gender);
  const first = classes[0];

  if (weightKg <= first.maxKg!) {
    return toClassResult(first, 0, first.maxKg!, false);
  }

  for (let index = 1; index < classes.length; index += 1) {
    const previous = classes[index - 1];
    const current = classes[index];
    const previousMax = previous.maxKg!;

    if (current.maxKg === null) {
      return toClassResult(current, previousMax, MAX_BODY_WEIGHT_KG, true);
    }

    if (weightKg <= current.maxKg) {
      return toClassResult(current, previousMax, current.maxKg, false);
    }
  }

  const heavy = classes[classes.length - 1];
  const previousMax = classes[classes.length - 2].maxKg!;
  return toClassResult(heavy, previousMax, MAX_BODY_WEIGHT_KG, true);
}

export function getBoxingWeightClassRange(
  gender: string | undefined,
  weightKg: number
): { weightMinKg: number; weightMaxKg: number; weightClassKey: string; isUnlimited: boolean } {
  const boxingClass = getBoxingWeightClass(gender, weightKg);
  return {
    weightMinKg: boxingClass.minKg,
    weightMaxKg: boxingClass.maxKg,
    weightClassKey: boxingClass.key,
    isUnlimited: boxingClass.isUnlimited,
  };
}
