import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QuickSearchBar } from '@/components/home/QuickSearchBar/QuickSearchBar';
import { ProfileIncompleteBanner } from '@/components/home/ProfileIncompleteBanner/ProfileIncompleteBanner';
import { RecentMachinesRow } from '@/components/home/RecentMachinesRow/RecentMachinesRow';
import { FavoriteMachinesRow } from '@/components/home/FavoriteMachinesRow/FavoriteMachinesRow';
import { MuscleGroupShortcuts } from '@/components/home/MuscleGroupShortcuts/MuscleGroupShortcuts';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner/InstallPromptBanner';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

export function HomePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <PageShell title={t('pages.home.title')} subtitle={t('pages.home.subtitle')}>
      <QuickSearchBar />
      <InstallPromptBanner />
      {!isAuthenticated && (
        <div className="profile-incomplete-banner" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="profile-incomplete-banner__text">
            <strong>{t('pages.home.guestTitle')}</strong>
            {t('pages.home.guestHint')}
          </div>
          <Link
            to={ROUTES.LOGIN}
            state={{ from: location }}
            className="btn btn--primary"
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
    </PageShell>
  );
}
