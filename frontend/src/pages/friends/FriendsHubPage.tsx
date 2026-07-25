import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FRIEND_RANKING_METRICS,
  FRIEND_SORTS,
  PRIVACY_LEVELS,
  type FriendRankingMetric,
  type FriendSort,
  type PrivacyLevel,
  type UpdateFriendPrivacyInput,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { friendsApi } from '@/api/friends.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/friends.css';

type Section =
  | 'list'
  | 'add'
  | 'incoming'
  | 'outgoing'
  | 'blocked'
  | 'privacy'
  | 'feed'
  | 'rankings'
  | 'invite';

function sectionFromPath(pathname: string): Section {
  if (pathname.includes('/friends/incoming')) return 'incoming';
  if (pathname.includes('/friends/outgoing')) return 'outgoing';
  if (pathname.includes('/friends/blocked')) return 'blocked';
  if (pathname.includes('/friends/privacy')) return 'privacy';
  if (pathname.includes('/friends/feed')) return 'feed';
  if (pathname.includes('/friends/rankings')) return 'rankings';
  if (pathname.includes('/friends/invite')) return 'invite';
  if (pathname.includes('/friends/add')) return 'add';
  return 'list';
}

function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img className="friends-row__avatar" src={url} alt="" />;
  return (
    <div className="friends-row__avatar" aria-hidden>
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  );
}

function formatRelative(iso?: string | null, fallback = '—') {
  if (!iso) return fallback;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return fallback;
  const diff = Date.now() - t;
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function FriendsHubPage() {
  const { t } = useTranslation('friends');
  const location = useLocation();
  const navigate = useNavigate();
  const section = sectionFromPath(location.pathname);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [q, setQ] = useState('');
  const debouncedQ = useDebounced(q, 350);
  const [sort, setSort] = useState<FriendSort>('name');
  const [metric, setMetric] = useState<FriendRankingMetric>('weekly_workouts');
  const [inviteCode, setInviteCode] = useState('');
  const [pageByKey, setPageByKey] = useState<Record<string, number>>({});
  const touchStartY = useRef<number | null>(null);
  const filterKey = `${section}:${debouncedQ}:${sort}:${metric}`;
  const page = pageByKey[filterKey] ?? 1;
  const setPage = (next: number | ((n: number) => number)) => {
    setPageByKey((prev) => {
      const cur = prev[filterKey] ?? 1;
      const value = typeof next === 'function' ? next(cur) : next;
      return { ...prev, [filterKey]: value };
    });
  };

  const invalidateFriends = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends });
  };

  const pageLimit = page * 20;

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.friendsList({ q: debouncedQ, sort, page }),
    queryFn: async () =>
      (
        await friendsApi.list({
          q: debouncedQ || undefined,
          sort,
          page: 1,
          limit: pageLimit,
        })
      ).data.data,
    enabled: section === 'list',
    refetchInterval: 30_000,
  });

  const searchQuery = useQuery({
    queryKey: QUERY_KEYS.friendsSearch(debouncedQ, page),
    queryFn: async () =>
      (await friendsApi.search({ q: debouncedQ, page: 1, limit: pageLimit })).data.data,
    enabled: section === 'add' && debouncedQ.trim().length > 0,
  });

  const incomingQuery = useQuery({
    queryKey: QUERY_KEYS.friendsIncoming(page),
    queryFn: async () => (await friendsApi.incoming({ page: 1, limit: pageLimit })).data.data,
    enabled: section === 'incoming',
    refetchInterval: 15_000,
  });

  const outgoingQuery = useQuery({
    queryKey: QUERY_KEYS.friendsOutgoing(page),
    queryFn: async () => (await friendsApi.outgoing({ page: 1, limit: pageLimit })).data.data,
    enabled: section === 'outgoing',
    refetchInterval: 20_000,
  });

  const blockedQuery = useQuery({
    queryKey: QUERY_KEYS.friendsBlocked(page),
    queryFn: async () => (await friendsApi.listBlocked({ page: 1, limit: pageLimit })).data.data,
    enabled: section === 'blocked',
  });

  const privacyQuery = useQuery({
    queryKey: QUERY_KEYS.friendsPrivacy,
    queryFn: async () => (await friendsApi.getPrivacy()).data.data,
    enabled: section === 'privacy',
  });

  const feedQuery = useQuery({
    queryKey: QUERY_KEYS.friendsFeed(page),
    queryFn: async () => (await friendsApi.feed({ page: 1, limit: pageLimit })).data.data,
    enabled: section === 'feed',
    refetchInterval: 20_000,
  });

  const rankingsQuery = useQuery({
    queryKey: QUERY_KEYS.friendsRankings(metric, page),
    queryFn: async () =>
      (await friendsApi.rankings({ metric, page: 1, limit: pageLimit })).data.data,
    enabled: section === 'rankings',
  });

  const inviteQuery = useQuery({
    queryKey: QUERY_KEYS.friendsInvite,
    queryFn: async () => (await friendsApi.invite()).data.data,
    enabled: section === 'invite',
  });

  const onError = (err: unknown) => showToast(getApiErrorMessage(err, t('toast.requestSent')), 'error');

  const sendMut = useMutation({
    mutationFn: (toUserId: string) => friendsApi.sendRequest({ toUserId }),
    onSuccess: () => {
      showToast(t('toast.requestSent'), 'success');
      invalidateFriends();
    },
    onError,
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => friendsApi.accept(id),
    onSuccess: () => {
      showToast(t('toast.accepted'), 'success');
      invalidateFriends();
    },
    onError,
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => friendsApi.reject(id),
    onSuccess: () => {
      showToast(t('toast.rejected'), 'success');
      invalidateFriends();
    },
    onError,
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => friendsApi.cancelRequest(id),
    onSuccess: () => {
      showToast(t('toast.cancelled'), 'success');
      invalidateFriends();
    },
    onError,
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => friendsApi.remove(id),
    onSuccess: () => {
      showToast(t('toast.removed'), 'success');
      invalidateFriends();
    },
    onError,
  });

  const pinMut = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      friendsApi.setPin(id, pinned),
    onSuccess: () => invalidateFriends(),
    onError,
  });

  const blockMut = useMutation({
    mutationFn: (id: string) => friendsApi.block(id),
    onSuccess: () => {
      showToast(t('toast.blocked'), 'success');
      invalidateFriends();
    },
    onError,
  });

  const unblockMut = useMutation({
    mutationFn: (id: string) => friendsApi.unblock(id),
    onSuccess: () => {
      showToast(t('toast.unblocked'), 'success');
      invalidateFriends();
    },
    onError,
  });

  const privacyMut = useMutation({
    mutationFn: (body: UpdateFriendPrivacyInput) => friendsApi.updatePrivacy(body),
    onSuccess: () => {
      showToast(t('toast.privacySaved'), 'success');
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendsPrivacy });
    },
    onError,
  });

  const applyInviteMut = useMutation({
    mutationFn: (code: string) => friendsApi.applyInvite(code),
    onSuccess: () => {
      showToast(t('toast.inviteApplied'), 'success');
      setInviteCode('');
    },
    onError,
  });

  const nav = useMemo(
    () =>
      [
        { to: ROUTES.FRIENDS, key: 'list' as const },
        { to: ROUTES.FRIENDS_ADD, key: 'add' as const },
        { to: ROUTES.FRIENDS_INCOMING, key: 'incoming' as const },
        { to: ROUTES.FRIENDS_OUTGOING, key: 'outgoing' as const },
        { to: ROUTES.FRIENDS_BLOCKED, key: 'blocked' as const },
        { to: ROUTES.FRIENDS_PRIVACY, key: 'privacy' as const },
        { to: ROUTES.FRIENDS_FEED, key: 'feed' as const },
        { to: ROUTES.FRIENDS_RANKINGS, key: 'rankings' as const },
        { to: ROUTES.FRIENDS_INVITE, key: 'invite' as const },
      ] as const,
    []
  );

  const refreshCurrent = () => {
    if (section === 'list') void listQuery.refetch();
    if (section === 'add') void searchQuery.refetch();
    if (section === 'incoming') void incomingQuery.refetch();
    if (section === 'outgoing') void outgoingQuery.refetch();
    if (section === 'blocked') void blockedQuery.refetch();
    if (section === 'feed') void feedQuery.refetch();
    if (section === 'rankings') void rankingsQuery.refetch();
  };

  const onTouchStart = (e: TouchEvent) => {
    if (window.scrollY <= 0) touchStartY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientY ?? start;
    if (end - start > 70) refreshCurrent();
  };

  const loadMore = (total: number) => {
    if (page * 20 < total) setPage((p) => p + 1);
  };

  return (
    <div
      className="friends-page"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <PageShell title={t('title')}>
        <nav className="friends-subnav" aria-label={t('title')}>
          {nav.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.key === 'list'}
              className={({ isActive }) =>
                `friends-subnav__link${isActive ? ' is-active' : ''}`
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="btn btn--secondary btn--sm friends-refresh"
          onClick={refreshCurrent}
        >
          {t('refresh')}
        </button>

        {section === 'list' && (
          <>
            <div className="friends-toolbar">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as FriendSort)}
                aria-label={t('sortLabel')}
              >
                {FRIEND_SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`sort.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            {listQuery.isLoading ? (
              <Skeleton count={5} height={64} />
            ) : !listQuery.data?.items.length ? (
              <EmptyState title={t('empty.friends')} hint={t('empty.friendsHint')} />
            ) : (
              <ul className="friends-list">
                {listQuery.data.items.map((f) => (
                  <li key={f.friendshipId}>
                    <div className="friends-row">
                      <Link
                        to={ROUTES.FRIEND_PROFILE.replace(':userId', f.id)}
                        className="friends-row"
                        style={{ flex: 1, border: 0, padding: 0 }}
                      >
                        <Avatar name={f.displayName} url={f.avatarUrl} />
                        <div className="friends-row__meta">
                          <div className="friends-row__name">
                            {f.pinned ? <span className="friends-pin">★</span> : null}
                            {f.displayName}
                            {f.isOnline ? <span className="friends-dot" title="online" /> : null}
                          </div>
                          <div className="friends-row__sub">
                            {t('lastActive', { time: formatRelative(f.lastActiveAt) })}
                          </div>
                        </div>
                      </Link>
                      <div className="friends-row__actions">
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => pinMut.mutate({ id: f.id, pinned: !f.pinned })}
                        >
                          {f.pinned ? t('unpin') : t('pin')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => {
                            if (window.confirm(t('confirmRemove'))) removeMut.mutate(f.id);
                          }}
                        >
                          {t('remove')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => {
                            if (window.confirm(t('confirmBlock'))) blockMut.mutate(f.id);
                          }}
                        >
                          {t('block')}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {listQuery.data && page * 20 < listQuery.data.total ? (
              <button
                type="button"
                className="btn btn--secondary btn--block friends-load-more"
                onClick={() => loadMore(listQuery.data!.total)}
              >
                {t('loadMore')}
              </button>
            ) : null}
          </>
        )}

        {section === 'add' && (
          <>
            <div className="friends-toolbar">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('searchUsersPlaceholder')}
                aria-label={t('searchUsersPlaceholder')}
                autoFocus
              />
            </div>
            {!debouncedQ.trim() ? (
              <EmptyState title={t('empty.search')} hint={t('empty.searchHint')} />
            ) : searchQuery.isLoading ? (
              <Skeleton count={4} height={64} />
            ) : !searchQuery.data?.items.length ? (
              <EmptyState title={t('empty.noUsers')} />
            ) : (
              <ul className="friends-list">
                {searchQuery.data.items.map((u) => (
                  <li key={u.id} className="friends-row">
                    <Avatar name={u.displayName} url={u.avatarUrl} />
                    <div className="friends-row__meta">
                      <div className="friends-row__name">{u.displayName}</div>
                      <div className="friends-row__sub">{u.experienceLevel || '—'}</div>
                    </div>
                    <div className="friends-row__actions">
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => sendMut.mutate(u.id)}
                        disabled={sendMut.isPending}
                      >
                        {t('sendRequest')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() =>
                          navigate(ROUTES.FRIEND_PROFILE.replace(':userId', u.id))
                        }
                      >
                        {t('viewProfile')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {section === 'incoming' && (
          <>
            {incomingQuery.isLoading ? (
              <Skeleton count={4} height={72} />
            ) : !incomingQuery.data?.items.length ? (
              <EmptyState title={t('empty.incoming')} />
            ) : (
              <ul className="friends-list">
                {incomingQuery.data.items.map((r) => (
                  <li key={r.id} className="friends-row">
                    <Avatar name={r.fromUser.displayName} url={r.fromUser.avatarUrl} />
                    <div className="friends-row__meta">
                      <div className="friends-row__name">{r.fromUser.displayName}</div>
                      <div className="friends-row__sub">{r.message || t('noMessage')}</div>
                    </div>
                    <div className="friends-row__actions">
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => acceptMut.mutate(r.id)}
                      >
                        {t('accept')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => rejectMut.mutate(r.id)}
                      >
                        {t('reject')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {section === 'outgoing' && (
          <>
            {outgoingQuery.isLoading ? (
              <Skeleton count={4} height={72} />
            ) : !outgoingQuery.data?.items.length ? (
              <EmptyState title={t('empty.outgoing')} />
            ) : (
              <ul className="friends-list">
                {outgoingQuery.data.items.map((r) => (
                  <li key={r.id} className="friends-row">
                    <Avatar name={r.toUser.displayName} url={r.toUser.avatarUrl} />
                    <div className="friends-row__meta">
                      <div className="friends-row__name">{r.toUser.displayName}</div>
                      <div className="friends-row__sub">{formatRelative(r.createdAt)}</div>
                    </div>
                    <div className="friends-row__actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => cancelMut.mutate(r.id)}
                      >
                        {t('cancelRequest')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {section === 'blocked' && (
          <>
            {blockedQuery.isLoading ? (
              <Skeleton count={4} height={64} />
            ) : !blockedQuery.data?.items.length ? (
              <EmptyState title={t('empty.blocked')} />
            ) : (
              <ul className="friends-list">
                {blockedQuery.data.items.map((b) => (
                  <li key={b.id} className="friends-row">
                    <Avatar name={b.user.displayName} url={b.user.avatarUrl} />
                    <div className="friends-row__meta">
                      <div className="friends-row__name">{b.user.displayName}</div>
                      <div className="friends-row__sub">{b.reason || '—'}</div>
                    </div>
                    <div className="friends-row__actions">
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => unblockMut.mutate(b.user.id)}
                      >
                        {t('unblock')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {section === 'privacy' && (
          <>
            {privacyQuery.isLoading || !privacyQuery.data ? (
              <Skeleton count={6} height={56} />
            ) : (
              <form
                className="friends-privacy-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const level = (key: string) =>
                    String(fd.get(key) || 'friends') as PrivacyLevel;
                  privacyMut.mutate({
                    profileVisibility: level('profileVisibility'),
                    workoutRecordsVisibility: level('workoutRecordsVisibility'),
                    workoutReportVisibility: level('workoutReportVisibility'),
                    growthVisibility: level('growthVisibility'),
                    badgesVisibility: level('badgesVisibility'),
                    achievementsVisibility: level('achievementsVisibility'),
                    gymVisibility: level('gymVisibility'),
                    onlineStatusVisibility: level('onlineStatusVisibility'),
                    bio: String(fd.get('bio') || ''),
                    careerText: String(fd.get('careerText') || ''),
                    favoriteMuscleGroup: String(fd.get('favoriteMuscleGroup') || '') || null,
                    favoriteMachineCode: String(fd.get('favoriteMachineCode') || '') || null,
                  });
                }}
              >
                {(
                  [
                    'profileVisibility',
                    'workoutRecordsVisibility',
                    'workoutReportVisibility',
                    'growthVisibility',
                    'badgesVisibility',
                    'achievementsVisibility',
                    'gymVisibility',
                    'onlineStatusVisibility',
                  ] as const
                ).map((key) => (
                  <div className="friends-privacy-field" key={key}>
                    <label htmlFor={key}>{t(`privacy.${key}`)}</label>
                    <select
                      id={key}
                      name={key}
                      defaultValue={privacyQuery.data[key]}
                    >
                      {PRIVACY_LEVELS.map((lv) => (
                        <option key={lv} value={lv}>
                          {t(`privacyLevel.${lv}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="friends-privacy-field">
                  <label htmlFor="bio">{t('privacy.bio')}</label>
                  <textarea id="bio" name="bio" rows={3} defaultValue={privacyQuery.data.bio} />
                </div>
                <div className="friends-privacy-field">
                  <label htmlFor="careerText">{t('privacy.careerText')}</label>
                  <textarea
                    id="careerText"
                    name="careerText"
                    rows={3}
                    defaultValue={privacyQuery.data.careerText}
                  />
                </div>
                <div className="friends-privacy-field">
                  <label htmlFor="favoriteMuscleGroup">{t('privacy.favoriteMuscleGroup')}</label>
                  <input
                    id="favoriteMuscleGroup"
                    name="favoriteMuscleGroup"
                    defaultValue={privacyQuery.data.favoriteMuscleGroup ?? ''}
                  />
                </div>
                <div className="friends-privacy-field">
                  <label htmlFor="favoriteMachineCode">{t('privacy.favoriteMachineCode')}</label>
                  <input
                    id="favoriteMachineCode"
                    name="favoriteMachineCode"
                    defaultValue={privacyQuery.data.favoriteMachineCode ?? ''}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--primary btn--block"
                  disabled={privacyMut.isPending}
                >
                  {t('savePrivacy')}
                </button>
              </form>
            )}
          </>
        )}

        {section === 'feed' && (
          <>
            {feedQuery.isLoading ? (
              <Skeleton count={5} height={72} />
            ) : !feedQuery.data?.items.length ? (
              <EmptyState title={t('empty.feed')} hint={t('empty.feedHint')} />
            ) : (
              <div>
                {feedQuery.data.items.map((item) => (
                  <article key={item.id} className="friends-feed-item">
                    <div className="friends-feed-item__title">
                      {item.actor.displayName} · {t(`activity.${item.activityType}`, {
                        defaultValue: item.title,
                      })}
                    </div>
                    <div className="friends-feed-item__body">
                      {item.body || formatRelative(item.createdAt)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {section === 'rankings' && (
          <>
            <div className="friends-toolbar">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as FriendRankingMetric)}
              >
                {FRIEND_RANKING_METRICS.map((m) => (
                  <option key={m} value={m}>
                    {t(`metric.${m}`)}
                  </option>
                ))}
              </select>
            </div>
            {rankingsQuery.isLoading ? (
              <Skeleton count={6} height={52} />
            ) : !rankingsQuery.data?.items.length ? (
              <EmptyState title={t('empty.rankings')} />
            ) : (
              <div>
                {rankingsQuery.data.items.map((row) => (
                  <div key={row.user.id} className="friends-rank-row">
                    <div className="friends-rank-row__n">{row.rank}</div>
                    <Avatar name={row.user.displayName} url={row.user.avatarUrl} />
                    <div className="friends-row__meta">
                      <div className="friends-row__name">{row.user.displayName}</div>
                    </div>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {section === 'invite' && (
          <>
            {inviteQuery.isLoading || !inviteQuery.data ? (
              <Skeleton count={3} height={56} />
            ) : (
              <div className="friends-privacy-grid">
                <div className="friends-privacy-field">
                  <label>{t('invite.code')}</label>
                  <input readOnly value={inviteQuery.data.code} />
                </div>
                <div className="friends-privacy-field">
                  <label>{t('invite.link')}</label>
                  <input readOnly value={inviteQuery.data.shareUrl} />
                </div>
                <p className="friends-row__sub">
                  {t('invite.count', { count: inviteQuery.data.inviteCount })}
                </p>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={async () => {
                    const text = `${t('invite.shareText')}\n${inviteQuery.data!.shareUrl}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: 'MachineFit', text, url: inviteQuery.data!.shareUrl });
                      } else {
                        await navigator.clipboard.writeText(text);
                        showToast(t('toast.copied'), 'success');
                      }
                    } catch {
                      /* user cancelled */
                    }
                  }}
                >
                  {t('invite.share')}
                </button>
                <div className="friends-privacy-field">
                  <label htmlFor="applyCode">{t('invite.apply')}</label>
                  <div className="friends-toolbar__row">
                    <input
                      id="applyCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder={t('invite.applyPlaceholder')}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => applyInviteMut.mutate(inviteCode.trim())}
                      disabled={!inviteCode.trim() || applyInviteMut.isPending}
                    >
                      {t('invite.applyBtn')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </PageShell>
    </div>
  );
}
