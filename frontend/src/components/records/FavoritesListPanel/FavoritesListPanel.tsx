import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';

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

  if (isLoading) return <Skeleton count={3} height={80} />;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {data.map((item) => (
        <div key={item.id} className="card record-card record-card__row">
          <Link
            to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
            className="record-card__header"
            style={{ flex: 1, minWidth: 0 }}
          >
            <strong className="record-card__title">{item.machineName}</strong>
            <span className="record-card__meta">{item.machineCode}</span>
          </Link>
          <button
            type="button"
            className="btn btn--secondary"
            style={{ flexShrink: 0 }}
            onClick={() => removeMutation.mutate(item.id)}
            disabled={removeMutation.isPending}
          >
            {t('machines:favorites.remove')}
          </button>
        </div>
      ))}
    </div>
  );
}
