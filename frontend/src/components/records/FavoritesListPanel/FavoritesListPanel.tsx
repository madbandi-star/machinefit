import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';

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
    return <p style={{ color: 'var(--color-text-muted)' }}>{t('machines:favorites.empty')}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {data.map((item) => (
        <div
          key={item.id}
          className="card"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}
        >
          <Link
            to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
            style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}
          >
            <strong>{item.machineName}</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.machineCode}</p>
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
