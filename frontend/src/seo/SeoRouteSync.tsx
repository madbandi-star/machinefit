import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applyPageSeo } from '@/seo/applyPageSeo';
import { resolveSeoPathPolicy } from '@/seo/routeSeoPolicy';
import { stripQueryAndHash } from '@/seo/siteSeo';

/**
 * Applies default SEO for the current route.
 * Page-level <Seo /> overrides run afterwards in child effects.
 * Also keeps <html lang> in sync with the active UI locale.
 */
export function SeoRouteSync() {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = (i18n.language || 'ko').slice(0, 2);
    if (typeof document !== 'undefined') {
      document.documentElement.lang =
        lang === 'en' ? 'en' : lang === 'ja' ? 'ja' : lang === 'zh' ? 'zh' : 'ko';
    }
  }, [i18n.language]);

  useEffect(() => {
    const path = stripQueryAndHash(location.pathname) || '/';
    const policy = resolveSeoPathPolicy(path, location.search);
    applyPageSeo({
      title: policy.defaultTitle || 'MachineFit',
      description:
        policy.defaultDescription ||
        '헬스장 머신 맞춤 세팅과 운동 기록 — MachineFit (machine-fit.com)',
      path,
      robots: policy.robots,
      titleAbsolute: Boolean(policy.defaultTitle?.includes('MachineFit')),
    });
  }, [location.pathname, location.search]);

  return null;
}
