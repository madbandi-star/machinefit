import type { WorkoutLog } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { queryClient } from '@/app/providers/QueryProvider';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useNetworkSyncStore } from '@/store/networkSync.store';
import { upsertWorkoutLogInCache } from '@/utils/workoutLogCache';
import {
  bumpSyncItem,
  countSyncQueue,
  enqueueSyncItem,
  listDueSyncItems,
  removeSyncItem,
  setMeta,
  type SyncQueueItem,
} from '@/offline/workoutOfflineDb';

let flushing = false;
let syncedHideTimer: ReturnType<typeof setTimeout> | null = null;

async function refreshPendingCount(): Promise<void> {
  const n = await countSyncQueue();
  useNetworkSyncStore.getState().setPendingCount(n);
}

function scheduleSyncedHide(): void {
  if (syncedHideTimer) clearTimeout(syncedHideTimer);
  syncedHideTimer = setTimeout(() => {
    const s = useNetworkSyncStore.getState();
    if (s.banner === 'synced' && s.pendingCount === 0) {
      s.setBanner(null);
    }
  }, 2500);
}

function isTransientFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;
  const err = error as { code?: string; response?: { status?: number }; message?: string };
  if (err.code === 'ECONNABORTED' || /timeout/i.test(String(err.message))) return true;
  const status = err.response?.status;
  if (!status) return true;
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function patchCachesFromSaved(saved: WorkoutLog): void {
  const params = {
    machineCode: saved.machineCode,
    logDate: saved.logDate,
    targetMuscleGroup: saved.targetMuscleGroup,
  };
  queryClient.setQueryData(
    QUERY_KEYS.workoutLogToday(
      saved.gymId,
      saved.memberId,
      saved.machineCode,
      saved.logDate,
      saved.targetMuscleGroup
    ),
    [saved]
  );
  queryClient.setQueriesData<WorkoutLog[]>(
    { queryKey: QUERY_KEYS.workoutLogs },
    (old) => {
      if (!Array.isArray(old) || old.length === 0) return old;
      const sample = old[0];
      if (!sample || typeof sample !== 'object' || !('setWeightsKg' in sample)) return old;
      return upsertWorkoutLogInCache(old, saved, params);
    }
  );
}

async function flushOne(item: SyncQueueItem): Promise<boolean> {
  try {
    const res = await workoutLogApi.upsert(
      item.body as Parameters<typeof workoutLogApi.upsert>[0],
      { idempotencyKey: item.idempotencyKey }
    );
    patchCachesFromSaved(res.data.data);
    void import('@/utils/timerHistoryPersist').then(({ noteActiveTimerMachine }) => {
      noteActiveTimerMachine(res.data.data);
    });
    await removeSyncItem(item.id);
    await setMeta('lastSyncedAt', Date.now());
    void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
      trackFeature('workout_sync_ok')
    );
    return true;
  } catch (error) {
    void import('@/utils/opsTelemetry').then(({ trackOpsError }) =>
      trackOpsError({
        title: 'WorkoutSyncFail',
        message: error instanceof Error ? error.message : String(error),
        severity: 'high',
        source: 'api',
        meta: { queueId: item.id, attempts: item.attempts },
      })
    );
    if (!isTransientFailure(error) || item.attempts >= 8) {
      // Keep item but back off hard; user still has local draft.
      await bumpSyncItem(item.id, item.attempts + 1, Date.now() + 60_000);
      return false;
    }
    const delay = Math.min(60_000, 1_000 * 2 ** Math.min(item.attempts, 5));
    await bumpSyncItem(item.id, item.attempts + 1, Date.now() + delay);
    return false;
  }
}

export async function flushWorkoutSyncQueue(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    useNetworkSyncStore.getState().setOnline(false);
    await refreshPendingCount();
    return;
  }
  flushing = true;
  useNetworkSyncStore.getState().setOnline(true);
  try {
    const due = await listDueSyncItems();
    if (due.length > 0) {
      useNetworkSyncStore.getState().setBanner('syncing');
    }
    for (const item of due) {
      await flushOne(item);
    }
    await refreshPendingCount();
    const pending = useNetworkSyncStore.getState().pendingCount;
    if (pending === 0 && due.length > 0) {
      useNetworkSyncStore.getState().setBanner('synced');
      scheduleSyncedHide();
    }
  } finally {
    flushing = false;
  }
}

export async function enqueueWorkoutLogUpsert(input: {
  clientActionId: string;
  idempotencyKey: string;
  body: Record<string, unknown>;
}): Promise<void> {
  await enqueueSyncItem({
    id: input.clientActionId,
    clientActionId: input.clientActionId,
    idempotencyKey: input.idempotencyKey,
    method: 'PUT',
    path: '/workout-logs',
    body: input.body,
  });
  await refreshPendingCount();
  void flushWorkoutSyncQueue();
}

let listenersBound = false;

export function bindWorkoutSyncLifecycle(): () => void {
  if (listenersBound || typeof window === 'undefined') return () => undefined;
  listenersBound = true;

  const onOnline = () => {
    useNetworkSyncStore.getState().setOnline(true);
    void flushWorkoutSyncQueue();
  };
  const onOffline = () => {
    useNetworkSyncStore.getState().setOnline(false);
    void import('@/utils/opsTelemetry').then(({ trackFeature }) => trackFeature('offline'));
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') void flushWorkoutSyncQueue();
  };
  const onPageShow = () => {
    void flushWorkoutSyncQueue();
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('pageshow', onPageShow);

  void refreshPendingCount().then(() => {
    if (!navigator.onLine) useNetworkSyncStore.getState().setOnline(false);
    else void flushWorkoutSyncQueue();
  });

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('pageshow', onPageShow);
    listenersBound = false;
  };
}
