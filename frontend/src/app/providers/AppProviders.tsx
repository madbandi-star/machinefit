import { useEffect, type ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toast } from '@/components/feedback/Toast/Toast';
import { PremiumUpgradeModalGlobal } from '@/components/premium/PremiumUpgradeModal/PremiumUpgradeModal';
import { API_BASE_URL } from '@/services/http/axios-client';
import '@/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Render free instances still sleep; warm pool + reduce cold-start pain.
    void fetch(`${API_BASE_URL}/warmup`, { method: 'GET' }).catch(() =>
      fetch(`${API_BASE_URL}/health`, { method: 'GET' }).catch(() => undefined)
    );
  }, []);

  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider>
          {children}
          <Toast />
          <PremiumUpgradeModalGlobal />
        </ThemeProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
