import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';

interface UseFavoriteToggleOptions {
  machineCode: string;
  recommendationId?: string;
  isAuthenticated: boolean;
}

export function useFavoriteToggle({
  machineCode,
  recommendationId,
  isAuthenticated,
}: UseFavoriteToggleOptions) {
  const { t } = useTranslation(['machines', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const favoriteKey = QUERY_KEYS.favoriteCheck(machineCode);

  const { data: favoriteCheck } = useQuery({
    queryKey: favoriteKey,
    queryFn: async () => {
      const res = await favoriteApi.check(machineCode);
      return res.data.data;
    },
    enabled: isAuthenticated && Boolean(machineCode),
  });

  const isFavorited = favoriteCheck?.favorited ?? false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      shouldFavorite,
      favoriteId,
    }: {
      shouldFavorite: boolean;
      favoriteId?: string;
    }) => {
      if (!shouldFavorite) {
        if (!favoriteId) throw new Error('missing_favorite_id');
        await favoriteApi.remove(favoriteId);
        return { favorited: false as const, favoriteId: undefined };
      }

      const res = await favoriteApi.add(machineCode, recommendationId);
      return {
        favorited: true as const,
        favoriteId: res.data.data.id,
      };
    },
    onMutate: async ({ shouldFavorite, favoriteId }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKey });
      const previous = queryClient.getQueryData<{ favorited: boolean; favoriteId?: string }>(
        favoriteKey
      );
      queryClient.setQueryData(favoriteKey, {
        favorited: shouldFavorite,
        favoriteId: shouldFavorite ? favoriteId : undefined,
      });

      const previousFavorites = queryClient.getQueryData<
        Array<{ id: string; machineCode: string }>
      >(QUERY_KEYS.favorites);

      if (!shouldFavorite && favoriteId && previousFavorites) {
        queryClient.setQueryData(
          QUERY_KEYS.favorites,
          previousFavorites.filter((item) => item.id !== favoriteId)
        );
      }

      return { previous, previousFavorites, favoriteKey };
    },
    onSuccess: (data, _variables, context) => {
      const key = context?.favoriteKey ?? favoriteKey;
      queryClient.setQueryData(key, data);
      showToast(
        data.favorited ? t('common:actions.save') : t('machines:recommendation.removedFavorite'),
        'success'
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.favoriteKey) {
        queryClient.setQueryData(context.favoriteKey, context.previous);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(QUERY_KEYS.favorites, context.previousFavorites);
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const toggleFavorite = () => {
    toggleFavoriteMutation.mutate({
      shouldFavorite: !isFavorited,
      favoriteId: favoriteCheck?.favoriteId,
    });
  };

  return {
    isFavorited,
    toggleFavorite,
    isPending: toggleFavoriteMutation.isPending,
  };
}
