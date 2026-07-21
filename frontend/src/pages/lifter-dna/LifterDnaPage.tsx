import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { LifterDnaCompareItem } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { lifterDnaApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { buildLifterDnaShareCard } from '@/utils/lifterDnaShareCard';
import './LifterDnaPage.css';

function stars(n: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - n));
}

function formatDelta(pct: number, locale: string): string {
  const sign = pct > 0 ? '+' : '';
  return locale.startsWith('ko') ? `${sign}${pct}%` : `${sign}${pct}%`;
}

function CompareList({
  title,
  items,
  locale,
}: {
  title: string;
  items: LifterDnaCompareItem[];
  locale: string;
}) {
  if (!items.length) return null;
  return (
    <section className="dna-section">
      <h3 className="dna-section__title">{title}</h3>
      <div className="dna-compare-grid">
        {items.map((item) => (
          <article key={item.id} className="dna-compare glass">
            <p className="dna-compare__label">{item.label}</p>
            <p className={`dna-compare__value${item.deltaPct >= 0 ? ' is-up' : ' is-down'}`}>
              {formatDelta(item.deltaPct, locale)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LifterDnaPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const [phase, setPhase] = useState<'boot' | 'ready'>('boot');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEYS.lifterDna,
    queryFn: async () => {
      const res = await lifterDnaApi.snapshot();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!data) return;
    setPhase('boot');
    const timer = window.setTimeout(() => setPhase('ready'), 1400);
    return () => window.clearTimeout(timer);
  }, [data?.analyzedAt]);

  const analyzedDate = useMemo(() => {
    if (!data) return '';
    const d = new Date(data.analyzedAt);
    return d.toLocaleDateString(locale.startsWith('ko') ? 'ko-KR' : 'en-US');
  }, [data, locale]);

  const handleShare = async () => {
    if (!data) return;
    try {
      const blob = await buildLifterDnaShareCard({
        snapshot: data,
        locale,
        displayName: user?.displayName ?? 'MachineFit',
      });
      const file = new File([blob], 'machinefit-lifter-dna.png', { type: 'image/png' });
      const text = `${data.shareHeadline}\nAI ${data.confidence}%\n#MachineFit #LifterDNA`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'MachineFit AI Lifter DNA' });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'machinefit-lifter-dna.png';
      a.click();
      URL.revokeObjectURL(url);
      await navigator.clipboard?.writeText(text).catch(() => undefined);
      showToast(t('lifterDna.shareSaved'), 'success');
    } catch {
      showToast(t('errors.submitFailed'), 'error');
    }
  };

  return (
    <div className="dna-page">
      <PageShell
        title={t('lifterDna.title')}
        action={
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => refetch()}>
            {isFetching ? t('lifterDna.analyzing') : t('lifterDna.refresh')}
          </button>
        }
      >
        {isLoading || !data ? (
          <Skeleton count={6} height={80} />
        ) : isError ? (
          <p className="dna-error">{t('errors.loadFailed')}</p>
        ) : phase === 'boot' ? (
          <div className="dna-boot glass" aria-live="polite">
            <div className="dna-boot__orb" />
            <p className="dna-boot__title">{t('lifterDna.analyzing')}</p>
            <p className="dna-boot__sub">{t('lifterDna.analyzingHint')}</p>
          </div>
        ) : (
          <>
            <header className="dna-hero glass">
              <p className="dna-hero__eyebrow">{t('lifterDna.complete')}</p>
              <div className="dna-hero__emoji" aria-hidden>
                {data.character.emoji}
              </div>
              <h2 className="dna-hero__title">{data.shareHeadline}</h2>
              <p className="dna-hero__tag">{data.character.tagline}</p>
              <p className="dna-hero__stars" aria-label={`${data.confidenceStars} stars`}>
                {stars(data.confidenceStars)}
              </p>
              <div className="dna-hero__meta">
                <div>
                  <span>{t('lifterDna.confidence')}</span>
                  <strong>{data.confidence}%</strong>
                </div>
                <div>
                  <span>{t('lifterDna.basis')}</span>
                  <strong>
                    {t('lifterDna.basisValue', { count: data.analyzedLogs })}
                  </strong>
                </div>
                <div>
                  <span>{t('lifterDna.analyzedAt')}</span>
                  <strong>{analyzedDate}</strong>
                </div>
              </div>
              <p className="dna-hero__oneliner">“{data.oneLiner}”</p>
              <button type="button" className="btn btn--primary dna-share-btn" onClick={handleShare}>
                {t('lifterDna.share')}
              </button>
            </header>

            <section className="dna-section">
              <h3 className="dna-section__title">{t('lifterDna.traits')}</h3>
              <div className="dna-trait-grid">
                {data.traits.map((trait) => (
                  <article key={trait.id} className="dna-trait glass">
                    <p className="dna-trait__label">
                      <span aria-hidden>{trait.emoji}</span> {trait.label}
                    </p>
                    <p className="dna-trait__stars">{stars(trait.stars)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="dna-section">
              <h3 className="dna-section__title">{t('lifterDna.habits')}</h3>
              <ul className="dna-habits">
                {data.habits.map((habit) => (
                  <li key={habit.id} className="dna-habits__item glass">
                    <span aria-hidden>{habit.emoji}</span>
                    <div>
                      <p className="dna-habits__label">{habit.label}</p>
                      <p className="dna-habits__value">{habit.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="dna-section">
              <h3 className="dna-section__title">{t('lifterDna.recommendations')}</h3>
              <ul className="dna-recos">
                {data.recommendations.map((item) => (
                  <li key={item.id} className="dna-recos__item glass">
                    ✨ {item.text}
                  </li>
                ))}
              </ul>
            </section>

            <section className="dna-section">
              <h3 className="dna-section__title">{t('lifterDna.forecast')}</h3>
              <p className="dna-section__hint">{t('lifterDna.forecastHint')}</p>
              <div className="dna-forecast-grid">
                {data.forecast.map((item) => (
                  <article key={item.id} className="dna-forecast glass">
                    <p className="dna-forecast__label">{item.label}</p>
                    <p className="dna-forecast__stars">{stars(item.stars)}</p>
                    <p className="dna-forecast__detail">{item.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <CompareList
              title={t('lifterDna.friendCompare')}
              items={data.friendCompare}
              locale={locale}
            />
            <CompareList title={t('lifterDna.gymCompare')} items={data.gymCompare} locale={locale} />
            <CompareList
              title={t('lifterDna.nationalCompare')}
              items={data.nationalCompare}
              locale={locale}
            />
            <CompareList
              title={t('lifterDna.globalCompare')}
              items={data.globalCompare}
              locale={locale}
            />

            <section className="dna-section">
              <h3 className="dna-section__title">{t('lifterDna.badges')}</h3>
              {data.badges.length === 0 ? (
                <p className="dna-empty">{t('lifterDna.noBadges')}</p>
              ) : (
                <div className="dna-badge-grid">
                  {data.badges.map((badge) => (
                    <article key={badge.id} className="dna-badge glass">
                      <p className="dna-badge__emoji" aria-hidden>
                        {badge.emoji}
                      </p>
                      <p className="dna-badge__name">{badge.name}</p>
                      <p className="dna-badge__desc">{badge.description}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </PageShell>
    </div>
  );
}
