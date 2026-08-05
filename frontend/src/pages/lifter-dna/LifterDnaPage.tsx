import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ageFromBirthDate } from '@machinefit/shared';
import { SITE_DOMAIN } from '@/config/site';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { LegalDisclaimerBanner } from '@/components/compliance/LegalDisclaimerBanner';
import { lifterDnaApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { buildLifterDnaShareCard } from '@/utils/lifterDnaShareCard';
import { buildShareHashtags, toShareHashtag } from '@/utils/shareHashtags';
import { predictLifterTendencyFromProfile } from '@/utils/predictLifterTendency';
import './LifterDnaPage.css';

function stars(n: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - n));
}

export function LifterDnaPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const { activeGymId } = useActiveGym();
  const { activeMember, activeMemberId, isRealGym, memberScopeReady } = useActiveMember();
  const [phase, setPhase] = useState<'boot' | 'ready'>('boot');

  const scopeParams =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.lifterDna(activeGymId, activeMemberId),
    queryFn: async () => {
      const res = await lifterDnaApi.snapshot(scopeParams);
      return res.data.data;
    },
    enabled: memberScopeReady,
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

  const hasWorkoutLogs = (data?.analyzedLogs ?? 0) > 0;

  const predictedTendencies = useMemo(() => {
    if (!data || hasWorkoutLogs) return [];
    const useMemberProfile = Boolean(activeMember && !activeMember.isSelf);
    return predictLifterTendencyFromProfile({
      gender: useMemberProfile ? activeMember?.gender : user?.gender,
      age: useMemberProfile ? ageFromBirthDate(activeMember?.birthDate) : user?.age,
      heightCm: useMemberProfile ? activeMember?.heightCm : user?.heightCm,
      weightKg: useMemberProfile ? activeMember?.weightKg : user?.weightKg,
      workoutGoal: user?.workoutGoal,
    });
  }, [activeMember, data, hasWorkoutLogs, user]);

  const handleShare = async () => {
    if (!data) return;
    try {
      const blob = await buildLifterDnaShareCard({
        snapshot: data,
        labels: {
          complete: t('lifterDna.complete'),
          confidence: t('lifterDna.confidence'),
          basis: t('lifterDna.basis'),
          basisValue: t('lifterDna.basisValue', { count: data.analyzedLogs }),
          analyzedAt: t('lifterDna.analyzedAt'),
          tagline: t('lifterDna.shareTagline'),
          hashtags: buildShareHashtags(
            [toShareHashtag(user?.displayName)].filter(Boolean),
            t('lifterDna.shareHashtags')
          ),
        },
        analyzedDate,
      });
      const file = new File([blob], 'machinefit-lifter-dna.png', { type: 'image/png' });
      const text = `${data.shareHeadline}\nAI ${data.confidence}%\n${SITE_DOMAIN}\n${t('lifterDna.shareHashtags')}`;
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
      <PageShell title={t('lifterDna.title')}>
        {isLoading || !data ? (
          <Skeleton count={6} height={80} />
        ) : isError ? (
          <p className="dna-error">{t('errors.loadFailed')}</p>
        ) : phase === 'boot' ? (
          <div className="dna-boot glass" aria-live="polite">
            <div className="dna-boot__orb" />
            <p className="dna-boot__title">
              {hasWorkoutLogs ? t('lifterDna.analyzing') : t('lifterDna.predictionAnalyzing')}
            </p>
            <p className="dna-boot__sub">
              {hasWorkoutLogs
                ? t('lifterDna.analyzingHint')
                : t('lifterDna.predictionAnalyzingHint')}
            </p>
          </div>
        ) : !hasWorkoutLogs ? (
          <section className="dna-prediction glass" aria-live="polite">
            <span className="dna-prediction__badge">{t('lifterDna.predictionBadge')}</span>
            <p className="dna-prediction__lead">{t('lifterDna.predictionLead')}</p>
            <h2 className="dna-prediction__empty">{t('lifterDna.predictionEmptyTitle')}</h2>
            <p className="dna-prediction__result-title">{t('lifterDna.predictionResultTitle')}</p>
            <ul className="dna-prediction__list">
              {predictedTendencies.map((row) => (
                <li key={row.id} className="dna-prediction__item">
                  <span className="dna-prediction__emoji" aria-hidden>
                    {row.emoji}
                  </span>
                  <span className="dna-prediction__name">
                    {t(`lifterDna.tendency.${row.id}`)}
                  </span>
                  <strong className="dna-prediction__pct">{row.percent}%</strong>
                  <span
                    className="dna-prediction__bar"
                    style={{ width: `${row.percent}%` }}
                    aria-hidden
                  />
                </li>
              ))}
            </ul>
            <p className="dna-prediction__cta">{t('lifterDna.predictionCta')}</p>
          </section>
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

            <section className="dna-section">
              <h3 className="dna-section__title">{t('lifterDna.habits')}</h3>
              <div className="dna-habits glass">
                {data.habits.map((habit) => (
                  <article key={habit.id} className="dna-habits__item">
                    <span className="dna-habits__emoji" aria-hidden>
                      {habit.emoji}
                    </span>
                    <p className="dna-habits__label">{habit.label}</p>
                    <p className="dna-habits__value" title={habit.value}>
                      {habit.value}
                    </p>
                  </article>
                ))}
              </div>
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
          </>
        )}
        {!isLoading && data && !isError && phase !== 'boot' ? (
          <LegalDisclaimerBanner variant="ai" compact pageBottom />
        ) : null}
      </PageShell>
    </div>
  );
}
