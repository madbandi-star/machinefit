import { useEffect, type ReactNode } from 'react';

const THEME_COLOR_META = 'theme-color';
const APP_THEME = 'dark';

function setThemeColorMeta(color: string) {
  let meta = document.querySelector(`meta[name="${THEME_COLOR_META}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', THEME_COLOR_META);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

/** App currently supports dark theme only. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', APP_THEME);

    const rootStyle = getComputedStyle(document.documentElement);
    const themeColor = rootStyle.getPropertyValue('--theme-color-meta').trim();
    if (themeColor) {
      setThemeColorMeta(themeColor);
    }
  }, []);

  return <>{children}</>;
}
