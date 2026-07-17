import type { TFunction } from 'i18next';

interface WeightClassLabelInput {
  weightClassKey: string;
  weightMinKg: number;
  weightMaxKg: number;
  weightClassUnlimited?: boolean;
}

export function formatBoxingWeightClassLabel(
  t: TFunction,
  input: WeightClassLabelInput
): string {
  const name = t(`growthAnalysis.insights.weightClasses.${input.weightClassKey}`, {
    defaultValue: input.weightClassKey,
  });

  if (input.weightClassUnlimited) {
    return t('growthAnalysis.insights.profileAverage.weightClassChipOver', {
      name,
      min: input.weightMinKg,
    });
  }

  if (input.weightMinKg === 0) {
    return t('growthAnalysis.insights.profileAverage.weightClassChipMax', {
      name,
      max: input.weightMaxKg,
    });
  }

  return t('growthAnalysis.insights.profileAverage.weightClassChipRange', {
    name,
    min: input.weightMinKg,
    max: input.weightMaxKg,
  });
}
