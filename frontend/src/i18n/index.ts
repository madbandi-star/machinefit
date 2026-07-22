import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LOCALE, type Locale } from '@machinefit/shared';

import ko from './locales/ko/common.json';
import koMachines from './locales/ko/machines.json';
import koGyms from './locales/ko/gyms.json';
import koCommunity from './locales/ko/community.json';
import koNotifications from './locales/ko/notifications.json';
import koAdmin from './locales/ko/admin.json';

type NamespaceBundle = Record<string, unknown>;

const loadedLocales = new Set<string>([DEFAULT_LOCALE]);

async function loadLocaleBundles(locale: Locale): Promise<Record<string, NamespaceBundle>> {
  switch (locale) {
    case 'en': {
      const [common, machines, gyms, community, notifications, admin] = await Promise.all([
        import('./locales/en/common.json'),
        import('./locales/en/machines.json'),
        import('./locales/en/gyms.json'),
        import('./locales/en/community.json'),
        import('./locales/en/notifications.json'),
        import('./locales/en/admin.json'),
      ]);
      return {
        common: common.default,
        machines: machines.default,
        gyms: gyms.default,
        community: community.default,
        notifications: notifications.default,
        admin: admin.default,
      };
    }
    case 'ja': {
      const [common, enMachines, enGyms, enCommunity, enNotifications, enAdmin] = await Promise.all([
        import('./locales/ja/common.json'),
        import('./locales/en/machines.json'),
        import('./locales/en/gyms.json'),
        import('./locales/en/community.json'),
        import('./locales/en/notifications.json'),
        import('./locales/en/admin.json'),
      ]);
      return {
        common: common.default,
        machines: enMachines.default,
        gyms: enGyms.default,
        community: enCommunity.default,
        notifications: enNotifications.default,
        admin: enAdmin.default,
      };
    }
    case 'zh': {
      const [common, enMachines, enGyms, enCommunity, enNotifications, enAdmin] = await Promise.all([
        import('./locales/zh/common.json'),
        import('./locales/en/machines.json'),
        import('./locales/en/gyms.json'),
        import('./locales/en/community.json'),
        import('./locales/en/notifications.json'),
        import('./locales/en/admin.json'),
      ]);
      return {
        common: common.default,
        machines: enMachines.default,
        gyms: enGyms.default,
        community: enCommunity.default,
        notifications: enNotifications.default,
        admin: enAdmin.default,
      };
    }
    case 'ko':
    default:
      return {
        common: ko,
        machines: koMachines,
        gyms: koGyms,
        community: koCommunity,
        notifications: koNotifications,
        admin: koAdmin,
      };
  }
}

/** Ensure locale JSON is registered before changeLanguage (keeps switching correct). */
export async function ensureLocaleResources(locale: string): Promise<void> {
  const normalized = (locale.split('-')[0] || DEFAULT_LOCALE) as Locale;
  if (loadedLocales.has(normalized)) return;

  const bundles = await loadLocaleBundles(normalized);
  for (const [ns, resources] of Object.entries(bundles)) {
    i18n.addResourceBundle(normalized, ns, resources, true, true);
  }
  loadedLocales.add(normalized);
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: {
        common: ko,
        machines: koMachines,
        gyms: koGyms,
        community: koCommunity,
        notifications: koNotifications,
        admin: koAdmin,
      },
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
    partialBundledLanguages: true,
  });

export default i18n;
