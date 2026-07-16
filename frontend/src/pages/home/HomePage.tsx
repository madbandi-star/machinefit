import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeHero } from '@/components/home/HomeHero/HomeHero';
import { QuickSearchBar } from '@/components/home/QuickSearchBar/QuickSearchBar';
import { ProfileIncompleteBanner } from '@/components/home/ProfileIncompleteBanner/ProfileIncompleteBanner';
import { RecentMachinesRow } from '@/components/home/RecentMachinesRow/RecentMachinesRow';
import { FavoriteMachinesRow } from '@/components/home/FavoriteMachinesRow/FavoriteMachinesRow';
import { MuscleGroupShortcuts } from '@/components/home/MuscleGroupShortcuts/MuscleGroupShortcuts';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner/InstallPromptBanner';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import { isProfileReadyForRecommend } from '@/utils/profileCompleteness';
import '@/styles/home.css';

export function HomePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const showHero = !isAuthenticated || !isProfileReadyForRecommend(user);

  return (
    <div className="home-page">
      {showHero && <HomeHero isAuthenticated={isAuthenticated} />}

      <section className="home-search-section">
        <h2 className="home-section__title home-section__title--spaced">
          {t('pages.home.searchSectionTitle')}
        </h2>
        <QuickSearchBar />
      </section>

      <InstallPromptBanner />

      {!isAuthenticated && (
        <div className="profile-incomplete-banner">
          <div className="profile-incomplete-banner__text">
            <strong>{t('pages.home.guestTitle')}</strong>
            {t('pages.home.guestHint')}
          </div>
          <Link
            to={ROUTES.LOGIN}
            state={{ from: location }}
            className="btn btn--secondary"
            style={{ flexShrink: 0 }}
          >
            {t('nav.login')}
          </Link>
        </div>
      )}

      {isAuthenticated && <ProfileIncompleteBanner />}
      {isAuthenticated && <RecentMachinesRow />}
      {isAuthenticated && <FavoriteMachinesRow />}
      <MuscleGroupShortcuts />
    </div>
  );
}
