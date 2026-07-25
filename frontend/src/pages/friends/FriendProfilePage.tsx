import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { friendsApi } from '@/api/friends.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/friends.css';

type ReportReason = 'spam' | 'abuse' | 'fake' | 'other';

export function FriendProfilePage() {
  const { userId = '' } = useParams();
  const { t } = useTranslation('friends');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDesc, setReportDesc] = useState('');

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.friendProfile(userId),
    queryFn: async () => (await friendsApi.profile(userId)).data.data,
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendProfile(userId) });
  };

  const sendMut = useMutation({
    mutationFn: () => friendsApi.sendRequest({ toUserId: userId }),
    onSuccess: () => {
      showToast(t('toast.requestSent'), 'success');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('toast.requestSent')), 'error'),
  });

  const acceptMut = useMutation({
    mutationFn: (requestId: string) => friendsApi.accept(requestId),
    onSuccess: () => {
      showToast(t('toast.accepted'), 'success');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('toast.accepted')), 'error'),
  });

  const rejectMut = useMutation({
    mutationFn: (requestId: string) => friendsApi.reject(requestId),
    onSuccess: () => {
      showToast(t('toast.rejected'), 'success');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('toast.rejected')), 'error'),
  });

  const cancelMut = useMutation({
    mutationFn: (requestId: string) => friendsApi.cancelRequest(requestId),
    onSuccess: () => {
      showToast(t('toast.cancelled'), 'success');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('toast.cancelled')), 'error'),
  });

  const removeMut = useMutation({
    mutationFn: () => friendsApi.remove(userId),
    onSuccess: () => {
      showToast(t('toast.removed'), 'success');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('toast.removed')), 'error'),
  });

  const blockMut = useMutation({
    mutationFn: () => friendsApi.block(userId),
    onSuccess: () => {
      showToast(t('toast.blocked'), 'success');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('toast.blocked')), 'error'),
  });

  const reportMut = useMutation({
    mutationFn: () =>
      friendsApi.report({
        reportedUserId: userId,
        reason: reportReason,
        description: reportDesc.trim() || null,
      }),
    onSuccess: () => {
      showToast(t('toast.reported'), 'success');
      setReportOpen(false);
      setReportDesc('');
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('toast.reported')), 'error'),
  });

  if (profileQuery.isLoading) {
    return (
      <PageShell>
        <div className="friend-profile">
          <Skeleton count={5} height={72} />
        </div>
      </PageShell>
    );
  }

  const p = profileQuery.data;
  if (!p) {
    return (
      <PageShell>
        <div className="friend-profile">
          <EmptyState title={t('empty.profile')} />
        </div>
      </PageShell>
    );
  }

  const growth = p.growthStats;

  return (
    <div className="friend-profile">
      <PageShell>
        <header className="friend-profile-hero">
          <div className="friend-profile-top">
            <div className="friend-profile-identity">
              {p.user.avatarUrl ? (
                <img className="friend-profile-avatar" src={p.user.avatarUrl} alt="" />
              ) : (
                <div className="friend-profile-avatar friend-profile-avatar-fallback" aria-hidden>
                  {(p.user.displayName || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h1>
                  {p.user.displayName}
                  {p.user.isOnline ? <span className="friends-dot" title="online" /> : null}
                </h1>
                <p>{t(`relationship.${p.relationship}`)}</p>
              </div>
            </div>
          </div>

          <div className="friend-profile-meta">
            {p.experienceLevel ? <span>{t('profile.level')}: {p.experienceLevel}</span> : null}
            {p.gymName ? <span>{t('profile.gym')}: {p.gymName}</span> : null}
            {p.favoriteMuscleGroup ? (
              <span>{t('profile.muscle')}: {p.favoriteMuscleGroup}</span>
            ) : null}
            {p.favoriteMachineCode ? (
              <span>{t('profile.machine')}: {p.favoriteMachineCode}</span>
            ) : null}
          </div>

          <div className="friend-profile-actions">
            {p.relationship === 'none' ? (
              <button
                type="button"
                className="friends-btn friends-btn-primary"
                disabled={sendMut.isPending}
                onClick={() => sendMut.mutate()}
              >
                {t('sendRequest')}
              </button>
            ) : null}
            {p.relationship === 'outgoing' && p.pendingRequestId ? (
              <button
                type="button"
                className="friends-btn"
                disabled={cancelMut.isPending}
                onClick={() => cancelMut.mutate(p.pendingRequestId!)}
              >
                {t('cancelRequest')}
              </button>
            ) : null}
            {p.relationship === 'outgoing' && !p.pendingRequestId ? (
              <button type="button" className="friends-btn" disabled>
                {t('requestPending')}
              </button>
            ) : null}
            {p.relationship === 'incoming' && p.pendingRequestId ? (
              <>
                <button
                  type="button"
                  className="friends-btn friends-btn-primary"
                  disabled={acceptMut.isPending}
                  onClick={() => acceptMut.mutate(p.pendingRequestId!)}
                >
                  {t('accept')}
                </button>
                <button
                  type="button"
                  className="friends-btn"
                  disabled={rejectMut.isPending}
                  onClick={() => rejectMut.mutate(p.pendingRequestId!)}
                >
                  {t('reject')}
                </button>
              </>
            ) : null}
            {p.relationship === 'friend' ? (
              <button
                type="button"
                className="friends-btn"
                onClick={() => {
                  if (window.confirm(t('confirmRemove'))) removeMut.mutate();
                }}
              >
                {t('remove')}
              </button>
            ) : null}
            {p.relationship !== 'self' && p.relationship !== 'blocked' ? (
              <button
                type="button"
                className="friends-btn friends-btn-danger"
                onClick={() => {
                  if (window.confirm(t('confirmBlock'))) blockMut.mutate();
                }}
              >
                {t('block')}
              </button>
            ) : null}
            {p.relationship !== 'self' ? (
              <button
                type="button"
                className="friends-btn friends-btn-ghost"
                onClick={() => setReportOpen((v) => !v)}
              >
                {t('report')}
              </button>
            ) : null}
          </div>
        </header>

        {reportOpen ? (
          <section className="friend-profile-section">
            <h2>{t('report')}</h2>
            <div className="friends-privacy-field">
              <label htmlFor="reportReason">{t('reportReason')}</label>
              <select
                id="reportReason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ReportReason)}
              >
                <option value="spam">{t('reportReasons.spam')}</option>
                <option value="abuse">{t('reportReasons.abuse')}</option>
                <option value="fake">{t('reportReasons.fake')}</option>
                <option value="other">{t('reportReasons.other')}</option>
              </select>
            </div>
            <div className="friends-privacy-field">
              <label htmlFor="reportDesc">{t('reportDescription')}</label>
              <textarea
                id="reportDesc"
                rows={3}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder={t('reportDescriptionPlaceholder')}
              />
            </div>
            <div className="friend-profile-actions">
              <button
                type="button"
                className="friends-btn friends-btn-primary"
                disabled={reportMut.isPending}
                onClick={() => reportMut.mutate()}
              >
                {t('reportSubmit')}
              </button>
              <button
                type="button"
                className="friends-btn friends-btn-ghost"
                onClick={() => setReportOpen(false)}
              >
                {t('reportCancel')}
              </button>
            </div>
          </section>
        ) : null}

        {(p.bio || p.careerText) && (
          <section className="friend-profile-section">
            <h2>{t('profile.about')}</h2>
            {p.bio ? <p>{p.bio}</p> : null}
            {p.careerText ? <p className="friend-profile-muted">{p.careerText}</p> : null}
          </section>
        )}

        {growth ? (
          <section className="friend-profile-section">
            <h2>{t('profile.growth')}</h2>
            <div className="friend-profile-stats">
              {'sessionDays' in growth ? (
                <div className="friend-stat">
                  <strong>{String(growth.sessionDays ?? 0)}</strong>
                  <span>{t('profile.growthSessionDays')}</span>
                </div>
              ) : null}
              {'currentStreak' in growth ? (
                <div className="friend-stat">
                  <strong>{String(growth.currentStreak ?? 0)}</strong>
                  <span>{t('profile.growthStreak')}</span>
                </div>
              ) : null}
              {'workoutCount' in growth ? (
                <div className="friend-stat">
                  <strong>{String(growth.workoutCount ?? 0)}</strong>
                  <span>{t('profile.growthWorkouts')}</span>
                </div>
              ) : null}
              {'totalVolumeKg' in growth ? (
                <div className="friend-stat">
                  <strong>{String(growth.totalVolumeKg ?? 0)}</strong>
                  <span>{t('profile.growthVolume')} kg</span>
                </div>
              ) : null}
              {'level' in growth ? (
                <div className="friend-stat">
                  <strong>{String(growth.level ?? 1)}</strong>
                  <span>{t('profile.growthLevel')}</span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {p.badges?.length ? (
          <section className="friend-profile-section">
            <h2>{t('profile.badges')}</h2>
            <div className="friends-chips">
              {p.badges.map((b) => (
                <span key={b.code} className="friends-chip">
                  {b.title || b.code}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {p.achievements?.length ? (
          <section className="friend-profile-section">
            <h2>{t('profile.achievements')}</h2>
            <div className="friends-chips">
              {p.achievements.map((a) => (
                <span key={a.code} className="friends-chip">
                  {a.title || a.code}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {p.recentWorkouts?.length ? (
          <section className="friend-profile-section">
            <h2>{t('profile.recentWorkouts')}</h2>
            <ul className="friend-session-list">
              {p.recentWorkouts.map((w, idx) => (
                <li key={`${w.date}-${idx}`} className="friend-session-item">
                  <strong>{w.date}</strong>
                  {w.machineCode ? <span>{w.machineCode}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageShell>
    </div>
  );
}
