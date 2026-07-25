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

export function FriendProfilePage() {
  const { userId = '' } = useParams();
  const { t } = useTranslation('friends');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

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
          {p.relationship === 'none' || p.relationship === 'outgoing' ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={p.relationship === 'outgoing' || sendMut.isPending}
              onClick={() => sendMut.mutate()}
            >
              {p.relationship === 'outgoing' ? t('requestPending') : t('sendRequest')}
            </button>
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
        </div>

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

        {p.growthStats ? (
          <section className="friends-profile-section">
            <h3>{t('profile.growth')}</h3>
            <p className="friends-row__sub">{t('profile.growthVisible')}</p>
          </section>
        ) : null}
      </PageShell>
    </div>
  );
}
