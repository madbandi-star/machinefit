import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Role, hasMinRole } from '@machinefit/shared';
import { HomeHero } from '@/components/home/HomeHero/HomeHero';
import { HomeWorkoutToolsSection } from '@/components/home/HomeWorkoutToolsSection/HomeWorkoutToolsSection';
import { ProfileIncompleteBanner } from '@/components/home/ProfileIncompleteBanner/ProfileIncompleteBanner';
import { RecentMachinesRow } from '@/components/home/RecentMachinesRow/RecentMachinesRow';
import { FavoriteMachinesRow } from '@/components/home/FavoriteMachinesRow/FavoriteMachinesRow';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner/InstallPromptBanner';
import { GymSelector } from '@/components/gyms/GymSelector/GymSelector';
import { MemberSelector } from '@/components/gyms/MemberSelector/MemberSelector';
import { userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useKakaoLoginCallback } from '@/hooks/useKakaoLoginCallback';
import { useAuthStore } from '@/store/auth.store';
import { isProfileReadyForRecommend } from '@/utils/profileCompleteness';
import '@/styles/home.css';

export function HomePage() {
  const authReady = useAuthHydration();
  useKakaoLoginCallback();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Home is outside AuthGuard — sync /me so body metrics aren't stuck missing after F5.
  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: authReady && isAuthenticated,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (meQuery.data) updateUser(meQuery.data);
  }, [meQuery.data, updateUser]);

  const profileReady = isProfileReadyForRecommend(user);
  const waitingForMe =
    isAuthenticated &&
    !profileReady &&
    !meQuery.data &&
    (meQuery.isLoading || meQuery.isFetching || !authReady);

  // Guests still see the hero. Logged-in users with a complete profile never do.
  // While /me is in flight with stripped/stale metrics, hide incomplete CTAs.
  const showHero = !isAuthenticated || (!waitingForMe && !profileReady);
  const showProfileBanner = isAuthenticated && !waitingForMe && !profileReady;
  /** Gym name + member id: hidden for plain `member`; visible for premium_member+. */
  const showGymMemberSelectors =
    isAuthenticated && hasMinRole(user?.roleCode, Role.PREMIUM_MEMBER);

  return (
    <div className="home-page">
      {showHero && <HomeHero isAuthenticated={isAuthenticated} />}

      {showGymMemberSelectors && (
        <div className="home-gym-selector">
          <GymSelector />
          <MemberSelector />
        </div>
      )}

      <InstallPromptBanner />

      {showProfileBanner && <ProfileIncompleteBanner />}
      {isAuthenticated && <HomeWorkoutToolsSection />}
      {isAuthenticated && <RecentMachinesRow />}
      {isAuthenticated && <FavoriteMachinesRow />}
    </div>
  );
}
