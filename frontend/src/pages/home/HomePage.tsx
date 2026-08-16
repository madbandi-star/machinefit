import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Role, hasMinRole } from '@machinefit/shared';
import { AuthLandingScreen } from '@/components/auth/AuthLandingScreen/AuthLandingScreen';
import { HomeWorkoutToolsSection } from '@/components/home/HomeWorkoutToolsSection/HomeWorkoutToolsSection';
import { ProfileIncompleteBanner } from '@/components/home/ProfileIncompleteBanner/ProfileIncompleteBanner';
import { HomeNoticeBanner } from '@/components/home/HomeNoticeBanner/HomeNoticeBanner';
import { HomePlannedWorkoutCard, MissedWorkoutPlansBanner } from '@/components/home/HomePlannedWorkoutCard/HomePlannedWorkoutCard';
import { HomeWorkoutSessionTimer } from '@/components/home/HomeWorkoutSessionTimer/HomeWorkoutSessionTimer';
import { WorkoutCompleteHost } from '@/components/home/WorkoutCompleteReport/WorkoutCompleteHost';
import { HomeFortuneCard } from '@/components/home/HomeFortuneCard/HomeFortuneCard';
import { NoticePopup } from '@/components/notices/NoticePopup/NoticePopup';
import { RecentMachinesRow } from '@/components/home/RecentMachinesRow/RecentMachinesRow';
import { FavoriteMachinesRow } from '@/components/home/FavoriteMachinesRow/FavoriteMachinesRow';
import { BannerSlot } from '@/components/banners/BannerSlot/BannerSlot';
import { AdSlot } from '@/ads/AdSlot';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner/InstallPromptBanner';
import { GymSelector } from '@/components/gyms/GymSelector/GymSelector';
import { MemberSelector } from '@/components/gyms/MemberSelector/MemberSelector';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Seo } from '@/seo/Seo';
import { homeBrandJsonLd } from '@/seo/jsonLd';
import { SEO_HOME_DESCRIPTION, SEO_HOME_TITLE } from '@/seo/siteSeo';
import { userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import { isProfileReadyForRecommend } from '@/utils/profileCompleteness';
import { peekPersistedIsAuthenticated } from '@/utils/peekPersistedAuth';
import '@/styles/home.css';
import '@/styles/fortune.css';

export function HomePage() {
  const authReady = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [assumeAuthed] = useState(
    () => isAuthenticated || peekPersistedIsAuthenticated()
  );
  const treatAsAuthed = isAuthenticated || (!authReady && assumeAuthed);

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

  // While /me is in flight with stripped/stale metrics, hide incomplete CTAs.
  const showProfileBanner = isAuthenticated && !waitingForMe && !profileReady;
  /** Gym name + member id: hidden for plain `member`; visible for premium_member+. */
  const showGymMemberSelectors =
    isAuthenticated && hasMinRole(user?.roleCode, Role.PREMIUM_MEMBER);

  if (!treatAsAuthed) {
    return (
      <>
        <Seo
          title={SEO_HOME_TITLE}
          description={SEO_HOME_DESCRIPTION}
          path="/"
          titleAbsolute
          jsonLd={homeBrandJsonLd()}
        />
        <AuthLandingScreen />
      </>
    );
  }

  if (!authReady || !isAuthenticated) {
    return (
      <div className="home-page" aria-busy="true">
        <Skeleton count={3} height={88} />
      </div>
    );
  }

  return (
    <div className="home-page">
      <Seo
        title={SEO_HOME_TITLE}
        description={SEO_HOME_DESCRIPTION}
        path="/"
        titleAbsolute
        jsonLd={homeBrandJsonLd()}
      />
      {showGymMemberSelectors && (
        <div className="home-gym-selector">
          <GymSelector />
          <MemberSelector />
        </div>
      )}

      <HomeNoticeBanner />
      <HomePlannedWorkoutCard />

      <InstallPromptBanner />

      {showProfileBanner && <ProfileIncompleteBanner />}
      <NoticePopup />
      <MissedWorkoutPlansBanner />
      <HomeFortuneCard />
      <HomeWorkoutSessionTimer />
      <WorkoutCompleteHost />
      <HomeWorkoutToolsSection />
      <AdSlot placement="HOME_MIDDLE" event="PAGE_VIEW" />
      <RecentMachinesRow />
      <FavoriteMachinesRow />
      <BannerSlot slot="MAIN_BOTTOM" />
    </div>
  );
}
