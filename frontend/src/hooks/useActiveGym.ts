import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ALL_GYMS_ID, isAllGymsId, type CreateUserGymInput, type UpdateUserGymInput, type UserGym } from '@machinefit/shared';
import { userGymApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { useUIStore } from '@/store/ui.store';
import { usePremiumStore } from '@/store/premium.store';

function invalidateGymScopedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
  void queryClient.invalidateQueries({ queryKey: ['favorites'] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
}

function isPlanLimitError(error: unknown): boolean {
  const err = error as { response?: { status?: number; data?: { code?: string } } };
  return (
    err?.response?.status === 402 ||
    err?.response?.data?.code === 'PLAN_LIMIT'
  );
}

export function useActiveGym() {
  const { t } = useTranslation(['gyms', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const openPremiumModal = usePremiumStore((s) => s.openPremiumModal);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storedGymId = useGymStore((s) => s.activeGymId);
  const setActiveGymId = useGymStore((s) => s.setActiveGymId);
  const setActiveMemberId = useGymStore((s) => s.setActiveMemberId);
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
    // 'all' is a valid local sentinel — keep it even after data loads
    if (storedGymId === ALL_GYMS_ID) return ALL_GYMS_ID;
    if (!data) return storedGymId;
    if (storedGymId && gyms.some((gym) => gym.id === storedGymId)) {
      return storedGymId;
    }
    return serverActiveGymId;
  }, [data, gyms, serverActiveGymId, storedGymId]);

  const activeGym = useMemo(
    () =>
      isAllGymsId(resolvedGymId)
        ? null
        : (gyms.find((gym) => gym.id === resolvedGymId) ?? data?.activeGym ?? null),
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

  // Sync active gym with server — skip for ALL_GYMS_ID sentinel
  useEffect(() => {
    if (!isAuthenticated || !resolvedGymId || !data) return;
    if (isAllGymsId(resolvedGymId)) return;
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
      setActiveMemberId(null);
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
      setActiveMemberId(null);
      syncedSelectRef.current = gym.id;
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
      invalidateGymScopedQueries(queryClient);
      showToast(t('gyms:manage.createGymSuccess'), 'success');
    },
    onError: (error) => {
      if (isPlanLimitError(error)) {
        openPremiumModal();
      } else {
        showToast(t('common:errors.submitFailed'), 'error');
      }
    },
  });

  const selectGym = useCallback(
    async (gymId: string) => {
      if (gymId === resolvedGymId) return;
      // ALL_GYMS_ID is a local-only sentinel — persist locally, no server call
      if (isAllGymsId(gymId)) {
        setActiveGymId(ALL_GYMS_ID);
        setActiveMemberId(null);
        invalidateGymScopedQueries(queryClient);
        return;
      }
      await selectMutation.mutateAsync(gymId);
    },
    [resolvedGymId, selectMutation, setActiveGymId, setActiveMemberId, queryClient]
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

  const updateMutation = useMutation({
    mutationFn: ({ gymId, body }: { gymId: string; body: UpdateUserGymInput }) =>
      userGymApi.update(gymId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
      showToast(t('gyms:manage.updateGymSuccess'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (gymId: string) => userGymApi.remove(gymId),
    onSuccess: async (_res, gymId) => {
      if (storedGymId === gymId || resolvedGymId === gymId) {
        setActiveGymId(null);
        setActiveMemberId(null);
        syncedSelectRef.current = null;
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
      invalidateGymScopedQueries(queryClient);
      showToast(t('gyms:manage.removeGymSuccess'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const updateGym = useCallback(
    async (gymId: string, body: UpdateUserGymInput) => {
      return updateMutation.mutateAsync({ gymId, body });
    },
    [updateMutation]
  );

  const removeGym = useCallback(
    async (gymId: string) => {
      return removeMutation.mutateAsync(gymId);
    },
    [removeMutation]
  );

  return {
    gyms,
    activeGym,
    activeGymId: resolvedGymId,
    isLoading: isAuthenticated && isLoading,
    selectGym,
    createGym,
    updateGym,
    removeGym,
    refetch,
  };
}
