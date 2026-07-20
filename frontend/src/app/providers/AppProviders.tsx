import { useEffect, type ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toast } from '@/components/feedback/Toast/Toast';
import { API_BASE_URL } from '@/services/http/axios-client';
import '@/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Render free instances still sleep; this one-shot ping just reduces cold-start pain.
    void fetch(`${API_BASE_URL}/health`, { method: 'GET' }).catch(() => undefined);
  }, []);

  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider>
          {children}
          <Toast />
        </ThemeProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
