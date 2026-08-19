import { isAllGymsId, type GymMember, type Locale, type WorkoutCard } from '@machinefit/shared';
import { userGymService } from './user-gym.service.js';
import { gymMemberService } from './gym-member.service.js';
import { historyService } from './history.service.js';
import { favoriteService } from './favorite.service.js';
import { workoutCardService } from './workout-card.service.js';

const HOME_HISTORY_LIMIT = 40;

export type HomeBootstrapInclude = 'todayCards' | 'missed';

function sortMembersByCreatedAt(members: GymMember[]): GymMember[] {
  return [...members].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function parseIncludes(raw?: string): Set<HomeBootstrapInclude> {
  const out = new Set<HomeBootstrapInclude>();
  if (!raw?.trim()) return out;
  for (const part of raw.split(',')) {
    const key = part.trim();
    if (key === 'todayCards' || key === 'missed') out.add(key);
  }
  return out;
}

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const homeBootstrapService = {
  async get(
    userId: string,
    options: { gymId?: string; memberId?: string; include?: string },
    locale: Locale
  ) {
    const includes = parseIncludes(options.include);
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
    let todayWorkoutCards: WorkoutCard[] | undefined;
    let missedWorkoutCards: WorkoutCard[] | undefined;

    const canLoadRecords =
      activeMemberId != null &&
      (isAllGymsId(activeGymId) || members.some((member) => member.id === activeMemberId));

    if (canLoadRecords && activeMemberId) {
      const memberId = activeMemberId;
      const today = todayDateKey();
      const wantToday = includes.has('todayCards') && !isAllGymsId(activeGymId);
      const wantMissed = includes.has('missed') && !isAllGymsId(activeGymId);

      const [historyResult, favoritesResult, todayResult, missedResult] = await Promise.all([
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
        wantToday
          ? workoutCardService.list(
              userId,
              { gymId: activeGymId, memberId, scheduledDate: today },
              locale
            )
          : Promise.resolve(undefined),
        wantMissed
          ? workoutCardService.listMissed(
              userId,
              { gymId: activeGymId, memberId },
              locale
            )
          : Promise.resolve(undefined),
      ]);

      recentHistory = historyResult;
      favorites = favoritesResult;
      if (todayResult) todayWorkoutCards = todayResult;
      if (missedResult) missedWorkoutCards = missedResult;
    }

    return {
      gyms,
      activeGymId,
      members,
      activeMemberId,
      recentHistory,
      favorites,
      ...(todayWorkoutCards ? { todayWorkoutCards } : {}),
      ...(missedWorkoutCards ? { missedWorkoutCards } : {}),
    };
  },
};
