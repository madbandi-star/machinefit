import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  AchievementCategory,
  AchievementProgressItem,
  AchievementRarity,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { achievementsApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { buildAchievementShareCard } from '@/utils/achievementShareCard';
import './AchievementsPage.css';

type ViewTab = 'overview' | 'rankings';

const CATEGORY_EMOJI: Record<AchievementCategory, string> = {
  volume: '🏋️',
  reality: '🌎',
  workouts: '🔥',
  attendance: '📅',
  time_of_day: '⏰',
  consistency: '❤️',
  pr: '🏆',
  machine: '🏋️',
  muscle: '💪',
  gym: '🏢',
  region: '🌎',
  ai: '🤖',
  challenge: '🎯',
  event: '🎁',
  hidden: '⭐',
  season: '👑',
};

function loc(
  text: { ko: string; en: string } | null | undefined,
  locale: string
): string {
  if (!text) return '';
  return locale.startsWith('ko') ? text.ko : text.en;
}

function formatInt(n: number, locale: string): string {
  return Math.floor(n).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US');
}

export function AchievementsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, isRealGym, memberScopeReady } = useActiveMember();
  const [tab, setTab] = useState<ViewTab>('overview');
  const [category, setCategory] = useState<AchievementCategory | 'all'>('all');
  const [unlockQueue, setUnlockQueue] = useState<AchievementProgressItem[]>([]);
  const [unlockBatchTotal, setUnlockBatchTotal] = useState(0);
  const [seenUnlockKey, setSeenUnlockKey] = useState('');

  const scopeParams =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.achievements(activeGymId, activeMemberId),
    queryFn: async () => {
      const res = await achievementsApi.snapshot(scopeParams);
      return res.data.data;
    },
    enabled: memberScopeReady,
    staleTime: 15_000,
  });

  const rankingsQuery = useQuery({
    queryKey: QUERY_KEYS.achievementRankings,
    queryFn: async () => {
      const res = await achievementsApi.rankings({ limit: 50 });
      return res.data.data;
    },
    enabled: tab === 'rankings',
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data?.newlyUnlocked?.length) return;
    const key = data.newlyUnlocked.map((i) => i.def.id).join('|');
    if (key === seenUnlockKey) return;
    setSeenUnlockKey(key);
    setUnlockQueue(data.newlyUnlocked);
    setUnlockBatchTotal(data.newlyUnlocked.length);
    try {
      navigator.vibrate?.(40);
    } catch {
      /* ignore */
    }
  }, [data, seenUnlockKey]);

  const currentUnlock = unlockQueue[0] ?? null;
  const unlockIndex =
    unlockBatchTotal > 0 ? unlockBatchTotal - unlockQueue.length + 1 : 1;
  const unlockRemaining = Math.max(0, unlockQueue.length - 1);
  const isLastUnlock = unlockQueue.length <= 1;

  const dismissUnlockQueue = () => {
    setUnlockQueue([]);
    setUnlockBatchTotal(0);
  };

  const advanceUnlockQueue = () => {
    if (unlockQueue.length <= 1) {
      dismissUnlockQueue();
      return;
    }
    setUnlockQueue((q) => q.slice(1));
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    if (category !== 'all') {
      items = items.filter((i) => i.def.category === category);
    }
    return [...items].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      if (a.obscured !== b.obscured) return a.obscured ? 1 : -1;
      return b.progressPct - a.progressPct;
    });
  }, [data, category]);

  const handleShare = async (item: AchievementProgressItem) => {
    try {
      const blob = await buildAchievementShareCard({
        emoji: item.obscured ? '❓' : item.def.emoji,
        name: item.obscured ? '???' : loc(item.def.name, locale),
        description: item.obscured
          ? t('achievements.secretDesc')
          : loc(item.def.description, locale),
        rarity: t(`achievements.rarity.${item.rarity}`),
        xp: item.def.xp,
        locale,
        displayName: user?.displayName ?? 'MachineFit',
      });
      const file = new File([blob], 'machinefit-achievement.png', { type: 'image/png' });
      const text = t('achievements.shareText', {
        name: item.obscured ? '???' : loc(item.def.name, locale),
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'MachineFit' });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'machinefit-achievement.png';
      a.click();
      URL.revokeObjectURL(url);
      await navigator.clipboard?.writeText(text).catch(() => undefined);
      showToast(t('achievements.shareSaved'), 'success');
    } catch {
      showToast(t('achievements.shareFailed'), 'error');
    }
  };

  return (
    <PageShell title={t('achievements.title')}>
      <div className="achievements-page">
        {isLoading && <Skeleton count={5} height={72} />}
        {isError && <p className="form-error-summary">{t('achievements.loadError')}</p>}

        {data && (
          <>
            <section className="achievements-hero" aria-label={t('achievements.summary')}>
              <div className="achievements-hero__title-row">
                <h2 className="achievements-hero__title">{t('achievements.completed')}</h2>
                <span className="achievements-hero__level">
                  Lv.{data.summary.level.level}
                </span>
              </div>
              <p className="achievements-hero__sub">
                {formatInt(data.summary.completed, locale)} / {formatInt(data.summary.total, locale)}
                {data.activeTitle ? ` · ${loc(data.activeTitle, locale)}` : ''}
              </p>
              <div className="achievements-progress" aria-hidden>
                <div
                  className="achievements-progress__bar"
                  style={{ width: `${Math.min(100, data.summary.completionPct)}%` }}
                />
              </div>
              <div className="achievements-stats">
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.completionRate')}</span>
                  <span className="achievements-stat__value">{data.summary.completionPct}%</span>
                </div>
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.xp')}</span>
                  <span className="achievements-stat__value">
                    {formatInt(data.summary.totalXp, locale)} XP
                  </span>
                </div>
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.nextLevel')}</span>
                  <span className="achievements-stat__value">
                    {formatInt(data.summary.level.xpToNextLevel, locale)} XP
                  </span>
                </div>
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.badges')}</span>
                  <span className="achievements-stat__value">
                    {formatInt(data.summary.badgeCount, locale)}
                  </span>
                </div>
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.rare')}</span>
                  <span className="achievements-stat__value">
                    {formatInt(data.summary.rareCount, locale)}
                  </span>
                </div>
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.hidden')}</span>
                  <span className="achievements-stat__value">
                    {data.summary.hiddenUnlocked > 0
                      ? `${data.summary.hiddenUnlocked}/${data.summary.hiddenTotal}`
                      : '???'}
                  </span>
                </div>
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.inProgress')}</span>
                  <span className="achievements-stat__value">
                    {formatInt(data.summary.inProgress, locale)}
                  </span>
                </div>
                <div className="achievements-stat">
                  <span className="achievements-stat__label">{t('achievements.levelProgress')}</span>
                  <span className="achievements-stat__value">{data.summary.level.progressPct}%</span>
                </div>
              </div>
            </section>

            <div className="achievements-toolbar">
              <div className="achievements-tabs" role="tablist">
                <button
                  type="button"
                  className={`achievements-tab${tab === 'overview' ? ' achievements-tab--active' : ''}`}
                  onClick={() => setTab('overview')}
                >
                  {t('achievements.tabOverview')}
                </button>
                <button
                  type="button"
                  className={`achievements-tab${tab === 'rankings' ? ' achievements-tab--active' : ''}`}
                  onClick={() => setTab('rankings')}
                >
                  {t('achievements.tabRankings')}
                </button>
              </div>
              <Link to={ROUTES.MY_PAGE} className="achievements-link">
                {t('achievements.backToMyPage')}
              </Link>
            </div>

            {tab === 'overview' && (
              <>
                <div className="achievements-filters" aria-label={t('achievements.categories')}>
                  <button
                    type="button"
                    className={`achievements-chip${category === 'all' ? ' achievements-chip--active' : ''}`}
                    onClick={() => setCategory('all')}
                  >
                    {t('achievements.all')}
                  </button>
                  {data.categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`achievements-chip${category === cat ? ' achievements-chip--active' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      {CATEGORY_EMOJI[cat]} {t(`achievements.category.${cat}`)}
                    </button>
                  ))}
                </div>

                <div className="achievements-grid">
                  {filtered.map((item) => (
                    <AchievementCard
                      key={item.def.id}
                      item={item}
                      locale={locale}
                      t={t}
                      onShare={() => handleShare(item)}
                    />
                  ))}
                </div>
              </>
            )}

            {tab === 'rankings' && (
              <div className="achievements-rank-list">
                {rankingsQuery.isLoading && <Skeleton count={6} height={56} />}
                {rankingsQuery.data?.me && (
                  <div className="achievements-rank-row achievements-rank-row--me">
                    <span className="achievements-rank-row__rank">#{rankingsQuery.data.me.rank}</span>
                    <div>
                      <span className="achievements-rank-row__name">
                        {rankingsQuery.data.me.displayName}
                      </span>
                      <span className="achievements-rank-row__title">
                        Lv.{rankingsQuery.data.me.level}
                        {rankingsQuery.data.me.activeTitle
                          ? ` · ${loc(rankingsQuery.data.me.activeTitle, locale)}`
                          : ''}
                      </span>
                    </div>
                    <span className="achievements-rank-row__xp">
                      {formatInt(rankingsQuery.data.me.totalXp, locale)} XP
                    </span>
                  </div>
                )}
                {rankingsQuery.data?.entries.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`achievements-rank-row${entry.userId === user?.id ? ' achievements-rank-row--me' : ''}`}
                  >
                    <span className="achievements-rank-row__rank">#{entry.rank}</span>
                    <div>
                      <span className="achievements-rank-row__name">{entry.displayName}</span>
                      <span className="achievements-rank-row__title">
                        Lv.{entry.level}
                        {entry.activeTitle ? ` · ${loc(entry.activeTitle, locale)}` : ''}
                        {' · '}
                        {t('achievements.completedCount', { count: entry.completed })}
                      </span>
                    </div>
                    <span className="achievements-rank-row__xp">
                      {formatInt(entry.totalXp, locale)} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentUnlock && (
          <div
            className="achievement-unlock"
            role="dialog"
            aria-modal="true"
            aria-label={t('achievements.unlocked')}
          >
            <div className="achievement-unlock__card">
              <button
                type="button"
                className="achievement-unlock__close"
                onClick={dismissUnlockQueue}
                aria-label={t('achievements.dismissAll')}
              >
                ×
              </button>
              {unlockBatchTotal > 1 ? (
                <p className="achievement-unlock__progress">
                  {t('achievements.unlockBatchProgress', {
                    current: unlockIndex,
                    total: unlockBatchTotal,
                  })}
                </p>
              ) : null}
              <div className="achievement-unlock__emoji">{currentUnlock.def.emoji}</div>
              <p className="achievement-unlock__eyebrow">{t('achievements.unlocked')}</p>
              <h3 className="achievement-unlock__name">{loc(currentUnlock.def.name, locale)}</h3>
              <p className="achievement-unlock__desc">
                {loc(currentUnlock.def.description, locale)}
                <br />
                +{formatInt(currentUnlock.def.xp, locale)} XP ·{' '}
                {t(`achievements.rarity.${currentUnlock.rarity as AchievementRarity}`)}
              </p>
              {unlockBatchTotal > 1 ? (
                <p className="achievement-unlock__batch-hint">
                  {t('achievements.unlockBatchHint', { count: unlockBatchTotal })}
                  {unlockRemaining > 0
                    ? ` · ${t('achievements.unlockRemaining', { count: unlockRemaining })}`
                    : ''}
                </p>
              ) : null}
              <div className="achievement-unlock__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => handleShare(currentUnlock)}
                >
                  {t('achievements.share')}
                </button>
                <button
                  type="button"
                  className="btn btn--block"
                  onClick={advanceUnlockQueue}
                >
                  {isLastUnlock
                    ? t('achievements.done')
                    : t('achievements.continueWithProgress', {
                        current: unlockIndex,
                        total: unlockBatchTotal,
                      })}
                </button>
                {unlockBatchTotal > 1 ? (
                  <button
                    type="button"
                    className="btn btn--secondary btn--block achievement-unlock__dismiss"
                    onClick={dismissUnlockQueue}
                  >
                    {t('achievements.dismissAll')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function AchievementCard({
  item,
  locale,
  t,
  onShare,
}: {
  item: AchievementProgressItem;
  locale: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onShare: () => void;
}) {
  const name = item.obscured ? '???' : loc(item.def.name, locale);
  const desc = item.obscured ? t('achievements.secretDesc') : loc(item.def.description, locale);
  const progressLabel = item.obscured
    ? '???'
    : `${formatInt(item.current, locale)} / ${formatInt(item.target, locale)}`;

  return (
    <article
      className={`achievement-card${item.unlocked ? ' achievement-card--unlocked' : ' achievement-card--locked'}`}
    >
      <div className="achievement-card__emoji" aria-hidden>
        {item.obscured ? '❓' : item.def.emoji}
      </div>
      <div className="achievement-card__body">
        <div className="achievement-card__top">
          <h3 className="achievement-card__name">{name}</h3>
          <span className={`achievement-card__rarity achievement-card__rarity--${item.rarity}`}>
            {t(`achievements.rarity.${item.rarity}`)}
          </span>
        </div>
        <p className="achievement-card__desc">{desc}</p>
        <div className="achievement-card__meta">
          <span>{progressLabel}</span>
          <span>
            +{formatInt(item.def.xp, locale)} XP
            {item.unlockRatePct != null
              ? ` · ${item.unlockRatePct}% ${t('achievements.unlockRate')}`
              : ''}
          </span>
        </div>
        <div className="achievement-card__bar" aria-hidden>
          <span style={{ width: `${item.obscured && !item.unlocked ? 0 : item.progressPct}%` }} />
        </div>
        {item.unlocked && (
          <button
            type="button"
            className="btn btn--block"
            style={{ marginTop: '0.65rem' }}
            onClick={onShare}
          >
            {t('achievements.share')}
          </button>
        )}
      </div>
    </article>
  );
}
