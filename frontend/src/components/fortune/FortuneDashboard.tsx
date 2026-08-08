import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  FortuneDataAnalysis,
  FortuneMode,
  FortuneRecommendation,
  FortuneScores,
  FortuneSection,
} from '@machinefit/shared';
import { FortuneAvoidCard } from '@/components/fortune/FortuneAvoidCard';
import { FortuneBeforeAfter } from '@/components/fortune/FortuneBeforeAfter';
import {
  buildFortuneExplain,
  buildMission,
  buildPrExplain,
  buildRecoveryExplain,
  buildReport,
  buildStrategyExplain,
  buildTryThis,
  buildWhyToday,
} from '@/components/fortune/fortuneContent';
import { FortuneHero } from '@/components/fortune/FortuneHero';
import { FortuneLinearGauge } from '@/components/fortune/FortuneLinearGauge';
import { FortuneProse } from '@/components/fortune/FortuneProse';
import { FortuneQuoteCard } from '@/components/fortune/FortuneQuoteCard';
import { FortuneRadialGauge } from '@/components/fortune/FortuneRadialGauge';
import { FortuneReveal } from '@/components/fortune/FortuneReveal';
import { TodayRecommendationGrid } from '@/components/fortune/TodayRecommendationGrid';
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
  const slices = useMemo(
    () =>
      dataAnalysis
        ? buildEquipmentSlices(dataAnalysis)
        : buildEquipmentSlices({
            barbellRatio30d: 0,
            dumbbellRatio30d: 0,
            machineRatio30d: 0,
            cableRatio30d: 0,
            bodyweightRatio30d: 0,
          }),
    [dataAnalysis]
  );
  const emptyData = !dataAnalysis || dataAnalysis.logCount30d <= 0;
  const sparse =
    Boolean(dataAnalysis) &&
    !emptyData &&
    dataAnalysis!.workoutCount30d > 0 &&
    dataAnalysis!.workoutCount30d <= 2;

  const prCaption = prCaptionKey(scores.prLuck);
  const recoveryCaption = recoveryCaptionKey(scores.recoveryLuck);

  const content = useMemo(
    () => ({
      fortuneExplain: buildFortuneExplain(fortune),
      why: buildWhyToday({
        empty: emptyData,
        sparse,
        recommendation,
        analysis: dataAnalysis,
        slices,
      }),
      strategy: buildStrategyExplain(recommendation),
      pr: buildPrExplain(scores),
      recovery: buildRecoveryExplain(scores),
      tryThis: buildTryThis(recommendation),
      mission: buildMission({ fortune, recommendation }),
      report: buildReport({
        fortune,
        scores,
        recommendation,
        empty: emptyData,
        slices,
        analysis: dataAnalysis,
      }),
    }),
    [fortune, scores, recommendation, dataAnalysis, emptyData, sparse, slices]
  );

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

      <FortuneReveal className="fortune-dashboard__section" delayMs={60}>
        <FortuneProse block={content.fortuneExplain} />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={80}>
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

      <FortuneReveal className="fortune-dashboard__section" delayMs={100}>
        <FortuneProse block={content.why} />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={120}>
        <FortuneProse block={content.strategy} />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={140}>
        <FortuneProse block={content.pr} />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={160}>
        <FortuneProse block={content.recovery} />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={170}>
        <FortuneAvoidCard label={recommendation.avoidLabel} />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={180}>
        <FortuneProse block={content.tryThis} numbered />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={190}>
        <FortuneProse block={content.mission} className="fortune-prose--mission" />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={200}>
        <FortuneBeforeAfter
          preBody={recommendation.preWorkoutBody}
          postBody={recommendation.postWorkoutBody}
        />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={210}>
        <FortuneProse block={content.report} className="fortune-prose--report" />
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={220}>
        <FortuneQuoteCard oneLiner={fortune.oneLiner} detail={fortune.oneLinerDetail} />
      </FortuneReveal>

      {recommendation.ctas.length ? (
        <FortuneReveal className="fortune-dashboard__section fortune-dashboard__ctas" delayMs={230}>
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
