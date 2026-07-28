import { isAllGymsId, type GymMember, type Locale } from '@machinefit/shared';
import { userGymService } from './user-gym.service.js';
import { gymMemberService } from './gym-member.service.js';
import { historyService } from './history.service.js';
import { favoriteService } from './favorite.service.js';

const HOME_HISTORY_LIMIT = 40;

function sortMembersByCreatedAt(members: GymMember[]): GymMember[] {
  return [...members].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const homeBootstrapService = {
  async get(
    userId: string,
    options: { gymId?: string; memberId?: string },
    locale: Locale
  ) {
    const gyms = await userGymService.ensureReady(userId);

    let activeGymId = gyms.activeGymId;
    if (
      options.gymId &&
      (isAllGymsId(options.gymId) || gyms.items.some((gym) => gym.id === options.gymId))
    ) {
      activeGymId = options.gymId;
    }

    let members: GymMember[] = [];
    let activeMemberId: string | null = null;

    if (!isAllGymsId(activeGymId)) {
      members = await gymMemberService.list(userId, activeGymId);
      const sorted = sortMembersByCreatedAt(members);
      if (options.memberId && members.some((member) => member.id === options.memberId)) {
        activeMemberId = options.memberId;
      } else {
        activeMemberId = sorted[0]?.id ?? null;
      }
    } else if (options.memberId) {
      activeMemberId = options.memberId;
    }

    let recentHistory: Awaited<ReturnType<typeof historyService.list>> = [];
    let favorites: Awaited<ReturnType<typeof favoriteService.list>> = [];

    const canLoadRecords =
      activeMemberId != null &&
      (isAllGymsId(activeGymId) || members.some((member) => member.id === activeMemberId));

    if (canLoadRecords && activeMemberId) {
      const memberId = activeMemberId;
      [recentHistory, favorites] = await Promise.all([
        historyService.list(
          userId,
          {
            gymId: activeGymId,
            memberId,
            limit: HOME_HISTORY_LIMIT,
          },
          locale
        ),
        favoriteService.list(userId, activeGymId, locale, {
          memberId,
        }),
      ]);
    }

    return {
      gyms,
      activeGymId,
      members,
      activeMemberId,
      recentHistory,
      favorites,
    };
  },
};
