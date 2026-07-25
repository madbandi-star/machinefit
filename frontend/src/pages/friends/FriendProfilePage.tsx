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
        <Skeleton count={5} height={72} />
      </PageShell>
    );
  }

  const p = profileQuery.data;
  if (!p) {
    return (
      <PageShell>
        <EmptyState title={t('empty.profile')} />
      </PageShell>
    );
  }

  const growth = p.growthStats;

  return (
    <div className="friends-page">
      <PageShell>
        <div className="friends-profile-hero">
          {p.user.avatarUrl ? (
            <img className="friends-profile-hero__avatar" src={p.user.avatarUrl} alt="" />
          ) : (
            <div className="friends-profile-hero__avatar" aria-hidden>
              {(p.user.displayName || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <h2 style={{ margin: 0 }}>
            {p.user.displayName}
            {p.user.isOnline ? <span className="friends-dot" style={{ marginLeft: 8 }} /> : null}
          </h2>
          <p className="friends-row__sub">{t(`relationship.${p.relationship}`)}</p>
        </div>

        <div className="friends-row__actions" style={{ justifyContent: 'center' }}>
          {p.relationship === 'none' ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={sendMut.isPending}
              onClick={() => sendMut.mutate()}
            >
              {t('sendRequest')}
            </button>
          ) : null}
          {p.relationship === 'outgoing' && p.pendingRequestId ? (
            <button
              type="button"
              className="btn btn--secondary"
              disabled={cancelMut.isPending}
              onClick={() => cancelMut.mutate(p.pendingRequestId!)}
            >
              {t('cancelRequest')}
            </button>
          ) : null}
          {p.relationship === 'outgoing' && !p.pendingRequestId ? (
            <button type="button" className="btn btn--secondary" disabled>
              {t('requestPending')}
            </button>
          ) : null}
          {p.relationship === 'incoming' && p.pendingRequestId ? (
            <>
              <button
                type="button"
                className="btn btn--primary"
                disabled={acceptMut.isPending}
                onClick={() => acceptMut.mutate(p.pendingRequestId!)}
              >
                {t('accept')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
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
              className="btn btn--secondary"
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
              className="btn btn--secondary"
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
              className="btn btn--secondary"
              onClick={() => setReportOpen((v) => !v)}
            >
              {t('report')}
            </button>
          ) : null}
        </div>

        {reportOpen ? (
          <section className="friends-profile-section">
            <h3>{t('report')}</h3>
            <label className="friends-row__sub" htmlFor="reportReason">
              {t('reportReason')}
            </label>
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
            <label className="friends-row__sub" htmlFor="reportDesc">
              {t('reportDescription')}
            </label>
            <textarea
              id="reportDesc"
              rows={3}
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder={t('reportDescriptionPlaceholder')}
            />
            <div className="friends-row__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={reportMut.isPending}
                onClick={() => reportMut.mutate()}
              >
                {t('reportSubmit')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setReportOpen(false)}>
                {t('reportCancel')}
              </button>
            </div>
          </section>
        ) : null}

        {(p.bio || p.careerText || p.experienceLevel) && (
          <section className="friends-profile-section">
            <h3>{t('profile.about')}</h3>
            {p.bio ? <p>{p.bio}</p> : null}
            {p.careerText ? <p className="friends-row__sub">{p.careerText}</p> : null}
            {p.experienceLevel ? (
              <p className="friends-row__sub">
                {t('profile.level')}: {p.experienceLevel}
              </p>
            ) : null}
            {p.favoriteMuscleGroup ? (
              <p className="friends-row__sub">
                {t('profile.muscle')}: {p.favoriteMuscleGroup}
              </p>
            ) : null}
            {p.favoriteMachineCode ? (
              <p className="friends-row__sub">
                {t('profile.machine')}: {p.favoriteMachineCode}
              </p>
            ) : null}
            {p.gymName ? (
              <p className="friends-row__sub">
                {t('profile.gym')}: {p.gymName}
              </p>
            ) : null}
          </section>
        )}

        {p.badges?.length ? (
          <section className="friends-profile-section">
            <h3>{t('profile.badges')}</h3>
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
          <section className="friends-profile-section">
            <h3>{t('profile.achievements')}</h3>
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
          <section className="friends-profile-section">
            <h3>{t('profile.recentWorkouts')}</h3>
            <ul className="friends-list">
              {p.recentWorkouts.map((w, idx) => (
                <li key={`${w.date}-${idx}`} className="friends-row__sub">
                  {w.date} {w.machineCode ? `· ${w.machineCode}` : ''}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {growth ? (
          <section className="friends-profile-section">
            <h3>{t('profile.growth')}</h3>
            <ul className="friends-list">
              {'sessionDays' in growth ? (
                <li className="friends-row__sub">
                  {t('profile.growthSessionDays')}: {String(growth.sessionDays ?? 0)}
                </li>
              ) : null}
              {'currentStreak' in growth ? (
                <li className="friends-row__sub">
                  {t('profile.growthStreak')}: {String(growth.currentStreak ?? 0)}
                </li>
              ) : null}
              {'workoutCount' in growth ? (
                <li className="friends-row__sub">
                  {t('profile.growthWorkouts')}: {String(growth.workoutCount ?? 0)}
                </li>
              ) : null}
              {'totalVolumeKg' in growth ? (
                <li className="friends-row__sub">
                  {t('profile.growthVolume')}: {String(growth.totalVolumeKg ?? 0)} kg
                </li>
              ) : null}
              {'level' in growth ? (
                <li className="friends-row__sub">
                  {t('profile.growthLevel')}: {String(growth.level ?? 1)}
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}
      </PageShell>
    </div>
  );
}
