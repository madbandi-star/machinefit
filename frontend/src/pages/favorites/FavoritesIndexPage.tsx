import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useFavoritesList } from '@/hooks/useFavoritesList';

/** /favorites entry — route to list or empty guide based on count. */
export function FavoritesIndexPage() {
  const { activeGymId } = useActiveGym();
  const { memberScopeReady } = useActiveMember();
  const { data, isLoading, isError } = useFavoritesList();

  if (!activeGymId || !memberScopeReady || isLoading) {
    return <Skeleton count={2} height={88} />;
  }

  if (isError) {
    return <Navigate to={ROUTES.FAVORITES_EMPTY} replace />;
  }

  if (!data?.length) {
    return <Navigate to={ROUTES.FAVORITES_EMPTY} replace />;
  }

  return <Navigate to={`${ROUTES.RECORDS}?tab=favorites`} replace />;
}
