export interface WeightBasisEntry {
  id: string;
  titleKey: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
  valueKg?: number;
  usedInFinal: boolean;
}

export interface WeightRecommendationBasis {
  entries: WeightBasisEntry[];
  finalWeightKg?: number;
  primarySourceId: string;
}
