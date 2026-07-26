import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import '@/styles/home.css';
import '@/styles/favorites-empty.css';

export function FavoritesEmptyPage() {
  const { t } = useTranslation(['machines', 'common']);
  const { activeGymId } = useActiveGym();
  const { memberScopeReady } = useActiveMember();
  const { data, isLoading, isError } = useFavoritesList();

  if (!activeGymId || !memberScopeReady || isLoading) {
    return (
      <PageShell title={t('common:nav.favorites')}>
        <Skeleton count={2} height={88} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell title={t('common:nav.favorites')}>
        <QueryErrorMessage />
      </PageShell>
    );
  }

  if (data && data.length > 0) {
    return <Navigate to={`${ROUTES.RECORDS}?tab=favorites`} replace />;
  }

  return (
    <PageShell title={t('common:nav.favorites')}>
      <div className="favorites-empty">
        <div className="favorites-empty__icon" aria-hidden>
          <Icon name="heart" size={40} />
        </div>
        <h2 className="favorites-empty__title">{t('machines:favorites.emptyPage.title')}</h2>
        <p className="favorites-empty__description">{t('machines:favorites.emptyPage.description')}</p>
        <Link
          to={ROUTES.MACHINES}
          className="home-quick-actions__btn home-quick-actions__btn--search favorites-empty__search"
        >
          <span className="home-quick-actions__icon" aria-hidden>
            <Icon name="search" size={28} />
          </span>
          <span className="home-quick-actions__label">{t('common:pages.home.quickSearch')}</span>
        </Link>
      </div>
    </PageShell>
  );
}
