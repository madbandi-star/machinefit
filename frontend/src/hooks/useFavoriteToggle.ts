import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useUIStore } from '@/store/ui.store';

interface UseFavoriteToggleOptions {
  machineCode: string;
  recommendationId?: string;
  isAuthenticated: boolean;
  /** When set (including false), skip per-card check GET — same favorited state from list. */
  initialFavorited?: boolean | null;
  initialFavoriteId?: string;
}

export function useFavoriteToggle({
  machineCode,
  recommendationId,
  isAuthenticated,
  initialFavorited = null,
  initialFavoriteId,
}: UseFavoriteToggleOptions) {
  const { t } = useTranslation(['machines', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady, isRealGym } = useActiveMember();
  const memberKey = activeMemberId ?? '';
  const favoriteKey = QUERY_KEYS.favoriteCheck(activeGymId ?? '', machineCode, memberKey);
  const hasListSeed = initialFavorited !== null && initialFavorited !== undefined;
  const [isFavorited, setIsFavorited] = useState(() =>
    hasListSeed ? Boolean(initialFavorited) : false
  );
  const [favoriteId, setFavoriteId] = useState<string | undefined>(() =>
    hasListSeed ? initialFavoriteId : undefined
  );
  const hydratedMachineRef = useRef(hasListSeed ? machineCode : '');

  const { data: favoriteCheck } = useQuery({
    queryKey: favoriteKey,
    queryFn: async () => {
      const res = await favoriteApi.check(activeGymId!, machineCode, activeMemberId!);
      return res.data.data;
    },
    enabled:
      isAuthenticated &&
      Boolean(machineCode) &&
      Boolean(activeGymId) &&
      memberScopeReady &&
      Boolean(activeMemberId) &&
      isRealGym &&
      !hasListSeed,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!machineCode) return;
    if (hasListSeed) {
      setIsFavorited(Boolean(initialFavorited));
      setFavoriteId(initialFavoriteId);
      hydratedMachineRef.current = machineCode;
      return;
    }
    if (machineCode !== hydratedMachineRef.current) {
      hydratedMachineRef.current = '';
    }
    if (!favoriteCheck || hydratedMachineRef.current === machineCode) return;
    setIsFavorited(favoriteCheck.favorited);
    setFavoriteId(favoriteCheck.favoriteId);
    hydratedMachineRef.current = machineCode;
  }, [machineCode, favoriteCheck, hasListSeed, initialFavorited, initialFavoriteId]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      shouldFavorite,
      favoriteId: id,
    }: {
      shouldFavorite: boolean;
      favoriteId?: string;
    }) => {
      if (!activeGymId || !activeMemberId) throw new Error('missing_gym_or_member');
      if (!shouldFavorite) {
        if (!id) throw new Error('missing_favorite_id');
        await favoriteApi.remove(id);
        return { favorited: false as const, favoriteId: undefined };
      }

      const res = await favoriteApi.add(activeGymId, activeMemberId, machineCode, recommendationId);
      return {
        favorited: true as const,
        favoriteId: res.data.data.id,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(favoriteKey, data);
      setIsFavorited(data.favorited);
      setFavoriteId(data.favoriteId);
      if (data.favorited) {
        void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
          trackFeature('favorite_add')
        );
      }
      if (activeGymId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.favorites(activeGymId, memberKey),
        });
      }
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
    if (!activeGymId || !activeMemberId || !isRealGym) {
      showToast(t('common:errors.submitFailed'), 'error');
      return;
    }
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
    /** False until gym + member context is ready for favorite writes. */
    canFavorite: isAuthenticated && isRealGym && Boolean(activeGymId) && Boolean(activeMemberId),
  };
}
