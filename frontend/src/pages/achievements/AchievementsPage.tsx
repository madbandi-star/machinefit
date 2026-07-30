import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  AchievementCategory,
  AchievementProgressItem,
  AchievementRarity,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { achievementsApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { buildAchievementShareCard } from '@/utils/achievementShareCard';
import { buildShareHashtags, toShareHashtag } from '@/utils/shareHashtags';
import {
  clearAchievementUnlockPopupHideToday,
  isAchievementUnlockPopupEnabled,
  isAchievementUnlockPopupHiddenToday,
  setAchievementUnlockPopupEnabled,
} from '@/utils/achievementUnlockPopupPrefs';
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

/** Achievement unlock timestamp for popup / cards (date + time). */
function formatEarnedAt(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Achievement unlock date/time split for share card meta panel. */
function formatShareEarnedAt(
  iso: string | undefined,
  locale: string
): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ko = locale.startsWith('ko');
  return {
    date: d.toLocaleDateString(ko ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: d.toLocaleTimeString(ko ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: ko,
    }),
  };
}

export function AchievementsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const location = useLocation();
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, isRealGym, memberScopeReady } = useActiveMember();
  const [tab, setTab] = useState<ViewTab>('overview');
  const [category, setCategory] = useState<AchievementCategory | 'all'>('consistency');
  const [unlockBatch, setUnlockBatch] = useState<AchievementProgressItem[]>([]);
  const [unlockIndex, setUnlockIndex] = useState(0);
  const [seenUnlockKey, setSeenUnlockKey] = useState('');
  const [popupEnabled, setPopupEnabled] = useState(() => isAchievementUnlockPopupEnabled());
  const [heroExpanded, setHeroExpanded] = useState(false);
  const unlockStripRef = useRef<HTMLDivElement | null>(null);

  // Each navigation into this page counts as a new visit for unlock popups.
  useEffect(() => {
    setSeenUnlockKey('');
  }, [location.key]);

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
    staleTime: 90_000,
  });

  const rankingsQuery = useQuery({
    queryKey: QUERY_KEYS.achievementRankings,
    queryFn: async () => {
      const res = await achievementsApi.rankings({ limit: 50 });
      return res.data.data;
    },
    enabled: tab === 'rankings',
    staleTime: 180_000,
  });

  const unlockedForPopup = useMemo(
    () => (data?.items ?? []).filter((item) => item.unlocked),
    [data?.items]
  );

  useEffect(() => {
    if (!popupEnabled || isAchievementUnlockPopupHiddenToday()) {
      setUnlockBatch([]);
      setUnlockIndex(0);
      return;
    }
    // Confirmed + unconfirmed: every unlocked achievement on each page visit.
    if (!unlockedForPopup.length) return;
    const key = unlockedForPopup
      .map((i) => i.def.id)
      .sort()
      .join('|');
    if (key === seenUnlockKey) return;
    setSeenUnlockKey(key);
    setUnlockBatch(unlockedForPopup);
    setUnlockIndex(0);
    try {
      navigator.vibrate?.(40);
    } catch {
      /* ignore */
    }
  }, [unlockedForPopup, seenUnlockKey, popupEnabled]);

  const unlockBatchTotal = unlockBatch.length;
  const currentUnlock = unlockBatch[unlockIndex] ?? null;
  const currentUnlockEarnedAt = currentUnlock
    ? formatEarnedAt(currentUnlock.earnedAt, locale)
    : null;
  const unlockDisplayIndex = unlockBatchTotal > 0 ? unlockIndex + 1 : 1;
  const unlockRemaining = Math.max(0, unlockBatchTotal - unlockDisplayIndex);
  const isLastUnlock = unlockBatchTotal > 0 && unlockIndex >= unlockBatchTotal - 1;

  useEffect(() => {
    if (!currentUnlock || unlockBatchTotal <= 1) return;
    const strip = unlockStripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(
      `[data-unlock-index="${unlockIndex}"]`
    );
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentUnlock, unlockIndex, unlockBatchTotal]);

  const dismissUnlockQueue = () => {
    setUnlockBatch([]);
    setUnlockIndex(0);
  };

  const advanceUnlockQueue = () => {
    if (unlockBatchTotal <= 0) {
      dismissUnlockQueue();
      return;
    }
    if (unlockIndex >= unlockBatchTotal - 1) {
      dismissUnlockQueue();
      return;
    }
    setUnlockIndex((i) => i + 1);
  };

  const goToUnlockIndex = (index: number) => {
    if (index < 0 || index >= unlockBatchTotal) return;
    setUnlockIndex(index);
  };

  const handlePopupEnabledChange = (checked: boolean) => {
    setPopupEnabled(checked);
    setAchievementUnlockPopupEnabled(checked);
    if (checked) {
      clearAchievementUnlockPopupHideToday();
      setSeenUnlockKey('');
    } else {
      setUnlockBatch([]);
      setUnlockIndex(0);
    }
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
      const shareEarnedAt = formatShareEarnedAt(item.earnedAt, locale);
      const blob = await buildAchievementShareCard({
        emoji: item.obscured ? '❓' : item.def.emoji,
        name: item.obscured ? '???' : loc(item.def.name, locale),
        description: item.obscured
          ? t('achievements.secretDesc')
          : loc(item.def.description, locale),
        rarity: t(`achievements.rarity.${item.rarity}`),
        rarityKey: item.rarity,
        xp: item.def.xp,
        locale,
        labels: {
          badge: t('achievements.shareBadge'),
          tagline: t('achievements.shareTagline'),
          hashtags: buildShareHashtags(
            [toShareHashtag(user?.displayName)].filter(Boolean),
            t('achievements.shareHashtags')
          ),
          metaRarity: t('achievements.shareMetaRarity'),
          metaXp: t('achievements.shareMetaXp'),
          metaEarnedAt: t('achievements.shareMetaEarnedAt'),
          earnedAtDate: shareEarnedAt?.date ?? '—',
          earnedAtTime: shareEarnedAt?.time ?? '',
        },
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

  const achievementTabs = (
    <div className="achievements-tabs" role="tablist" aria-label={t('achievements.title')}>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'overview'}
        className={`achievements-tab${tab === 'overview' ? ' achievements-tab--active' : ''}`}
        onClick={() => setTab('overview')}
      >
        {t('achievements.tabOverview')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'rankings'}
        className={`achievements-tab${tab === 'rankings' ? ' achievements-tab--active' : ''}`}
        onClick={() => setTab('rankings')}
      >
        {t('achievements.tabRankings')}
      </button>
    </div>
  );

  return (
    <div className="achievements-page">
      <PageShell
        title={
          <div className="achievements-page__title-row">
            <h1 className="page-title">{t('achievements.title')}</h1>
            {achievementTabs}
          </div>
        }
        action={
          <label
            className="achievements-popup-switch"
            title={t('achievements.popupPrefHint')}
          >
            <span className="achievements-popup-switch__label">
              {t('achievements.popupPrefShort')}
            </span>
            <span className="achievements-popup-switch__control">
              <input
                type="checkbox"
                className="achievements-popup-switch__input"
                checked={popupEnabled}
                onChange={(event) => handlePopupEnabledChange(event.target.checked)}
                aria-label={t('achievements.popupPrefShort')}
              />
              <span className="achievements-popup-switch__track" aria-hidden />
            </span>
          </label>
        }
      >
        <div className="achievements-page__body">
        {isLoading && <Skeleton count={5} height={72} />}
        {isError && <p className="form-error-summary">{t('achievements.loadError')}</p>}

        {data && (
          <>
            <section
              className={`achievements-hero${heroExpanded ? ' achievements-hero--expanded' : ' achievements-hero--collapsed'}`}
              aria-label={t('achievements.summary')}
            >
              <button
                type="button"
                className="achievements-hero__toggle"
                onClick={() => setHeroExpanded((v) => !v)}
                aria-expanded={heroExpanded}
                aria-controls="achievements-hero-details"
              >
                <span className="achievements-hero__summary">
                  <span className="achievements-hero__summary-label">{t('achievements.completed')}</span>
                  <span className="achievements-hero__summary-count">
                    {formatInt(data.summary.completed, locale)}/{formatInt(data.summary.total, locale)}
                  </span>
                  {data.activeTitle ? (
                    <span className="achievements-hero__summary-title">
                      {loc(data.activeTitle, locale)}
                    </span>
                  ) : null}
                </span>
                <Icon
                  name="chevronDown"
                  size={18}
                  className="achievements-hero__chevron"
                  aria-hidden
                />
                <span className="visually-hidden">
                  {heroExpanded ? t('collapse') : t('expand')}
                </span>
              </button>

              <div
                className="achievements-level-bar"
                aria-label={t('achievements.levelXpBarLabel')}
              >
                <div className="achievements-level-bar__labels">
                  <span className="achievements-level-bar__current">
                    Lv.{formatInt(data.summary.level.level, locale)}
                  </span>
                  <span className="achievements-level-bar__next">
                    {data.summary.level.xpToNextLevel > 0
                      ? `Lv.${formatInt(data.summary.level.level + 1, locale)}`
                      : t('achievements.levelMax')}
                  </span>
                </div>
                <div
                  className="achievements-level-bar__track"
                  role="progressbar"
                  aria-valuenow={Math.round(data.summary.level.progressPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('achievements.levelProgress')}
                >
                  <div
                    className="achievements-level-bar__fill"
                    style={{ width: `${Math.min(100, data.summary.level.progressPct)}%` }}
                  />
                </div>
                <div className="achievements-level-bar__meta">
                  <span>
                    {formatInt(data.summary.level.xpIntoLevel, locale)} /{' '}
                    {formatInt(data.summary.level.xpForNextLevel, locale)} XP
                  </span>
                  <span className="achievements-level-bar__remaining">
                    {data.summary.level.xpToNextLevel > 0
                      ? t('achievements.levelXpRemaining', {
                          xp: formatInt(data.summary.level.xpToNextLevel, locale),
                        })
                      : t('achievements.levelMax')}
                  </span>
                </div>
              </div>

              {heroExpanded ? (
                <div id="achievements-hero-details" className="achievements-hero__details">
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
                </div>
              ) : null}
            </section>

            {tab === 'overview' && (
              <>
                <div className="achievements-filters" aria-label={t('achievements.categories')}>
                  <button
                    type="button"
                    className={`achievements-chip${category === 'all' ? ' achievements-chip--active' : ''}`}
                    onClick={() => setCategory('all')}
                  >
                    <span className="achievements-chip__emoji" aria-hidden>
                      ✨
                    </span>
                    <span className="achievements-chip__label">{t('achievements.all')}</span>
                  </button>
                  {data.categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`achievements-chip${category === cat ? ' achievements-chip--active' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      <span className="achievements-chip__emoji" aria-hidden>
                        {CATEGORY_EMOJI[cat]}
                      </span>
                      <span className="achievements-chip__label">
                        {t(`achievements.category.${cat}`)}
                      </span>
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
                      onShare={() => void handleShare(item)}
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
                onClick={() => void dismissUnlockQueue()}
                aria-label={t('achievements.dismissAll')}
              >
                ×
              </button>
              {unlockBatchTotal > 1 ? (
                <p className="achievement-unlock__progress">
                  {t('achievements.unlockBatchProgress', {
                    current: unlockDisplayIndex,
                    total: unlockBatchTotal,
                  })}
                </p>
              ) : null}
              <div className="achievement-unlock__emoji">{currentUnlock.def.emoji}</div>
              <p className="achievement-unlock__eyebrow">{t('achievements.unlocked')}</p>
              <h3 className="achievement-unlock__name">{loc(currentUnlock.def.name, locale)}</h3>
              {currentUnlockEarnedAt ? (
                <p className="achievement-unlock__earned-at">
                  {t('achievements.earnedAt', { datetime: currentUnlockEarnedAt })}
                </p>
              ) : null}
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
                  onClick={() => void advanceUnlockQueue()}
                >
                  {isLastUnlock
                    ? t('achievements.done')
                    : t('achievements.continueWithProgress', {
                        current: unlockDisplayIndex,
                        total: unlockBatchTotal,
                      })}
                </button>
              </div>
              {unlockBatchTotal > 1 ? (
                <div
                  ref={unlockStripRef}
                  className="achievement-unlock__strip"
                  role="tablist"
                  aria-label={t('achievements.unlockBatchProgress', {
                    current: unlockDisplayIndex,
                    total: unlockBatchTotal,
                  })}
                >
                  {unlockBatch.map((item, index) => {
                    const active = index === unlockIndex;
                    const name = loc(item.def.name, locale);
                    return (
                      <button
                        key={item.def.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        data-unlock-index={index}
                        className={`achievement-unlock__strip-item${
                          active ? ' achievement-unlock__strip-item--active' : ''
                        }`}
                        onClick={() => goToUnlockIndex(index)}
                        title={name}
                        aria-label={`${index + 1}. ${name}`}
                      >
                        <span className="achievement-unlock__strip-emoji" aria-hidden>
                          {item.def.emoji}
                        </span>
                        <span className="achievement-unlock__strip-num">{index + 1}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        )}
        </div>
      </PageShell>
    </div>
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
  const unlockRateLabel =
    item.unlockRatePct != null
      ? `${item.unlockRatePct}% ${t('achievements.unlockRate')}`
      : null;

  return (
    <article
      className={`achievement-card${item.unlocked ? ' achievement-card--unlocked' : ' achievement-card--locked'}`}
      title={[desc, unlockRateLabel].filter(Boolean).join(' · ')}
    >
      <div className="achievement-card__header">
        <span className="achievement-card__emoji" aria-hidden>
          {item.obscured ? '❓' : item.def.emoji}
        </span>
        {item.unlocked ? (
          <button
            type="button"
            className="achievement-card__share"
            onClick={onShare}
            aria-label={t('achievements.share')}
          >
            <Icon name="share" size={14} />
          </button>
        ) : null}
      </div>
      <h3 className="achievement-card__name">{name}</h3>
      <span className={`achievement-card__rarity achievement-card__rarity--${item.rarity}`}>
        {t(`achievements.rarity.${item.rarity}`)}
      </span>
      <p className="achievement-card__desc">{desc}</p>
      <div className="achievement-card__bar" aria-hidden>
        <span style={{ width: `${item.obscured && !item.unlocked ? 0 : item.progressPct}%` }} />
      </div>
      <div className="achievement-card__meta">
        <span>{progressLabel}</span>
        <span>+{formatInt(item.def.xp, locale)} XP</span>
      </div>
    </article>
  );
}
