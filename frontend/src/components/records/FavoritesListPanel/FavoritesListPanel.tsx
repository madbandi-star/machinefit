import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/records.css';

export function FavoritesListPanel() {
  const { t } = useTranslation(['common', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: async () => {
      const res = await favoriteApi.list();
      return res.data.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => favoriteApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites }),
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (isLoading) return <Skeleton count={3} height={56} />;
  if (isError) return <QueryErrorMessage />;
  if (!data?.length) {
    return (
      <EmptyState
        icon="heart"
        title={t('machines:favorites.empty')}
        action={
          <Link to={ROUTES.MACHINES} className="btn btn--primary">
            {t('common:emptyState.browseMachines')}
          </Link>
        }
      />
    );
  }

  return (
    <div className="records-list">
      {data.map((item) => {
        const primaryUrl = item.recommendationId
          ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', item.machineCode)}?id=${item.recommendationId}&from=favorites`
          : ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode);

        return (
          <article key={item.id} className="favorite-row">
            <Link to={primaryUrl} className="favorite-row__link">
              <strong className="favorite-row__name">{item.machineName}</strong>
              <span className="favorite-row__code">{item.machineCode}</span>
            </Link>
            <button
              type="button"
              className="favorite-row__remove"
              aria-label={t('machines:favorites.remove')}
              onClick={() => removeMutation.mutate(item.id)}
              disabled={removeMutation.isPending}
            >
              <Icon name="heart" size={18} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
