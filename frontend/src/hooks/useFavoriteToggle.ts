import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
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
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | undefined>();
  const hydratedMachineRef = useRef('');

  const { data: favoriteCheck } = useQuery({
    queryKey: favoriteKey,
    queryFn: async () => {
      const res = await favoriteApi.check(machineCode);
      return res.data.data;
    },
    enabled: isAuthenticated && Boolean(machineCode),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!machineCode) return;
    if (machineCode !== hydratedMachineRef.current) {
      hydratedMachineRef.current = '';
    }
    if (!favoriteCheck || hydratedMachineRef.current === machineCode) return;
    setIsFavorited(favoriteCheck.favorited);
    setFavoriteId(favoriteCheck.favoriteId);
    hydratedMachineRef.current = machineCode;
  }, [machineCode, favoriteCheck]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      shouldFavorite,
      favoriteId: id,
    }: {
      shouldFavorite: boolean;
      favoriteId?: string;
    }) => {
      if (!shouldFavorite) {
        if (!id) throw new Error('missing_favorite_id');
        await favoriteApi.remove(id);
        return { favorited: false as const, favoriteId: undefined };
      }

      const res = await favoriteApi.add(machineCode, recommendationId);
      return {
        favorited: true as const,
        favoriteId: res.data.data.id,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(favoriteKey, data);
      setIsFavorited(data.favorited);
      setFavoriteId(data.favoriteId);
      showToast(
        data.favorited
          ? t('machines:recommendation.savedFavorite')
          : t('machines:recommendation.removedFavorite'),
        'success'
      );
    },
    onError: (_error, variables) => {
      setIsFavorited(!variables.shouldFavorite);
      if (variables.shouldFavorite) {
        setFavoriteId(undefined);
      } else {
        setFavoriteId(variables.favoriteId);
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const toggleFavorite = () => {
    const shouldFavorite = !isFavorited;
    setIsFavorited(shouldFavorite);
    if (!shouldFavorite) {
      setFavoriteId(undefined);
    }
    toggleFavoriteMutation.mutate({
      shouldFavorite,
      favoriteId,
    });
  };

  return {
    isFavorited,
    toggleFavorite,
    isPending: toggleFavoriteMutation.isPending,
  };
}
