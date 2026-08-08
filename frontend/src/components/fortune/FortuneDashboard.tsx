import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type {
  FortuneDataAnalysis,
  FortuneMode,
  FortuneRecommendation,
  FortuneScores,
  FortuneSection,
} from '@machinefit/shared';
import { EquipmentDonutChart } from '@/components/fortune/EquipmentDonutChart';
import { FortuneAvoidCard } from '@/components/fortune/FortuneAvoidCard';
import { FortuneBeforeAfter } from '@/components/fortune/FortuneBeforeAfter';
import { FortuneHero } from '@/components/fortune/FortuneHero';
import { FortuneLinearGauge } from '@/components/fortune/FortuneLinearGauge';
import { FortuneQuoteCard } from '@/components/fortune/FortuneQuoteCard';
import { FortuneRadialGauge } from '@/components/fortune/FortuneRadialGauge';
import { FortuneReveal } from '@/components/fortune/FortuneReveal';
import { TodayRecommendationGrid } from '@/components/fortune/TodayRecommendationGrid';
import { WorkoutInsightCard } from '@/components/fortune/WorkoutInsightCard';
import { WorkoutStatsCards } from '@/components/fortune/WorkoutStatsCards';
import {
  buildEquipmentSlices,
  healthmanCaptionKey,
  prCaptionKey,
  recoveryCaptionKey,
} from '@/components/fortune/fortuneVisuals';
import { ROUTES } from '@/constants/routes';

export interface FortuneDashboardProps {
  date: string;
  mode?: FortuneMode;
  fortune: FortuneSection;
  scores: FortuneScores;
  recommendation: FortuneRecommendation;
  dataAnalysis?: FortuneDataAnalysis | null;
}

export function FortuneDashboard({
  date,
  mode,
  fortune,
  scores,
  recommendation,
  dataAnalysis,
}: FortuneDashboardProps) {
  const { t } = useTranslation('fortune');
  const slices = dataAnalysis
    ? buildEquipmentSlices(dataAnalysis)
    : buildEquipmentSlices({
        barbellRatio30d: 0,
        dumbbellRatio30d: 0,
        machineRatio30d: 0,
        cableRatio30d: 0,
        bodyweightRatio30d: 0,
      });
  const emptyData = !dataAnalysis || dataAnalysis.logCount30d <= 0;
  const sparse =
    Boolean(dataAnalysis) &&
    !emptyData &&
    dataAnalysis!.workoutCount30d > 0 &&
    dataAnalysis!.workoutCount30d <= 2;

  const prCaption = prCaptionKey(scores.prLuck);
  const recoveryCaption = recoveryCaptionKey(scores.recoveryLuck);

  return (
    <div className="fortune-dashboard">
      <FortuneHero
        date={date}
        mode={mode}
        keywordCode={fortune.keyword}
        keywordTitle={fortune.keywordTitle}
        title={fortune.title}
        headline={fortune.headline}
        scoreStars={fortune.scoreStars}
      />

      <FortuneReveal className="fortune-dashboard__section" delayMs={40}>
        <p className="fortune-dashboard__section-label">
          <span aria-hidden>🔮</span> {t('sectionFortuneVisual')}
        </p>
        <div className="fortune-scores">
          <div className="fortune-scores__hero">
            <FortuneRadialGauge
              value={scores.healthmanIndex}
              label={t('healthmanIndexLabel')}
              emoji="🔥"
              caption={t(healthmanCaptionKey(scores.healthmanIndex))}
              tone="primary"
            />
          </div>
          <div className="fortune-scores__side">
            <FortuneLinearGauge
              value={scores.prLuck}
              label={t('prLuckLabel')}
              emoji="🏆"
              caption={prCaption ? t(prCaption) : undefined}
              tone="pr"
              to={ROUTES.ACHIEVEMENTS}
            />
            <FortuneLinearGauge
              value={scores.recoveryLuck}
              label={t('recoveryLuckLabel')}
              emoji="🧘"
              caption={recoveryCaption ? t(recoveryCaption) : undefined}
              tone="recovery"
            />
          </div>
        </div>
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={80}>
        <p className="fortune-dashboard__section-label">
          <span aria-hidden>📊</span> {t('sectionDataVisual')}
        </p>
        <p className="fortune-dashboard__section-desc">{t('sectionDataDesc')}</p>
        {emptyData ? (
          <div className="fortune-empty">
            <p className="fortune-empty__title">{t('dataEmptyTitle')}</p>
            <p className="fortune-empty__body">{t('dataEmptyBody')}</p>
            <Link to={`${ROUTES.RECORDS}?tab=history`} className="btn btn--primary btn--block">
              {t('dataEmptyCta')}
            </Link>
          </div>
        ) : (
          <>
            <p className="fortune-dashboard__subhead">{t('ratiosTitle')}</p>
            <EquipmentDonutChart slices={slices} empty={false} />
            <WorkoutStatsCards
              workoutCount7d={dataAnalysis!.workoutCount7d}
              workoutCount30d={dataAnalysis!.workoutCount30d}
            />
          </>
        )}
      </FortuneReveal>

      {!emptyData ? (
        <FortuneReveal className="fortune-dashboard__section" delayMs={100}>
          <WorkoutInsightCard
            bullets={dataAnalysis?.personalizedBullets ?? []}
            slices={slices}
            styleLabel={recommendation.styleLabel}
            sparse={sparse}
            empty={false}
          />
        </FortuneReveal>
      ) : null}

      <FortuneReveal className="fortune-dashboard__section" delayMs={120}>
        <p className="fortune-dashboard__section-label">
          <span aria-hidden>✨</span> {t('sectionRecommendVisual')}
        </p>
        <TodayRecommendationGrid
          bodyPart={recommendation.bodyPart}
          bodyPartLabel={recommendation.bodyPartLabel}
          style={recommendation.style}
          styleLabel={recommendation.styleLabel}
          strategyLabel={recommendation.strategyLabel}
          conditionLabel={recommendation.conditionLabel}
        />
        {fortune.strategyLabels.length ? (
          <p className="fortune-dashboard__tags">{fortune.strategyLabels.join(' · ')}</p>
        ) : null}
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={140}>
        <FortuneAvoidCard label={recommendation.avoidLabel} />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={160}>
        <FortuneBeforeAfter
          preBody={recommendation.preWorkoutBody}
          postBody={recommendation.postWorkoutBody}
        />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={180}>
        <FortuneQuoteCard oneLiner={fortune.oneLiner} detail={fortune.oneLinerDetail} />
      </FortuneReveal>

      {recommendation.ctas.length ? (
        <FortuneReveal className="fortune-dashboard__section fortune-dashboard__ctas" delayMs={200}>
          {recommendation.ctas.map((cta) => (
            <Link key={cta.href + cta.kind} to={cta.href} className="btn btn--secondary btn--block">
              {t(cta.labelKey)}
            </Link>
          ))}
        </FortuneReveal>
      ) : null}

      <p className="fortune-dashboard__disclaimer">
        <span aria-hidden>ⓘ</span> {fortune.disclaimer || t('disclaimer')}
      </p>
    </div>
  );
}
