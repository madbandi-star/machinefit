import { useEffect } from 'react';
import type { ReactNode } from 'react';
import i18n from '@/i18n';
import { useSettingsStore } from '@/store/settings.store';
import { usePersistHydration } from '@/hooks/usePersistHydration';

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSettingsStore((s) => s.locale);
  const hydrated = usePersistHydration(useSettingsStore.persist);

  useEffect(() => {
    if (!hydrated) return;
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [hydrated, locale]);

  return <>{children}</>;
}
