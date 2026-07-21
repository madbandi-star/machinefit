import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { CreateUserGymInput, UserGym } from '@machinefit/shared';
import { userGymApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { useUIStore } from '@/store/ui.store';

function invalidateGymScopedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
  void queryClient.invalidateQueries({ queryKey: ['favorites'] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
}

export function useActiveGym() {
  const { t } = useTranslation(['gyms', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storedGymId = useGymStore((s) => s.activeGymId);
  const setActiveGymId = useGymStore((s) => s.setActiveGymId);
  const syncedSelectRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.userGyms,
    queryFn: async () => {
      const res = await userGymApi.list();
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const gyms = data?.items ?? [];
  const serverActiveGymId = data?.activeGymId ?? null;

  const resolvedGymId = useMemo(() => {
    if (!data) return storedGymId;
    if (storedGymId && gyms.some((gym) => gym.id === storedGymId)) {
      return storedGymId;
    }
    return serverActiveGymId;
  }, [data, gyms, serverActiveGymId, storedGymId]);

  const activeGym = useMemo(
    () => gyms.find((gym) => gym.id === resolvedGymId) ?? data?.activeGym ?? null,
    [data?.activeGym, gyms, resolvedGymId]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      syncedSelectRef.current = null;
      return;
    }
    if (!resolvedGymId) return;
    if (storedGymId !== resolvedGymId) {
      setActiveGymId(resolvedGymId);
    }
  }, [isAuthenticated, resolvedGymId, setActiveGymId, storedGymId]);

  useEffect(() => {
    if (!isAuthenticated || !resolvedGymId || !data) return;
    if (resolvedGymId === serverActiveGymId) {
      syncedSelectRef.current = resolvedGymId;
      return;
    }
    if (syncedSelectRef.current === resolvedGymId) return;
    syncedSelectRef.current = resolvedGymId;
    void userGymApi.select(resolvedGymId).catch(() => {
      syncedSelectRef.current = null;
    });
  }, [data, isAuthenticated, resolvedGymId, serverActiveGymId]);

  const selectMutation = useMutation({
    mutationFn: (gymId: string) => userGymApi.select(gymId),
    onSuccess: (res, gymId) => {
      setActiveGymId(gymId);
      syncedSelectRef.current = gymId;
      queryClient.setQueryData(QUERY_KEYS.userGyms, (prev: typeof data) =>
        prev
          ? {
              ...prev,
              activeGymId: gymId,
              activeGym: res.data.data,
            }
          : prev
      );
      invalidateGymScopedQueries(queryClient);
      showToast(t('gyms:selector.switchSuccess'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateUserGymInput) => userGymApi.create(input),
    onSuccess: async (res) => {
      const gym = res.data.data;
      setActiveGymId(gym.id);
      syncedSelectRef.current = gym.id;
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
      invalidateGymScopedQueries(queryClient);
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const selectGym = useCallback(
    async (gymId: string) => {
      if (gymId === resolvedGymId) return;
      await selectMutation.mutateAsync(gymId);
    },
    [resolvedGymId, selectMutation]
  );

  const createGym = useCallback(
    async (input: {
      name: string;
      address?: string;
      brandName?: string;
      setActive?: boolean;
      setDefault?: boolean;
    }) => {
      const gym = await createMutation.mutateAsync({
        name: input.name,
        address: input.address || undefined,
        brandName: input.brandName || undefined,
        setActive: input.setActive ?? true,
        setDefault: input.setDefault ?? false,
      });
      return gym.data.data as UserGym;
    },
    [createMutation]
  );

  return {
    gyms,
    activeGym,
    activeGymId: resolvedGymId,
    isLoading: isAuthenticated && isLoading,
    selectGym,
    createGym,
    refetch,
  };
}
