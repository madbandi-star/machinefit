import { useEffect } from 'react';
import type { ReactNode } from 'react';
import i18n, { ensureLocaleResources } from '@/i18n';
import { useSettingsStore } from '@/store/settings.store';
import { usePersistHydration } from '@/hooks/usePersistHydration';

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSettingsStore((s) => s.locale);
  const hydrated = usePersistHydration(useSettingsStore.persist);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      await ensureLocaleResources(locale);
      if (i18n.language !== locale) {
        await i18n.changeLanguage(locale);
      }
    })();
  }, [hydrated, locale]);

  return <>{children}</>;
}
