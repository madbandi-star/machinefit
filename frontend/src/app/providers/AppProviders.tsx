import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toast } from '@/components/feedback/Toast/Toast';
import '@/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
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
