import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { memberProfileRequestApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

export function MemberProfileRequests() {
  const { t } = useTranslation(['gyms', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberProfileRequests,
    queryFn: async () => {
      const res = await memberProfileRequestApi.list();
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'denied' }) =>
      memberProfileRequestApi.respond(id, status),
    onSuccess: (_res, { status }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberProfileRequests });
      showToast(
        status === 'approved'
          ? t('gyms:members.requestApproved')
          : t('gyms:members.requestDenied'),
        'success'
      );
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (!isAuthenticated || isLoading || pendingRequests.length === 0) return null;

  return (
    <section className="my-page-section member-profile-requests">
      <h3 className="my-page-section__title">{t('gyms:members.profileRequests')}</h3>
      <ul className="member-profile-requests__list">
        {pendingRequests.map((req) => (
          <li key={req.id} className="card member-profile-requests__card">
            <p className="member-profile-requests__message">
              {req.gymName?.trim()
                ? t('gyms:members.requestFrom', { gymName: req.gymName.trim() })
                : t('gyms:members.requestFromUnnamed')}
            </p>
            <div className="member-profile-requests__actions">
              <button
                type="button"
                className="btn btn--primary member-profile-requests__btn"
                disabled={respondMutation.isPending}
                onClick={() => respondMutation.mutate({ id: req.id, status: 'approved' })}
              >
                {t('gyms:members.requestApprove')}
              </button>
              <button
                type="button"
                className="btn btn--secondary member-profile-requests__btn"
                disabled={respondMutation.isPending}
                onClick={() => respondMutation.mutate({ id: req.id, status: 'denied' })}
              >
                {t('gyms:members.requestDeny')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
