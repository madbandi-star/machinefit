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

export function useMuscleGroupImageMap(): Partial<Record<MuscleGroupImageKey, MuscleGroupImageAsset>> {
  const { data } = useMuscleGroupImagesQuery();
  return useMemo(() => {
    const map: Partial<Record<MuscleGroupImageKey, MuscleGroupImageAsset>> = {};
    for (const item of data ?? []) {
      map[item.muscleGroup] = item;
    }
    return map;
  }, [data]);
}

/** Prefer admin-uploaded URL; fall back to bundled static PNG. */
export function resolveMuscleGroupDisplayUrl(
  group: string,
  remoteMap?: Partial<Record<MuscleGroupImageKey, MuscleGroupImageAsset>>,
  preferThumb = false
): string | undefined {
  const remote = remoteMap?.[group as MuscleGroupImageKey];
  const remoteUrl = preferThumb
    ? remote?.thumbnailUrl || remote?.imageUrl
    : remote?.imageUrl || remote?.thumbnailUrl;
  if (remoteUrl) return remoteUrl;
  return getMuscleGroupImage(group);
}
