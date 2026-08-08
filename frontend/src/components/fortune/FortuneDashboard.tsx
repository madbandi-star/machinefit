import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  FortuneDataAnalysis,
  FortuneMode,
  FortuneNarrative,
  FortuneRecommendation,
  FortuneScores,
  FortuneSection,
  FortuneTraditionalDetail,
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
import { FortuneFlowStrip } from '@/components/fortune/FortuneFlowStrip';
import { FortuneHero } from '@/components/fortune/FortuneHero';
import { FortuneLinearGauge } from '@/components/fortune/FortuneLinearGauge';
import { FortuneProse } from '@/components/fortune/FortuneProse';
import { FortuneQuoteCard } from '@/components/fortune/FortuneQuoteCard';
import { FortuneRadialGauge } from '@/components/fortune/FortuneRadialGauge';
import { FortuneReveal } from '@/components/fortune/FortuneReveal';
import { FortuneTraditionalDetailPanel } from '@/components/fortune/FortuneTraditionalDetail';
import { TodayRecommendationGrid } from '@/components/fortune/TodayRecommendationGrid';
import {
  healthmanCaptionKey,
  prCaptionKey,
  recoveryCaptionKey,
} from '@/components/fortune/fortuneVisuals';

export interface FortuneDashboardProps {
  date: string;
  mode?: FortuneMode;
  fortune: FortuneSection;
  scores: FortuneScores;
  recommendation: FortuneRecommendation;
  dataAnalysis?: FortuneDataAnalysis | null;
  narrative?: FortuneNarrative | null;
  traditionalDetail?: FortuneTraditionalDetail | null;
}

export function FortuneDashboard({
  date,
  mode,
  fortune,
  scores,
  recommendation,
  narrative,
  traditionalDetail,
}: FortuneDashboardProps) {
  const { t } = useTranslation('fortune');

  const prCaption = prCaptionKey(scores.prLuck);
  const recoveryCaption = recoveryCaptionKey(scores.recoveryLuck);

  const content = useMemo(
    () => ({
      fortuneExplain: buildFortuneExplain(fortune, narrative),
      why: buildWhyToday({ recommendation }),
      strategy: buildStrategyExplain(recommendation),
      pr: buildPrExplain(scores),
      recovery: buildRecoveryExplain(scores),
      tryThis: buildTryThis(recommendation),
      mission: buildMission({ fortune, recommendation }),
      report: buildReport({ fortune, scores, recommendation }),
    }),
    [fortune, scores, recommendation, narrative]
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
        coreThemeLabel={
          narrative ? t(narrative.coreThemeLabelKey) : undefined
        }
      />

      {narrative ? (
        <FortuneReveal className="fortune-dashboard__section" delayMs={30}>
          <div className="fortune-bundle">
            <p className="fortune-bundle__label">{t('sectionFlow')}</p>
            <FortuneFlowStrip narrative={narrative} />
          </div>
        </FortuneReveal>
      ) : null}

      <FortuneReveal className="fortune-dashboard__section" delayMs={40}>
        <div className="fortune-bundle fortune-bundle--open">
          <p className="fortune-bundle__label">{t('sectionFortuneVisual')}</p>
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
          <div className="fortune-scores-extra" aria-label={t('sectionExtraScores')}>
            <div className="fortune-scores-extra__item">
              <span>{t('volumeLuckLabel')}</span>
              <strong>{scores.volumeLuck ?? '—'}%</strong>
            </div>
            <div className="fortune-scores-extra__item">
              <span>{t('focusLuckLabel')}</span>
              <strong>{scores.focusLuck ?? '—'}%</strong>
            </div>
            <div className="fortune-scores-extra__item">
              <span>{t('changeLuckLabel')}</span>
              <strong>{scores.changeLuck ?? '—'}%</strong>
            </div>
          </div>
        </div>
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={60}>
        <div className="fortune-bundle">
          <p className="fortune-bundle__label">{t('sectionCommentary')}</p>
          <FortuneProse block={content.fortuneExplain} className="fortune-prose--accent-fortune" />
          <div className="fortune-prose-row">
            <FortuneProse block={content.pr} className="fortune-prose--accent-pr" />
            <FortuneProse block={content.recovery} className="fortune-prose--accent-recovery" />
          </div>
        </div>
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={90}>
        <div className="fortune-bundle">
          <p className="fortune-bundle__label">{t('sectionRecommendVisual')}</p>
          <TodayRecommendationGrid
            bodyPart={recommendation.bodyPart}
            bodyPartLabel={recommendation.bodyPartLabel}
            styleLabel={recommendation.styleLabel}
            strategyLabel={recommendation.strategyLabel}
            conditionLabel={recommendation.conditionLabel}
          />
          {fortune.strategyLabels.length ? (
            <p className="fortune-dashboard__tags">{fortune.strategyLabels.join(' · ')}</p>
          ) : null}
          <FortuneProse block={content.why} />
          <FortuneProse block={content.strategy} />
          <FortuneAvoidCard label={recommendation.avoidLabel} />
        </div>
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={120}>
        <div className="fortune-bundle">
          <p className="fortune-bundle__label">{t('sectionAction')}</p>
          <FortuneProse block={content.tryThis} numbered />
          <FortuneProse block={content.mission} className="fortune-prose--mission" />
          <FortuneBeforeAfter
            preBody={recommendation.preWorkoutBody}
            postBody={recommendation.postWorkoutBody}
          />
        </div>
      </FortuneReveal>

      <FortuneReveal className="fortune-dashboard__section" delayMs={150}>
        <div className="fortune-bundle">
          <p className="fortune-bundle__label">{t('sectionWrap')}</p>
          <FortuneProse block={content.report} className="fortune-prose--report" />
          <FortuneQuoteCard oneLiner={fortune.oneLiner} detail={fortune.oneLinerDetail} />
          {traditionalDetail ? (
            <FortuneTraditionalDetailPanel detail={traditionalDetail} />
          ) : null}
        </div>
      </FortuneReveal>

      <p className="fortune-dashboard__disclaimer">
        <span aria-hidden>ⓘ</span> {fortune.disclaimer || t('disclaimer')}
      </p>
    </div>
  );
}
