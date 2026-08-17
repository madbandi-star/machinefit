import type { QueryClient } from '@tanstack/react-query';
import type { Machine } from '@machinefit/shared';
import { QUERY_KEYS } from '@/constants/query-keys';

function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const status = (error as { response?: { status?: number } }).response?.status;
  return typeof status === 'number' ? status : undefined;
}

export function isMachineNotFoundError(error: unknown): boolean {
  return getHttpStatus(error) === 404;
}

/** Prefer an already-fetched machine from detail or search-list caches. */
export function findCachedMachine(
  queryClient: QueryClient,
  machineCode: string,
  muscle?: string | null
): Machine | undefined {
  if (muscle) {
    const withMuscle = queryClient.getQueryData<Machine>(
      QUERY_KEYS.machine(machineCode, muscle)
    );
    if (withMuscle) return withMuscle;
  }

  const base = queryClient.getQueryData<Machine>(QUERY_KEYS.machine(machineCode));
  if (base) return base;

  const lists = queryClient.getQueriesData<Machine[]>({ queryKey: QUERY_KEYS.machines });
  for (const [, data] of lists) {
    if (!Array.isArray(data)) continue;
    const hit = data.find((item) => item.code === machineCode);
    if (hit) return hit;
  }

  return undefined;
}

/** Seed detail cache from a list row so navigation never flashes loadFailed. */
export function seedMachineDetailCache(
  queryClient: QueryClient,
  machine: Machine,
  muscle?: string | null
): void {
  queryClient.setQueryData(QUERY_KEYS.machine(machine.code), machine);
  if (muscle) {
    queryClient.setQueryData(QUERY_KEYS.machine(machine.code, muscle), machine);
  }
}
