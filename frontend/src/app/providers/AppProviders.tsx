import { useEffect, type ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthHydrationProvider } from './AuthHydrationProvider';
import { HomeBootstrapLoader } from '@/hooks/useHomeBootstrap';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toast } from '@/components/feedback/Toast/Toast';
import { PremiumUpgradeModalGlobal } from '@/components/premium/PremiumUpgradeModal/PremiumUpgradeModal';
import { ServiceUnavailableScreen } from '@/components/feedback/ServiceUnavailableScreen/ServiceUnavailableScreen';
import { PremiumProvider } from '@/providers/PremiumProvider';
import { API_BASE_URL } from '@/services/http/axios-client';
import '@/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Warm Render pool on app boot (Singapore API).
    void fetch(`${API_BASE_URL}/warmup`, { method: 'GET' }).catch(() =>
      fetch(`${API_BASE_URL}/health`, { method: 'GET' }).catch(() => undefined)
    );
  }, []);

  return (
    <QueryProvider>
      <AuthHydrationProvider>
        <HomeBootstrapLoader />
        <I18nProvider>
          <ThemeProvider>
            <PremiumProvider>
              {children}
              <Toast />
              <PremiumUpgradeModalGlobal />
              <ServiceUnavailableScreen />
            </PremiumProvider>
          </ThemeProvider>
        </I18nProvider>
      </AuthHydrationProvider>
    </QueryProvider>
  );
}
