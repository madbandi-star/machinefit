import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MuscleGroupImageAsset, MuscleGroupImageKey } from '@machinefit/shared';
import { muscleGroupImageApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getMuscleGroupImage } from '@/constants/muscle-group-images';

export function useMuscleGroupImagesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.muscleGroupImages,
    queryFn: async () => {
      const res = await muscleGroupImageApi.list();
      return res.data.data.items;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMuscleGroupImageMap(): {
  map: Partial<Record<MuscleGroupImageKey, MuscleGroupImageAsset>>;
  /** True once the catalog query has settled at least once (success or error). */
  ready: boolean;
} {
  const { data, isPending } = useMuscleGroupImagesQuery();
  const map = useMemo(() => {
    const next: Partial<Record<MuscleGroupImageKey, MuscleGroupImageAsset>> = {};
    for (const item of data ?? []) {
      next[item.muscleGroup] = item;
    }
    return next;
  }, [data]);

  // Avoid painting bundled seed PNGs before admin covers arrive (search-page flash).
  // isPending = no cached data yet in React Query v5.
  return { map, ready: !isPending };
}

/**
 * Prefer admin-uploaded URL.
 * Bundled seed PNG is only used after the catalog is ready and that group has no remote asset —
 * otherwise callers should show a neutral fallback while loading.
 */
export function resolveMuscleGroupDisplayUrl(
  group: string,
  remoteMap?: Partial<Record<MuscleGroupImageKey, MuscleGroupImageAsset>>,
  preferThumb = false,
  options?: { allowSeedFallback?: boolean }
): string | undefined {
  const remote = remoteMap?.[group as MuscleGroupImageKey];
  const remoteUrl = preferThumb
    ? remote?.thumbnailUrl || remote?.imageUrl
    : remote?.imageUrl || remote?.thumbnailUrl;
  if (remoteUrl) return remoteUrl;
  if (options?.allowSeedFallback === false) return undefined;
  return getMuscleGroupImage(group);
}
