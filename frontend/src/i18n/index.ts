import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@machinefit/shared';

import ko from './locales/ko/common.json';
import koMachines from './locales/ko/machines.json';
import koGyms from './locales/ko/gyms.json';
import koCommunity from './locales/ko/community.json';
import koNotifications from './locales/ko/notifications.json';
import koAdmin from './locales/ko/admin.json';
import koTrade from './locales/ko/trade.json';
import koOnlinePt from './locales/ko/online-pt.json';
import koPush from './locales/ko/push.json';
import koFriends from './locales/ko/friends.json';
import koEquipment from './locales/ko/equipment.json';
import koFortune from './locales/ko/fortune.json';

type NamespaceBundle = Record<string, unknown>;

const NS_LIST = [
  'common',
  'machines',
  'gyms',
  'community',
  'notifications',
  'admin',
  'trade',
  'online-pt',
  'push',
  'friends',
  'equipment',
  'fortune',
] as const;

const loadedLocales = new Set<string>([DEFAULT_LOCALE]);
const missingKeyWarned = new Set<string>();

const isDev =
  typeof import.meta !== 'undefined' &&
  Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

function warnMissing(lngs: readonly string[], ns: string, key: string): void {
  if (!isDev) return;
  const lang = lngs[0] ?? '?';
  const id = `${lang}|${ns}|${key}`;
  if (missingKeyWarned.has(id)) return;
  missingKeyWarned.add(id);
  // eslint-disable-next-line no-console
  console.warn(`[Missing Translation] ${ns}.${key} language=${lang}`);
}

async function loadLocaleBundles(locale: Locale): Promise<Record<string, NamespaceBundle>> {
  switch (locale) {
    case 'en': {
      const [
        common,
        machines,
        gyms,
        community,
        notifications,
        admin,
        trade,
        onlinePt,
        push,
        friends,
        equipment,
        fortune,
      ] = await Promise.all([
        import('./locales/en/common.json'),
        import('./locales/en/machines.json'),
        import('./locales/en/gyms.json'),
        import('./locales/en/community.json'),
        import('./locales/en/notifications.json'),
        import('./locales/en/admin.json'),
        import('./locales/en/trade.json'),
        import('./locales/en/online-pt.json'),
        import('./locales/en/push.json'),
        import('./locales/en/friends.json'),
        import('./locales/en/equipment.json'),
        import('./locales/en/fortune.json'),
      ]);
      return {
        common: common.default,
        machines: machines.default,
        gyms: gyms.default,
        community: community.default,
        notifications: notifications.default,
        admin: admin.default,
        trade: trade.default,
        'online-pt': onlinePt.default,
        push: push.default,
        friends: friends.default,
        equipment: equipment.default,
        fortune: fortune.default,
      };
    }
    case 'ja': {
      const [
        common,
        machines,
        gyms,
        community,
        notifications,
        admin,
        trade,
        onlinePt,
        push,
        friends,
        equipment,
        fortune,
      ] = await Promise.all([
        import('./locales/ja/common.json'),
        import('./locales/ja/machines.json'),
        import('./locales/ja/gyms.json'),
        import('./locales/ja/community.json'),
        import('./locales/ja/notifications.json'),
        import('./locales/ja/admin.json'),
        import('./locales/ja/trade.json'),
        import('./locales/ja/online-pt.json'),
        import('./locales/ja/push.json'),
        import('./locales/ja/friends.json'),
        import('./locales/ja/equipment.json'),
        import('./locales/ja/fortune.json'),
      ]);
      return {
        common: common.default,
        machines: machines.default,
        gyms: gyms.default,
        community: community.default,
        notifications: notifications.default,
        admin: admin.default,
        trade: trade.default,
        'online-pt': onlinePt.default,
        push: push.default,
        friends: friends.default,
        equipment: equipment.default,
        fortune: fortune.default,
      };
    }
    case 'zh': {
      const [
        common,
        machines,
        gyms,
        community,
        notifications,
        admin,
        trade,
        onlinePt,
        push,
        friends,
        equipment,
        fortune,
      ] = await Promise.all([
        import('./locales/zh/common.json'),
        import('./locales/zh/machines.json'),
        import('./locales/zh/gyms.json'),
        import('./locales/zh/community.json'),
        import('./locales/zh/notifications.json'),
        import('./locales/zh/admin.json'),
        import('./locales/zh/trade.json'),
        import('./locales/zh/online-pt.json'),
        import('./locales/zh/push.json'),
        import('./locales/zh/friends.json'),
        import('./locales/zh/equipment.json'),
        import('./locales/zh/fortune.json'),
      ]);
      return {
        common: common.default,
        machines: machines.default,
        gyms: gyms.default,
        community: community.default,
        notifications: notifications.default,
        admin: admin.default,
        trade: trade.default,
        'online-pt': onlinePt.default,
        push: push.default,
        friends: friends.default,
        equipment: equipment.default,
        fortune: fortune.default,
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
        trade: koTrade,
        'online-pt': koOnlinePt,
        push: koPush,
        friends: koFriends,
        equipment: koEquipment,
        fortune: koFortune,
      };
  }
}

/** Ensure locale JSON is registered before changeLanguage (keeps switching correct). */
export async function ensureLocaleResources(locale: string): Promise<void> {
  const normalized = (locale.split('-')[0] || DEFAULT_LOCALE) as Locale;
  if (!LOCALES.includes(normalized)) return;
  if (loadedLocales.has(normalized)) return;

  const bundles = await loadLocaleBundles(normalized);
  for (const [ns, resources] of Object.entries(bundles)) {
    i18n.addResourceBundle(normalized, ns, resources, true, true);
  }
  loadedLocales.add(normalized);
}

/**
 * Fallback chain: current language → English → Korean.
 * Never render an empty string for a missing key.
 */
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
        trade: koTrade,
        'online-pt': koOnlinePt,
        push: koPush,
        friends: koFriends,
        equipment: koEquipment,
        fortune: koFortune,
      },
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: {
      ja: ['en', 'ko'],
      zh: ['en', 'ko'],
      en: ['ko'],
      default: ['en', 'ko'],
    },
    supportedLngs: [...LOCALES],
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    ns: [...NS_LIST],
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    returnNull: false,
    parseMissingKeyHandler: (key) => key,
    missingKeyHandler: (lngs, ns, key) => {
      warnMissing(lngs, ns, key);
    },
    saveMissing: isDev,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    partialBundledLanguages: true,
  });

export default i18n;
