import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { LiftedScopeMode } from '@machinefit/shared';
import { LIFTED_BADGES, formatVolumeKg, kgToTons } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { liftedWeightApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { buildLiftedShareCard } from '@/utils/liftedShareCard';
import './LiftedWeightPage.css';

function useCountUp(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.floor(from + (target - from) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, durationMs]);

  return value;
}

export function LiftedWeightPage() {
  const { t, i18n } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const { activeGymId, gyms } = useActiveGym();
  const [mode, setMode] = useState<LiftedScopeMode>('user');
  const [gymId, setGymId] = useState<string | undefined>(activeGymId ?? undefined);

  useEffect(() => {
    if (activeGymId) setGymId(activeGymId);
  }, [activeGymId]);

  const queryGymId = mode === 'gym' ? gymId : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: [...QUERY_KEYS.liftedWeight, mode, queryGymId ?? ''],
    queryFn: async () => {
      const res = await liftedWeightApi.snapshot({ mode, gymId: queryGymId });
      return res.data.data;
    },
    enabled: mode !== 'gym' || Boolean(queryGymId),
    staleTime: 30_000,
  });

  const counted = useCountUp(data?.totalKg ?? 0);
  const locale = i18n.language.startsWith('ko') ? 'ko' : 'en';

  const modes = useMemo(
    () =>
      [
        { id: 'user' as const, label: t('liftedWeight.modeUser') },
        { id: 'gym' as const, label: t('liftedWeight.modeGym') },
        { id: 'global' as const, label: t('liftedWeight.modeGlobal') },
      ] as const,
    [t]
  );

  const handleShare = async () => {
    if (!data) return;
    try {
      const blob = await buildLiftedShareCard({
        headline: data.headline,
        totalKg: data.totalKg,
        comparison: data.comparisons[0],
        locale,
        displayName: user?.displayName ?? data.labelName,
      });
      const file = new File([blob], 'machinefit-lifted.png', { type: 'image/png' });
      const text = `${data.headline}\n${formatVolumeKg(data.totalKg, locale)} KG\n${t('liftedWeight.shareClosing')}`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'MachineFit' });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'machinefit-lifted.png';
      a.click();
      URL.revokeObjectURL(url);
      await navigator.clipboard?.writeText(text).catch(() => undefined);
      showToast(t('liftedWeight.shareSaved'), 'success');
    } catch {
      showToast(t('errors.submitFailed'), 'error');
    }
  };

  const badge = data?.badgeProgress;
  const nextName =
    badge?.nextBadge &&
    (locale === 'ko' ? badge.nextBadge.name.ko : badge.nextBadge.name.en);

  return (
    <div className="lifted-weight">
      <PageShell
        title={t('liftedWeight.title')}
        action={
          <Link to={ROUTES.LIFTED_WEIGHT_RANKINGS} className="btn btn--secondary btn--sm">
            {t('liftedWeight.rankings')}
          </Link>
        }
      >
        <p className="lifted-weight__subtitle fade-in">{t('liftedWeight.subtitle')}</p>

        <div className="lifted-weight__modes fade-in" role="tablist" aria-label={t('liftedWeight.modes')}>
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={`lifted-weight__mode${mode === item.id ? ' is-active' : ''}`}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === 'gym' && gyms.length > 0 && (
          <label className="lifted-weight__gym-select fade-in">
            <span>{t('liftedWeight.selectGym')}</span>
            <select
              value={gymId ?? ''}
              onChange={(e) => setGymId(e.target.value)}
            >
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {isLoading || !data ? (
          <Skeleton count={4} height={88} />
        ) : isError ? (
          <p className="lifted-weight__error">{t('errors.loadFailed')}</p>
        ) : (
          <>
            <section className="lifted-weight__hero parallax-layer">
              <div className="lifted-weight__hero-glow" aria-hidden />
              <p className="lifted-weight__emoji" aria-hidden>
                🏋️
              </p>
              <p className="lifted-weight__headline fade-in">{data.headline}</p>
              <p className="lifted-weight__total count-up">
                <span className="lifted-weight__total-num">
                  {formatVolumeKg(counted, locale)}
                </span>
                <span className="lifted-weight__total-unit">KG</span>
              </p>
              <p className="lifted-weight__closing fade-in">
                {t('liftedWeight.closing')}
              </p>
              <p className="lifted-weight__fun fade-in">{data.funLine}</p>
              <div className="lifted-weight__hero-actions">
                <button type="button" className="btn btn--primary" onClick={() => void handleShare()}>
                  {t('liftedWeight.share')}
                </button>
                <Link to={ROUTES.LIFTED_WEIGHT_RANKINGS} className="btn btn--secondary">
                  {t('liftedWeight.viewRankings')}
                </Link>
              </div>
            </section>

            <section className="lifted-weight__section">
              <h3 className="lifted-weight__section-title">{t('liftedWeight.comparisons')}</h3>
              <div className="lifted-weight__cards">
                {data.comparisons.map((card, index) => (
                  <article
                    key={card.id}
                    className="lifted-card slide-in"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="lifted-card__icon" aria-hidden>
                      {card.emoji}
                    </div>
                    <div className="lifted-card__body">
                      <h4 className="lifted-card__name">{card.name}</h4>
                      <p className="lifted-card__count">
                        {t('liftedWeight.aboutCount', {
                          count: formatVolumeKg(card.count, locale),
                          unit: card.unit,
                        })}
                      </p>
                      <p className="lifted-card__tip">{card.tip}</p>
                    </div>
                  </article>
                ))}
                {data.comparisons.length === 0 && (
                  <p className="lifted-weight__empty">{t('liftedWeight.noComparisons')}</p>
                )}
              </div>
            </section>

            <section className="lifted-weight__section">
              <h3 className="lifted-weight__section-title">{t('liftedWeight.badges')}</h3>
              <div className="lifted-badge-panel">
                <div className="lifted-badge-panel__current">
                  <span className="lifted-badge-panel__emoji" aria-hidden>
                    {badge?.currentBadge?.emoji ?? '🌱'}
                  </span>
                  <div>
                    <p className="lifted-badge-panel__label">{t('liftedWeight.current')}</p>
                    <p className="lifted-badge-panel__value">
                      {badge?.currentBadge
                        ? locale === 'ko'
                          ? badge.currentBadge.name.ko
                          : badge.currentBadge.name.en
                        : t('liftedWeight.noBadgeYet')}
                    </p>
                    <p className="lifted-badge-panel__tons">
                      {t('liftedWeight.tonsNow', {
                        tons: kgToTons(badge?.currentKg ?? 0),
                      })}
                    </p>
                  </div>
                </div>
                {badge?.nextBadge && (
                  <>
                    <div className="lifted-badge-panel__arrow" aria-hidden>
                      ↓
                    </div>
                    <p className="lifted-badge-panel__next">
                      {t('liftedWeight.nextBadge', {
                        name: nextName,
                        remaining: formatVolumeKg(badge.remainingKg, locale),
                      })}
                    </p>
                    <div
                      className="lifted-progress"
                      role="progressbar"
                      aria-valuenow={Math.round((badge.progressRatio ?? 0) * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="lifted-progress__bar"
                        style={{ width: `${Math.round((badge.progressRatio ?? 0) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
                <div className="lifted-badge-grid">
                  {LIFTED_BADGES.filter((b) => (badge?.earnedBadgeIds ?? []).includes(b.id)).map(
                    (b) => (
                      <span
                        key={b.id}
                        className="lifted-badge-chip"
                        title={locale === 'ko' ? b.name.ko : b.name.en}
                      >
                        {b.emoji}
                      </span>
                    )
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </PageShell>
    </div>
  );
}
