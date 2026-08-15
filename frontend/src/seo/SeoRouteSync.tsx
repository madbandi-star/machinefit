import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { applyPageSeo } from '@/seo/applyPageSeo';
import { resolveSeoPathPolicy } from '@/seo/routeSeoPolicy';
import {
  SEO_HOME_DESCRIPTION,
  SEO_SITE_NAME,
  stripQueryAndHash,
  titleIncludesBrand,
} from '@/seo/siteSeo';

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
    const defaultTitle = policy.defaultTitle || SEO_SITE_NAME;
    applyPageSeo({
      title: defaultTitle,
      description: policy.defaultDescription || SEO_HOME_DESCRIPTION,
      path,
      robots: policy.robots,
      titleAbsolute: titleIncludesBrand(defaultTitle),
    });
  }, [location.pathname, location.search]);

  return null;
}
