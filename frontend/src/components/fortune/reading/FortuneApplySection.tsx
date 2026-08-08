import { useTranslation } from 'react-i18next';
import type {
  FortuneDataAnalysis,
  FortuneNarrative,
  FortuneRecommendation,
} from '@machinefit/shared';
import { FortuneSection } from '@/components/fortune/reading/FortuneSection';
import {
  buildEquipmentSlices,
  topEquipment,
} from '@/components/fortune/fortuneVisuals';

interface FortuneApplySectionProps {
  narrative?: FortuneNarrative | null;
  recommendation: FortuneRecommendation;
  dataAnalysis?: FortuneDataAnalysis | null;
  delayMs?: number;
}

export function FortuneApplySection({
  narrative,
  recommendation,
  dataAnalysis,
  delayMs = 160,
}: FortuneApplySectionProps) {
  const { t } = useTranslation('fortune');
  const theme = narrative ? t(narrative.coreThemeLabelKey) : recommendation.styleLabel;
  const hasData =
    dataAnalysis &&
    dataAnalysis.personalizationTier !== 'none' &&
    dataAnalysis.logCount30d > 0;

  const slices = hasData
    ? buildEquipmentSlices({
        barbellRatio30d: dataAnalysis!.barbellRatio30d,
        dumbbellRatio30d: dataAnalysis!.dumbbellRatio30d,
        machineRatio30d: dataAnalysis!.machineRatio30d,
        cableRatio30d: dataAnalysis!.cableRatio30d,
        bodyweightRatio30d: dataAnalysis!.bodyweightRatio30d,
      })
    : [];
  const top = topEquipment(slices);

  return (
    <FortuneSection
      title={`✨ ${t('sectionApply')}`}
      delayMs={delayMs}
      tone="action"
    >
      <div className="fr-apply">
        <div className="fr-apply__block fr-apply__block--fortune">
          <p className="fr-label">{t('applyFortuneLabel')}</p>
          <p className="fr-apply__value">{theme}</p>
        </div>
        <p className="fr-apply__arrow" aria-hidden>
          ↓
        </p>
        <div className="fr-apply__block fr-apply__block--data">
          <p className="fr-label">{t('applyDataLabel')}</p>
          <p className="fr-apply__value">
            {hasData && top
              ? t('applyDataValue', {
                  equipment: t(top.labelKey),
                  percent: Math.round(top.value),
                })
              : t('applyDataEmpty')}
          </p>
        </div>
        <p className="fr-apply__arrow" aria-hidden>
          ↓
        </p>
        <div className="fr-apply__block fr-apply__block--result">
          <p className="fr-label">{t('applyResultLabel')}</p>
          <p className="fr-apply__value">
            {hasData && top
              ? t('applyResultPersonalized', {
                  theme,
                  equipment: t(top.labelKey),
                  percent: Math.round(top.value),
                  style: recommendation.styleLabel,
                  body: recommendation.bodyPartLabel,
                })
              : t('applyResultFortuneOnly', {
                  theme,
                  style: recommendation.styleLabel,
                  body: recommendation.bodyPartLabel,
                })}
          </p>
        </div>
      </div>
    </FortuneSection>
  );
}
