import { HomeHero } from '@/components/home/HomeHero/HomeHero';
import { ProfileIncompleteBanner } from '@/components/home/ProfileIncompleteBanner/ProfileIncompleteBanner';
import { RecentMachinesRow } from '@/components/home/RecentMachinesRow/RecentMachinesRow';
import { FavoriteMachinesRow } from '@/components/home/FavoriteMachinesRow/FavoriteMachinesRow';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner/InstallPromptBanner';
import { GymSelector } from '@/components/gyms/GymSelector/GymSelector';
import { MemberSelector } from '@/components/gyms/MemberSelector/MemberSelector';
import { useAuthStore } from '@/store/auth.store';
import { isProfileReadyForRecommend } from '@/utils/profileCompleteness';
import '@/styles/home.css';

export function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const showHero = !isAuthenticated || !isProfileReadyForRecommend(user);

  return (
    <div className="home-page">
      {showHero && <HomeHero isAuthenticated={isAuthenticated} />}

      {isAuthenticated && (
        <div className="home-gym-selector">
          <GymSelector />
          <MemberSelector />
        </div>
      )}

      <InstallPromptBanner />

      {isAuthenticated && <ProfileIncompleteBanner />}
      {isAuthenticated && <RecentMachinesRow />}
      {isAuthenticated && <FavoriteMachinesRow />}
    </div>
  );
}
