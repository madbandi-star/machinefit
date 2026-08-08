import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isAllGymsId } from '@machinefit/shared';
import { fortuneApi } from '@/api/fortune.api';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { getTodayDateKey } from '@/utils/historyDate';
import '@/styles/fortune.css';

function starsText(n: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(n)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

export function FortuneDetailPage() {
  const { t, i18n } = useTranslation(['fortune', 'common']);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const today = getTodayDateKey();
  const gymId =
    activeGymId && !isAllGymsId(activeGymId) ? activeGymId : undefined;
  const memberId = gymId && activeMemberId ? activeMemberId : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.fortuneToday(today, gymId, memberId),
    queryFn: async () => {
      const res = await fortuneApi.getToday({
        gymId,
        memberId,
        date: today,
        locale: i18n.language?.slice(0, 2),
      });
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <PageShell title={t('fortune:title')}>
        <Skeleton count={4} height={72} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell title={t('fortune:title')}>
        <p>{t('fortune:loadError')}</p>
        <button type="button" className="btn btn--secondary" onClick={() => void refetch()}>
          {t('common:actions.retry')}
        </button>
      </PageShell>
    );
  }

  if (!data || data.status === 'needs_birth_profile') {
    return (
      <PageShell title={t('fortune:title')}>
        <p>{t('fortune:needsBirth')}</p>
        <Link to={`${ROUTES.SETTINGS}#birth-profile`} className="btn btn--primary btn--block">
          {t('fortune:enterBirth')}
        </Link>
      </PageShell>
    );
  }

  const { fortune, scores, recommendation, dataAnalysis, mode } = data;
  if (!fortune || !scores || !recommendation) {
    return (
      <PageShell title={t('fortune:title')}>
        <p>{t('fortune:loadError')}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('fortune:title')}>
      <div className="fortune-detail">
        <p className="fortune-detail__date">{t('fortune:subtitle', { date: data.date })}</p>
        <p className="fortune-detail__mode">
          {mode === 'simple' ? t('fortune:modeSimple') : t('fortune:modeFull')}
        </p>

        <section className="fortune-detail__section" aria-labelledby="fortune-section">
          <h2 id="fortune-section">{t('fortune:sectionFortune')}</h2>
          <p className="fortune-detail__stars">
            {t('fortune:starsLabel')} {starsText(fortune.scoreStars)}
          </p>
          <p className="fortune-detail__keyword">
            {t('fortune:keyword')}: {fortune.keywordTitle}
          </p>
          <p className="fortune-detail__title">{fortune.title}</p>
          {fortune.headline && fortune.headline !== fortune.title ? (
            <p className="fortune-detail__headline">{fortune.headline}</p>
          ) : null}
          <ul className="fortune-detail__scores">
            <li>{t('fortune:healthmanIndex', { score: scores.healthmanIndex })}</li>
            <li>{t('fortune:prLuck', { score: scores.prLuck })}</li>
            <li>{t('fortune:recoveryLuck', { score: scores.recoveryLuck })}</li>
          </ul>
          <p className="fortune-detail__disclaimer">{fortune.disclaimer || t('fortune:disclaimer')}</p>
        </section>

        <section className="fortune-detail__section" aria-labelledby="data-section">
          <h2 id="data-section">{t('fortune:sectionData')}</h2>
          {dataAnalysis ? (
            <>
              {dataAnalysis.logCount30d > 0 ? (
                <div className="fortune-detail__ratios">
                  <p className="fortune-detail__ratios-title">{t('fortune:ratiosTitle')}</p>
                  <ul>
                    <li>
                      {t('fortune:barbell')} {dataAnalysis.barbellRatio30d}%
                    </li>
                    <li>
                      {t('fortune:dumbbell')} {dataAnalysis.dumbbellRatio30d}%
                    </li>
                    <li>
                      {t('fortune:machine')} {dataAnalysis.machineRatio30d}%
                    </li>
                    <li>
                      {t('fortune:cable')} {dataAnalysis.cableRatio30d}%
                    </li>
                    <li>
                      {t('fortune:bodyweight')} {dataAnalysis.bodyweightRatio30d}%
                    </li>
                  </ul>
                </div>
              ) : null}
              <ul className="fortune-detail__bullets">
                {dataAnalysis.personalizedBullets.map((line: string) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="fortune-detail__muted">{t('fortune:needsBirth')}</p>
          )}
        </section>

        <section className="fortune-detail__section" aria-labelledby="rec-section">
          <h2 id="rec-section">{t('fortune:sectionRecommend')}</h2>
          <ul className="fortune-detail__rec-list">
            <li>
              <strong>{t('fortune:bodyPart')}</strong>: {recommendation.bodyPartLabel}
            </li>
            <li>
              <strong>{t('fortune:style')}</strong>: {recommendation.styleLabel}
            </li>
            <li>
              <strong>{t('fortune:strategy')}</strong>: {recommendation.strategyLabel}
            </li>
            <li>
              <strong>{t('fortune:condition')}</strong>: {recommendation.conditionLabel}
            </li>
            <li>
              <strong>{t('fortune:avoid')}</strong>: {recommendation.avoidLabel}
            </li>
            <li>
              <strong>{t('fortune:preWorkout')}</strong>: {recommendation.preWorkoutBody}
            </li>
            <li>
              <strong>{t('fortune:postWorkout')}</strong>: {recommendation.postWorkoutBody}
            </li>
          </ul>
          {fortune.strategyLabels.length ? (
            <p className="fortune-detail__tags">{fortune.strategyLabels.join(' · ')}</p>
          ) : null}
          <blockquote className="fortune-detail__one-liner">
            <strong>{t('fortune:oneLiner')}</strong>
            <br />
            {fortune.oneLiner}
            {fortune.oneLinerDetail ? (
              <>
                <br />
                <span>{fortune.oneLinerDetail}</span>
              </>
            ) : null}
          </blockquote>
          <div className="fortune-detail__ctas">
            {recommendation.ctas.map((cta: { href: string; kind: string; labelKey: string }) => (
              <Link key={cta.href + cta.kind} to={cta.href} className="btn btn--secondary btn--block">
                {t(`fortune:${cta.labelKey}`)}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
