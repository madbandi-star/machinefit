import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FavoriteBrandItem } from '@machinefit/shared';
import { brandFavoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useTranslation } from 'react-i18next';
import { resolveApiErrorMessage } from '@/utils/apiErrorCatalog';
import { createAsyncActionGuard } from '@/utils/asyncActionGuard';
import { useRef } from 'react';

/** Shared query for the signed-in user's brand favorites (newest first). */
export function useBrandFavorites() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: [...QUERY_KEYS.brandFavorites, userId ?? 'guest'] as const,
    queryFn: async () => {
      const res = await brandFavoriteApi.list();
      return res.data.data;
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useFavoriteBrandIds(): Set<string> {
  const { data } = useBrandFavorites();
  return new Set((data ?? []).map((item) => item.brandId));
}

export function useBrandFavoriteToggle(brandId: string) {
  const { t } = useTranslation(['common', 'machines']);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const showToast = useUIStore((s) => s.showToast);
  const listKey = [...QUERY_KEYS.brandFavorites, userId ?? 'guest'] as const;
  const { data: favorites = [] } = useBrandFavorites();
  const isFavorited = favorites.some((item) => item.brandId === brandId);
  const tapGuardRef = useRef(createAsyncActionGuard({ failureCooldownMs: 3_000 }));

  const mutation = useMutation({
    mutationFn: async (shouldFavorite: boolean) => {
      if (shouldFavorite) {
        const res = await brandFavoriteApi.add(brandId);
        return res.data.data;
      }
      await brandFavoriteApi.remove(brandId);
      return null;
    },
    onMutate: async (shouldFavorite) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<FavoriteBrandItem[]>(listKey);
      if (previous) {
        if (shouldFavorite) {
          const optimistic: FavoriteBrandItem = {
            id: `optimistic-${brandId}`,
            brandId,
            brandCode: '',
            brandName: { en: '', ko: '' },
            createdAt: new Date().toISOString(),
          };
          if (!previous.some((item) => item.brandId === brandId)) {
            queryClient.setQueryData<FavoriteBrandItem[]>(listKey, [optimistic, ...previous]);
          }
        } else {
          queryClient.setQueryData<FavoriteBrandItem[]>(
            listKey,
            previous.filter((item) => item.brandId !== brandId)
          );
        }
      }
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      showToast(resolveApiErrorMessage(err, t), 'error');
    },
    onSuccess: (item, shouldFavorite) => {
      if (shouldFavorite && item) {
        const previous = queryClient.getQueryData<FavoriteBrandItem[]>(listKey) ?? [];
        const withoutOptimistic = previous.filter(
          (row) => row.brandId !== brandId || !row.id.startsWith('optimistic-')
        );
        if (!withoutOptimistic.some((row) => row.brandId === brandId)) {
          queryClient.setQueryData<FavoriteBrandItem[]>(listKey, [item, ...withoutOptimistic]);
        } else {
          queryClient.setQueryData<FavoriteBrandItem[]>(
            listKey,
            withoutOptimistic.map((row) => (row.brandId === brandId ? item : row))
          );
        }
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brandFavorites });
    },
  });

  const toggle = () => {
    if (!userId) {
      showToast(t('common:nav.login'), 'info');
      return;
    }
    if (mutation.isPending || tapGuardRef.current.isBlocked()) return;
    void tapGuardRef.current
      .run(async () => {
        await mutation.mutateAsync(!isFavorited);
      })
      .catch(() => undefined);
  };

  return {
    isFavorited,
    toggle,
    isPending: mutation.isPending,
    canToggle: Boolean(userId),
  };
}
