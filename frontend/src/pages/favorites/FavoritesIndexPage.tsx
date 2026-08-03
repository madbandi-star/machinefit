import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { FavoritesListPanel } from '@/components/records/FavoritesListPanel/FavoritesListPanel';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import '@/styles/records.css';

/** /favorites — full favorites list (same panel formerly under Records tabs). */
export function FavoritesIndexPage() {
  const { t } = useTranslation('common');
  const { activeGymId } = useActiveGym();
  const { memberScopeReady } = useActiveMember();
  const { data, isLoading, isError } = useFavoritesList();

  if (!activeGymId || !memberScopeReady || isLoading) {
    return (
      <div className="favorites-index">
        <PageShell title={t('nav.favorites')}>
          <Skeleton count={2} height={88} />
        </PageShell>
      </div>
    );
  }

  if (isError) {
    return <Navigate to={ROUTES.FAVORITES_EMPTY} replace />;
  }

  if (!data?.length) {
    return <Navigate to={ROUTES.FAVORITES_EMPTY} replace />;
  }

  return (
    <div className="favorites-index">
      <PageShell title={t('nav.favorites')}>
        <div className="records-page">
          <div className="records-page__panel">
            <FavoritesListPanel />
          </div>
        </div>
      </PageShell>
    </div>
  );
}
