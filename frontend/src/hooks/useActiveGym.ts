import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isAllGymsId, type CreateUserGymInput, type UpdateUserGymInput, type UserGym } from '@machinefit/shared';
import { userGymApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { useUIStore } from '@/store/ui.store';
import { usePremiumStore } from '@/store/premium.store';
import { fetchDefaultMemberId } from '@/utils/gymMemberDefault';
import { resolveGymManageErrorMessage } from '@/utils/getApiErrorMessage';

function invalidateGymScopedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
  void queryClient.invalidateQueries({ queryKey: ['favorites'] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
}

function isPlanLimitError(error: unknown): boolean {
  const err = error as {
    response?: { status?: number; data?: { code?: string; error?: { code?: string } } };
  };
  const code = err?.response?.data?.error?.code ?? err?.response?.data?.code;
  return err?.response?.status === 402 || code === 'PLAN_LIMIT';
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
    // All-gyms picker removed from UI — never keep ALL_GYMS_ID as the active selection
    if (!data) {
      return isAllGymsId(storedGymId) ? null : storedGymId;
    }
    if (storedGymId && !isAllGymsId(storedGymId) && gyms.some((gym) => gym.id === storedGymId)) {
      return storedGymId;
    }
    return serverActiveGymId ?? gyms[0]?.id ?? null;
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

  // Sync active gym with server
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
    onSuccess: async (res, gymId) => {
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
      const defaultMemberId = await fetchDefaultMemberId(gymId);
      setActiveMemberId(defaultMemberId);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGymMembers(gymId) });
      invalidateGymScopedQueries(queryClient);
      showToast(t('gyms:selector.switchSuccess'), 'success');
    },
    onError: (error) => showToast(resolveGymManageErrorMessage(error, t), 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateUserGymInput) => userGymApi.create(input),
    onSuccess: async (res) => {
      const gym = res.data.data;
      setActiveGymId(gym.id);
      syncedSelectRef.current = gym.id;
      const defaultMemberId = await fetchDefaultMemberId(gym.id);
      setActiveMemberId(defaultMemberId);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGymMembers(gym.id) });
      invalidateGymScopedQueries(queryClient);
      showToast(t('gyms:manage.createGymSuccess'), 'success');
    },
    onError: (error) => {
      if (isPlanLimitError(error)) {
        openPremiumModal();
      } else {
        showToast(resolveGymManageErrorMessage(error, t), 'error');
      }
    },
  });

  const selectGym = useCallback(
    async (gymId: string) => {
      if (gymId === resolvedGymId) return;
      // All-gyms UI removed — ignore sentinel if called
      if (isAllGymsId(gymId)) return;
      await selectMutation.mutateAsync(gymId);
    },
    [resolvedGymId, selectMutation]
  );

  const createGym = useCallback(
    async (
      input: Omit<CreateUserGymInput, 'setActive' | 'setDefault' | 'requireLocation'> & {
        setActive?: boolean;
        setDefault?: boolean;
        requireLocation?: boolean;
      }
    ) => {
      const gym = await createMutation.mutateAsync({
        ...input,
        setActive: input.setActive ?? true,
        setDefault: input.setDefault ?? false,
        requireLocation: input.requireLocation ?? true,
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
    onError: (error) => showToast(resolveGymManageErrorMessage(error, t), 'error'),
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
    onError: (error) => showToast(resolveGymManageErrorMessage(error, t), 'error'),
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
