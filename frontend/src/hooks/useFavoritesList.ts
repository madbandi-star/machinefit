import { useQuery } from '@tanstack/react-query';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';

export function useFavoritesList() {
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';

  return useQuery({
    queryKey: QUERY_KEYS.favorites(activeGymId ?? '', memberKey),
    queryFn: async () => {
      const res = await favoriteApi.list(activeGymId!, activeMemberId ?? undefined);
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && memberScopeReady,
  });
}
