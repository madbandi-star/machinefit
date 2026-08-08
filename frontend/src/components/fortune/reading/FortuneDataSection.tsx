import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { FortuneDataAnalysis } from '@machinefit/shared';
import { EquipmentDonutChart } from '@/components/fortune/EquipmentDonutChart';
import { WorkoutStatsCards } from '@/components/fortune/WorkoutStatsCards';
import { FortuneSection } from '@/components/fortune/reading/FortuneSection';
import { buildEquipmentSlices } from '@/components/fortune/fortuneVisuals';
import { ROUTES } from '@/constants/routes';

interface FortuneDataSectionProps {
  dataAnalysis?: FortuneDataAnalysis | null;
  delayMs?: number;
}

export function FortuneDataSection({
  dataAnalysis,
  delayMs = 140,
}: FortuneDataSectionProps) {
  const { t } = useTranslation('fortune');
  const empty =
    !dataAnalysis ||
    dataAnalysis.personalizationTier === 'none' ||
    dataAnalysis.logCount30d <= 0;

  const slices = dataAnalysis
    ? buildEquipmentSlices({
        barbellRatio30d: dataAnalysis.barbellRatio30d,
        dumbbellRatio30d: dataAnalysis.dumbbellRatio30d,
        machineRatio30d: dataAnalysis.machineRatio30d,
        cableRatio30d: dataAnalysis.cableRatio30d,
        bodyweightRatio30d: dataAnalysis.bodyweightRatio30d,
      })
    : [];

  return (
    <FortuneSection
      title={`📊 ${t('sectionMyData')}`}
      delayMs={delayMs}
      tone="data"
    >
      {empty ? (
        <div className="fr-empty-data">
          <p className="fr-empty-data__title">{t('dataSparseTitle')}</p>
          <p className="fr-empty-data__body">{t('dataEmptyForFortune')}</p>
          <Link to={`${ROUTES.RECORDS}?tab=history`} className="btn btn--secondary btn--block">
            {t('dataEmptyCta')}
          </Link>
        </div>
      ) : (
        <div className="fr-data">
          <WorkoutStatsCards
            workoutCount7d={dataAnalysis!.workoutCount7d}
            workoutCount30d={dataAnalysis!.workoutCount30d}
          />
          <p className="fr-label">{t('ratiosTitle')}</p>
          <EquipmentDonutChart slices={slices} empty={false} />
          {(dataAnalysis!.topMuscleGroup || dataAnalysis!.lowMuscleGroup) && (
            <ul className="fr-data__muscles">
              {dataAnalysis!.topMuscleGroup ? (
                <li>
                  {t('dataTopMuscle', { muscle: dataAnalysis!.topMuscleGroup })}
                </li>
              ) : null}
              {dataAnalysis!.lowMuscleGroup ? (
                <li>
                  {t('dataLowMuscle', { muscle: dataAnalysis!.lowMuscleGroup })}
                </li>
              ) : null}
            </ul>
          )}
        </div>
      )}
    </FortuneSection>
  );
}
