import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useUIStore } from '@/store/ui.store';
import { shouldShowDefaultMachineMuscle, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import '@/styles/records.css';

export function FavoritesListPanel() {
  const { t } = useTranslation(['common', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';
  const favoritesKey = QUERY_KEYS.favorites(activeGymId ?? '', memberKey);

  const { data, isLoading, isError } = useQuery({
    queryKey: favoritesKey,
    queryFn: async () => {
      const res = await favoriteApi.list(activeGymId!, activeMemberId ?? undefined);
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && memberScopeReady,
  });

  const removeMutation = useMutation({
    mutationFn: (item: { id: string; machineCode: string }) => favoriteApi.remove(item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey });
      const previous = queryClient.getQueryData<
        Array<{ id: string; machineCode: string; machineName: string }>
      >(favoritesKey);
      if (previous) {
        queryClient.setQueryData(
          favoritesKey,
          previous.filter((favorite) => favorite.id !== item.id)
        );
      }

      const favoriteCheckKey = QUERY_KEYS.favoriteCheck(
        activeGymId ?? '',
        item.machineCode,
        memberKey
      );
      await queryClient.cancelQueries({ queryKey: favoriteCheckKey });
      const previousCheck = queryClient.getQueryData<{ favorited: boolean; favoriteId?: string }>(
        favoriteCheckKey
      );
      queryClient.setQueryData(favoriteCheckKey, { favorited: false, favoriteId: undefined });

      return { previous, previousCheck, favoriteCheckKey };
    },
    onSuccess: async (_data, item, context) => {
      const favoriteCheckKey =
        context?.favoriteCheckKey ??
        QUERY_KEYS.favoriteCheck(activeGymId ?? '', item.machineCode, memberKey);
      queryClient.setQueryData(favoriteCheckKey, { favorited: false, favoriteId: undefined });
      showToast(t('machines:recommendation.removedFavorite'), 'success');
    },
    onError: (_error, _item, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoritesKey, context.previous);
      }
      if (context?.previousCheck && context.favoriteCheckKey) {
        queryClient.setQueryData(context.favoriteCheckKey, context.previousCheck);
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  if (!activeGymId || isLoading) return <Skeleton count={3} height={56} />;
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
        const displayName = formatBrandedMachineLabel(
          item.machineName,
          item.brandName,
          item.machineCode
        );

        return (
          <article key={item.id} className="favorite-row">
            <Link to={primaryUrl} className="favorite-row__link">
              <MachineNameWithMuscle
                muscleGroup={
                  shouldShowDefaultMachineMuscle(item.machineCode) ? item.muscleGroup : undefined
                }
                name={displayName}
                iconSize={22}
                labelClassName="favorite-row__name"
              />
            </Link>
            <button
              type="button"
              className="favorite-row__remove"
              aria-label={t('machines:favorites.remove')}
              onClick={() => removeMutation.mutate({ id: item.id, machineCode: item.machineCode })}
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
