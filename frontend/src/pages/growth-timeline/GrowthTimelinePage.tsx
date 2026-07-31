import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { LegalDisclaimerBanner } from '@/components/compliance/LegalDisclaimerBanner';
import { growthTimelineApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import './GrowthTimelinePage.css';

function loc(text: { ko: string; en: string } | undefined | null, locale: string): string {
  if (!text) return '';
  return locale.startsWith('ko') ? text.ko : text.en;
}

function formatInt(n: number, locale: string): string {
  return Math.floor(n).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US');
}

export function GrowthTimelinePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { activeGymId } = useActiveGym();
  const { activeMemberId, isRealGym, memberScopeReady } = useActiveMember();
  const [wrappedIdx, setWrappedIdx] = useState(0);

  const scopeParams =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.growthTimeline(activeGymId, activeMemberId),
    queryFn: async () => {
      const res = await growthTimelineApi.snapshot(scopeParams);
      return res.data.data;
    },
    enabled: memberScopeReady,
    staleTime: 60_000,
  });

  const wrappedSlides = data?.wrapped?.slides ?? [];
  const wrappedSlide = wrappedSlides[wrappedIdx] ?? null;

  return (
    <div className="gt-page">
      <PageShell title={t('growthTimeline.title')}>
        <div className="gt-page__body">
          {isLoading && <Skeleton count={6} height={80} />}
          {isError && <p className="form-error-summary">{t('growthTimeline.loadError')}</p>}

          {data && (
            <>
              <section className="gt-hero">
                <p className="gt-hero__eyebrow">{t('growthTimeline.eyebrow')}</p>
                <h2 className="gt-hero__title">{t('growthTimeline.heroTitle')}</h2>
                <div className="gt-headlines">
                  {data.headlines.map((h) => (
                    <article key={h.id} className="gt-headline">
                      <span className="gt-headline__emoji" aria-hidden>
                        {h.emoji}
                      </span>
                      <p className="gt-headline__text">{loc(h.text, locale)}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="gt-section">
                <h3 className="gt-section__title">{t('growthTimeline.timeline')}</h3>
                <div className="gt-timeline">
                  {data.timeline.map((event) => (
                    <div key={event.id} className="gt-timeline__item">
                      <div className="gt-timeline__dot" aria-hidden>
                        {event.emoji}
                      </div>
                      <div className="gt-timeline__body">
                        <p className="gt-timeline__date">{event.date}</p>
                        <p className="gt-timeline__title">{loc(event.title, locale)}</p>
                        <p className="gt-timeline__desc">{loc(event.description, locale)}</p>
                      </div>
                    </div>
                  ))}
                  {!data.timeline.length && (
                    <p className="gt-section__desc">{t('growthTimeline.emptyTimeline')}</p>
                  )}
                </div>
              </section>

              <section className="gt-section">
                <h3 className="gt-section__title">{t('growthTimeline.highlights')}</h3>
                <div className="gt-highlight-grid gt-highlight-grid--compact">
                  {data.highlights.map((h) => (
                    <article key={h.id} className="gt-highlight-tile">
                      <span className="gt-highlight-tile__emoji" aria-hidden>
                        {h.emoji}
                      </span>
                      <span className="gt-highlight-tile__body">
                        <span className="gt-highlight-tile__title">{loc(h.title, locale)}</span>
                        <span className="gt-highlight-tile__value">{h.value}</span>
                        <span className="gt-highlight-tile__detail">{loc(h.detail, locale)}</span>
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="gt-section">
                <h3 className="gt-section__title">{t('growthTimeline.monthly')}</h3>
                <div className="gt-month-grid">
                  {[...data.monthlyReports].reverse().slice(0, 6).map((r) => (
                    <article key={r.yearMonth} className="gt-month-card">
                      <p className="gt-month-card__ym">{r.yearMonth}</p>
                      <div className="gt-month-card__stats">
                        <span>
                          {t('growthTimeline.workouts')}: {formatInt(r.workouts, locale)}
                        </span>
                        <span>
                          {t('growthTimeline.volume')}:{' '}
                          {(r.volumeKg / 1000).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
                            maximumFractionDigits: 1,
                          })}
                          t
                        </span>
                        <span>PR: {formatInt(r.prCount, locale)}</span>
                        <span>
                          {t('growthTimeline.topMachine')}: {r.topMachineName ?? '-'}
                        </span>
                        <span>
                          {t('growthTimeline.avgMinutes')}: {r.avgMinutes}
                          {locale.startsWith('ko') ? '분' : 'm'}
                        </span>
                        {r.vsPrevMonthPct != null && (
                          <span>
                            {t('growthTimeline.vsPrev')}: {r.vsPrevMonthPct > 0 ? '+' : ''}
                            {r.vsPrevMonthPct}%
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {data.wrapped && wrappedSlide && (
                <section className="gt-section">
                  <h3 className="gt-section__title">
                    {t('growthTimeline.wrapped', { year: data.wrapped.year })}
                  </h3>
                  <div className="gt-wrapped">
                    <div className="gt-wrapped__stage" key={wrappedSlide.id}>
                      <div className="gt-wrapped__emoji">{wrappedSlide.emoji}</div>
                      <p className="gt-wrapped__title">{loc(wrappedSlide.title, locale)}</p>
                      <p className="gt-wrapped__value">{wrappedSlide.value}</p>
                      {wrappedSlide.subtitle && (
                        <p className="gt-wrapped__sub">{loc(wrappedSlide.subtitle, locale)}</p>
                      )}
                    </div>
                    <div className="gt-wrapped__nav">
                      <button
                        type="button"
                        className="btn"
                        disabled={wrappedIdx <= 0}
                        onClick={() => setWrappedIdx((i) => Math.max(0, i - 1))}
                      >
                        {t('growthTimeline.prev')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={wrappedIdx >= wrappedSlides.length - 1}
                        onClick={() =>
                          setWrappedIdx((i) => Math.min(wrappedSlides.length - 1, i + 1))
                        }
                      >
                        {t('growthTimeline.next')}
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          <LegalDisclaimerBanner variant="ai" compact pageBottom />
        </div>
      </PageShell>
    </div>
  );
}
