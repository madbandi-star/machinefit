import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settings.store';

export function ThemeSwitch() {
  const { t } = useTranslation('common');
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className="theme-switch" role="group" aria-label={t('settings.theme')}>
      <button
        type="button"
        className={`theme-switch__option${theme === 'light' ? ' theme-switch__option--active' : ''}`}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
      >
        {t('settings.themeLight')}
      </button>
      <button
        type="button"
        className={`theme-switch__option${theme === 'dark' ? ' theme-switch__option--active' : ''}`}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
      >
        {t('settings.themeDark')}
      </button>
    </div>
  );
}
