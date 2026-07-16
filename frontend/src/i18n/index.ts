import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LOCALE } from '@machinefit/shared';

import ko from './locales/ko/common.json';
import en from './locales/en/common.json';
import ja from './locales/ja/common.json';
import zh from './locales/zh/common.json';

import koMachines from './locales/ko/machines.json';
import enMachines from './locales/en/machines.json';
import koGyms from './locales/ko/gyms.json';
import enGyms from './locales/en/gyms.json';
import koCommunity from './locales/ko/community.json';
import enCommunity from './locales/en/community.json';
import koNotifications from './locales/ko/notifications.json';
import enNotifications from './locales/en/notifications.json';
import koAdmin from './locales/ko/admin.json';
import enAdmin from './locales/en/admin.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { common: ko, machines: koMachines, gyms: koGyms, community: koCommunity, notifications: koNotifications, admin: koAdmin },
      en: { common: en, machines: enMachines, gyms: enGyms, community: enCommunity, notifications: enNotifications, admin: enAdmin },
      ja: { common: ja, machines: enMachines, gyms: enGyms, community: enCommunity, notifications: enNotifications, admin: enAdmin },
      zh: { common: zh, machines: enMachines, gyms: enGyms, community: enCommunity, notifications: enNotifications, admin: enAdmin },
    },
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
