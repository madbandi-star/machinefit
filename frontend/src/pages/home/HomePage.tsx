import { useTranslation } from 'react-i18next';
import { HomeHero } from '@/components/home/HomeHero/HomeHero';
import { QuickSearchBar } from '@/components/home/QuickSearchBar/QuickSearchBar';
import { ProfileIncompleteBanner } from '@/components/home/ProfileIncompleteBanner/ProfileIncompleteBanner';
import { RecentMachinesRow } from '@/components/home/RecentMachinesRow/RecentMachinesRow';
import { FavoriteMachinesRow } from '@/components/home/FavoriteMachinesRow/FavoriteMachinesRow';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner/InstallPromptBanner';
import {
  DailyBriefingModal,
  useDailyBriefing,
} from '@/components/home/DailyBriefingModal/DailyBriefingModal';
import { GymSelector } from '@/components/gyms/GymSelector/GymSelector';
import { useAuthStore } from '@/store/auth.store';
import { isProfileReadyForRecommend } from '@/utils/profileCompleteness';
import '@/styles/home.css';

export function HomePage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const showHero = !isAuthenticated || !isProfileReadyForRecommend(user);
  const { showBriefing, closeBriefing } = useDailyBriefing();

  return (
    <div className="home-page">
      <DailyBriefingModal open={showBriefing} onClose={closeBriefing} />
      {showHero && <HomeHero isAuthenticated={isAuthenticated} />}

      {isAuthenticated && (
        <div className="home-gym-selector">
          <GymSelector />
        </div>
      )}

      <section className="home-search-section" aria-label={t('pages.home.quickActionsLabel')}>
        <QuickSearchBar />
      </section>

      <InstallPromptBanner />

      {isAuthenticated && <ProfileIncompleteBanner />}
      {isAuthenticated && <RecentMachinesRow />}
      {isAuthenticated && <FavoriteMachinesRow />}
    </div>
  );
}
