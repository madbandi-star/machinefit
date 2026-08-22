import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PointTransaction } from '@machinefit/shared';
import {
  getHellpowerLevelByNumber,
  getHellpowerProgress,
  type HellpowerLevelDef,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { pointsApi } from '@/api/points.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { HellpowerLadderSheet } from './HellpowerLadderSheet';
import './PointsPage.css';

const LAST_LEVEL_KEY = 'machinefit.lastHellpowerLevel';

function formatTxWhen(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function txSearchHaystack(tx: PointTransaction, locale: string): string {
  return [
    tx.description,
    tx.actionCode,
    tx.transactionType,
    String(tx.points),
    formatTxWhen(tx.createdAt, locale),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function formatRange(row: Pick<HellpowerLevelDef, 'minScore' | 'maxScore'>, locale: string): string {
  const min = row.minScore.toLocaleString(locale);
  if (row.maxScore == null) return `${min}+`;
  return `${min} ~ ${row.maxScore.toLocaleString(locale)}`;
}

function seoulDateKey(isoOrNow?: string): string {
  const d = isoOrNow ? new Date(isoOrNow) : new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

function ledgerEmoji(actionCode: string | null, points: number): string {
  if (points < 0) return '📉';
  switch (actionCode) {
    case 'workout_log_save':
    case 'workout_card_create':
      return '💪';
    case 'workout_complete':
    case 'daily_workout_done':
    case 'timer_session_complete':
      return '🏋️';
    case 'workout_streak':
      return '🔥';
    case 'power_box_claim':
      return '🎁';
    case 'community_post':
    case 'showcase_post':
    case 'template_share':
      return '📝';
    case 'community_like':
    case 'favorite_add':
      return '❤️';
    case 'machine_dex_discover':
    case 'showcase_claim':
      return '🏆';
    case 'signup_complete':
    case 'first_login':
    case 'profile_complete':
      return '✨';
    default:
      return '⚡';
  }
}

export function PointsPage() {
  const { t, i18n } = useTranslation();
  const unit = t('points.unit');
  const locale = i18n.language?.startsWith('ko') ? 'ko-KR' : i18n.language || 'en';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 200);
  const [ladderOpen, setLadderOpen] = useState(false);
  const [barReady, setBarReady] = useState(false);
  const [levelUp, setLevelUp] = useState<{
    from: HellpowerLevelDef;
    to: HellpowerLevelDef;
  } | null>(null);

  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.pointsBalance,
    queryFn: async () => (await pointsApi.getMine()).data.data,
  });

  const ledgerQuery = useQuery({
    queryKey: QUERY_KEYS.pointsLedger(0),
    queryFn: async () => (await pointsApi.ledger({ limit: 100, offset: 0 })).data.data,
  });

  const items = ledgerQuery.data?.items ?? [];
  const filteredItems = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((tx) => txSearchHaystack(tx, locale).includes(q));
  }, [items, debouncedQuery, locale]);

  const summary = summaryQuery.data;
  const balance = summary?.balance ?? 0;
  const earned = summary?.lifetimeEarned ?? 0;
  const hellpower = summary?.hellpower ?? null;
  const progress = useMemo(() => getHellpowerProgress(balance), [balance]);

  const todayEarned = useMemo(() => {
    const today = seoulDateKey();
    return items.reduce((sum, tx) => {
      if (tx.points <= 0) return sum;
      if (seoulDateKey(tx.createdAt) !== today) return sum;
      return sum + tx.points;
    }, 0);
  }, [items]);

  useEffect(() => {
    if (summaryQuery.isLoading) return;
    const id = window.setTimeout(() => setBarReady(true), 40);
    return () => window.clearTimeout(id);
  }, [summaryQuery.isLoading, progress.progressRatio]);

  useEffect(() => {
    if (!hellpower) return;
    try {
      const raw = localStorage.getItem(LAST_LEVEL_KEY);
      const prev = raw == null ? null : Number(raw);
      if (prev != null && Number.isFinite(prev) && prev > 0 && hellpower.level > prev) {
        const from = getHellpowerLevelByNumber(prev);
        const to = getHellpowerLevelByNumber(hellpower.level);
        if (from && to) setLevelUp({ from, to });
      }
      localStorage.setItem(LAST_LEVEL_KEY, String(hellpower.level));
    } catch {
      /* ignore */
    }
  }, [hellpower]);

  if (summaryQuery.isLoading || ledgerQuery.isLoading) {
    return (
      <PageShell title={t('points.title')}>
        <div className="points-page points-page--loading">
          <Skeleton count={1} height={220} />
          <Skeleton count={1} height={120} />
          <Skeleton count={3} height={72} />
        </div>
      </PageShell>
    );
  }

  const hasHistory = items.length > 0;
  const hasQuery = debouncedQuery.trim().length > 0;
  const visibleCount = filteredItems.length;
  const current = progress.current;
  const next = progress.next;
  const isMax = progress.isMaxLevel;
  const fillPct = Math.round((barReady ? progress.progressRatio : 0) * 1000) / 10;

  return (
    <PageShell title={t('points.title')}>
      <div className="points-page">
        {hellpower ? (
          <>
            <section
              className="hp-hero"
              aria-label={t('points.hellpower.levelLabel', {
                level: current.level,
                title: current.title,
              })}
            >
              <div className="hp-hero__glow" aria-hidden />
              <p
                className="hp-hero__emoji"
                aria-label={t('points.hellpower.levelLabel', {
                  level: current.level,
                  title: current.title,
                })}
              >
                {current.emoji}
              </p>
              <p className="hp-hero__lv">Lv.{current.level}</p>
              <h1 className="hp-hero__title">{current.title}</h1>
              <p className="hp-hero__score">
                <span className="hp-hero__score-value">{balance.toLocaleString(locale)}</span>
                <span className="hp-hero__score-unit">{t('points.hellpower.scoreLabel')}</span>
              </p>
              <p className="hp-hero__range">{formatRange(current, locale)}</p>
              {hellpower.topPercent != null ? (
                <p className="hp-hero__meta">
                  {t('points.hellpower.topPercent', { percent: hellpower.topPercent })}
                </p>
              ) : null}
              <p className="hp-hero__lifetime">
                {t('points.lifetime', { earned: earned.toLocaleString(locale) })}
              </p>
            </section>

            <section className="hp-xp" aria-label={t('points.hellpower.xpBarLabel')}>
              <div className="hp-xp__ends">
                <div className="hp-xp__end">
                  <span className="hp-xp__end-emoji" aria-hidden>
                    {current.emoji}
                  </span>
                  <span className="hp-xp__end-text">
                    Lv.{current.level} {current.title}
                  </span>
                </div>
                {!isMax && next ? (
                  <div className="hp-xp__end hp-xp__end--next">
                    <span className="hp-xp__end-emoji" aria-hidden>
                      {next.emoji}
                    </span>
                    <span className="hp-xp__end-text">
                      Lv.{next.level} {next.title}
                    </span>
                  </div>
                ) : (
                  <div className="hp-xp__end hp-xp__end--next">
                    <span className="hp-xp__end-text">{t('points.hellpower.maxLevel')}</span>
                  </div>
                )}
              </div>

              <p className="hp-xp__fraction">
                {isMax ? (
                  <>
                    {balance.toLocaleString(locale)}
                    <span className="hp-xp__fraction-sep"> · </span>
                    {t('points.hellpower.maxLevel')}
                  </>
                ) : (
                  <>
                    {balance.toLocaleString(locale)}
                    <span className="hp-xp__fraction-sep"> / </span>
                    {(current.maxScore ?? 0).toLocaleString(locale)}
                  </>
                )}
              </p>

              <div
                className="hp-xp__track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fillPct)}
                aria-label={t('points.hellpower.xpBarLabel')}
              >
                <div
                  className={`hp-xp__fill${isMax ? ' hp-xp__fill--max' : ''}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>

              {!isMax && current.pointsToNext != null ? (
                <p className="hp-xp__remain">
                  {t('points.hellpower.pointsToNext', {
                    points: current.pointsToNext.toLocaleString(locale),
                  })}
                </p>
              ) : null}
            </section>

            {!isMax && next ? (
              <section className="hp-next" aria-label={t('points.hellpower.nextSection')}>
                <p className="hp-next__eyebrow">{t('points.hellpower.nextSection')}</p>
                <div className="hp-next__body">
                  <p
                    className="hp-next__emoji"
                    aria-label={t('points.hellpower.levelLabel', {
                      level: next.level,
                      title: next.title,
                    })}
                  >
                    {next.emoji}
                  </p>
                  <div className="hp-next__copy">
                    <p className="hp-next__lv">Lv.{next.level}</p>
                    <p className="hp-next__title">{next.title}</p>
                    <p className="hp-next__threshold">
                      {t('points.hellpower.unlockAt', {
                        points: next.minScore.toLocaleString(locale),
                      })}
                    </p>
                  </div>
                </div>
                <p className="hp-next__gap">
                  {t('points.hellpower.currentVsRemain', {
                    current: balance.toLocaleString(locale),
                    remain: (current.pointsToNext ?? 0).toLocaleString(locale),
                  })}
                </p>
              </section>
            ) : (
              <section className="hp-next hp-next--max" aria-label={t('points.hellpower.maxLevel')}>
                <p
                  className="hp-next__emoji"
                  aria-label={t('points.hellpower.levelLabel', {
                    level: current.level,
                    title: current.title,
                  })}
                >
                  {current.emoji}
                </p>
                <p className="hp-next__lv">Lv.{current.level}</p>
                <p className="hp-next__title">{current.title}</p>
                <p className="hp-next__max-badge">{t('points.hellpower.maxLevel')}</p>
                <p className="hp-next__threshold">{formatRange(current, locale)}</p>
              </section>
            )}

            <button
              type="button"
              className="hp-ladder-btn"
              onClick={() => setLadderOpen(true)}
            >
              <span aria-hidden>🏆</span>
              {t('points.hellpower.ladderCta')}
            </button>
          </>
        ) : (
          <header className="hp-hero hp-hero--plain">
            <p className="hp-hero__label">{t('points.balanceLabel')}</p>
            <p className="hp-hero__score">
              <span className="hp-hero__score-value">{balance.toLocaleString(locale)}</span>
              <span className="hp-hero__score-unit">{unit}</span>
            </p>
            <p className="hp-hero__lifetime">
              {t('points.lifetime', { earned: earned.toLocaleString(locale) })}
            </p>
          </header>
        )}

        {todayEarned > 0 ? (
          <div className="hp-today" role="status">
            <span className="hp-today__label">{t('points.hellpower.todayEarned')}</span>
            <strong className="hp-today__value">
              +{todayEarned.toLocaleString(locale)} {t('points.hellpower.scoreLabel')}
            </strong>
          </div>
        ) : null}

        <section className="points-ledger" aria-labelledby="points-ledger-title">
          <div className="points-ledger__head">
            <h2 id="points-ledger-title" className="points-ledger__title">
              {t('points.historyTitle')}
            </h2>
            {hasHistory ? (
              <span className="points-ledger__count">
                {hasQuery ? `${visibleCount}/${items.length}` : items.length}
              </span>
            ) : null}
          </div>

          {hasHistory ? (
            <div className="points-ledger__search">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('points.searchPlaceholder')}
              />
            </div>
          ) : null}

          {!hasHistory ? (
            <div className="points-empty" role="status">
              <p className="points-empty__title">{t('points.empty')}</p>
            </div>
          ) : visibleCount === 0 ? (
            <div className="points-empty" role="status">
              <p className="points-empty__title">{t('points.emptySearch')}</p>
            </div>
          ) : (
            <ul className="points-ledger__list">
              {filteredItems.map((tx) => {
                const positive = tx.points > 0;
                const label = tx.description || tx.actionCode || tx.transactionType;
                return (
                  <li
                    key={tx.id}
                    className={`points-tx${positive ? ' points-tx--in' : ' points-tx--out'}`}
                  >
                    <span className="points-tx__badge" aria-hidden>
                      {ledgerEmoji(tx.actionCode, tx.points)}
                    </span>
                    <div className="points-tx__body">
                      <p className="points-tx__desc">{label}</p>
                      <time className="points-tx__time" dateTime={tx.createdAt}>
                        {formatTxWhen(tx.createdAt, locale)}
                      </time>
                    </div>
                    <span className="points-tx__amount">
                      {positive ? '+' : ''}
                      {tx.points.toLocaleString(locale)}
                      <span className="points-tx__unit">{unit}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <HellpowerLadderSheet
        open={ladderOpen}
        onClose={() => setLadderOpen(false)}
        currentLevel={hellpower?.level ?? null}
      />

      {levelUp ? (
        <div
          className="hp-levelup-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hp-levelup-title"
          onClick={() => setLevelUp(null)}
        >
          <div className="hp-levelup" onClick={(e) => e.stopPropagation()}>
            <p className="hp-levelup__eyebrow" id="hp-levelup-title">
              {t('points.hellpower.levelUpTitle')}
            </p>
            <p className="hp-levelup__path" aria-hidden>
              <span>{levelUp.from.emoji}</span>
              <span className="hp-levelup__arrow">→</span>
              <span>{levelUp.to.emoji}</span>
            </p>
            <p className="hp-levelup__from">
              Lv.{levelUp.from.level} {levelUp.from.title}
            </p>
            <p className="hp-levelup__to">
              Lv.{levelUp.to.level} {levelUp.to.title}
            </p>
            <button type="button" className="btn btn--primary btn--block" onClick={() => setLevelUp(null)}>
              {t('points.hellpower.levelUpConfirm')}
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
