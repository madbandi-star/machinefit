import { useEffect, type ReactNode } from 'react';
import { useSettingsStore } from '@/store/settings.store';

const THEME_COLOR_META = 'theme-color';

function setThemeColorMeta(color: string) {
  let meta = document.querySelector(`meta[name="${THEME_COLOR_META}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', THEME_COLOR_META);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    const rootStyle = getComputedStyle(document.documentElement);
    const themeColor = rootStyle.getPropertyValue('--theme-color-meta').trim();
    if (themeColor) {
      setThemeColorMeta(themeColor);
    }
  }, [theme]);

  return <>{children}</>;
}
