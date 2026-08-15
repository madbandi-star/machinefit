/**
 * Production SEO helpers for the Vite SPA (GitHub Pages base `/machinefit/`).
 * Canonical host: https://machine-fit.com/machinefit/...
 */
import { SITE_APP_URL, SITE_DOMAIN, SITE_URL } from '@machinefit/shared';

export const SEO_SITE_NAME = 'MachineFit';
export const SEO_THEME_COLOR = '#000000';

/** Absolute default OG / Twitter image (exists in public/). */
export const SEO_DEFAULT_IMAGE = `${SITE_APP_URL}/icon-512.png`;

export type SeoRobots = 'index,follow' | 'noindex,nofollow' | 'noindex,follow';

export type PageSeoInput = {
  title: string;
  description: string;
  /** App path beginning with `/`, no query (e.g. `/machines/HS_CHEST_PRESS`). */
  path: string;
  robots?: SeoRobots;
  image?: string | null;
  type?: 'website' | 'article';
  /** JSON-LD object or array; omitted clears previous JSON-LD from this helper. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  /** When true, do not append " | MachineFit" if already present. */
  titleAbsolute?: boolean;
};

/** Build absolute canonical URL for an in-app path (basename-aware). */
export function absoluteAppUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean === '/') return `${SITE_APP_URL}/`;
  return `${SITE_APP_URL}${clean}`.replace(/\/+$/, '');
}

export function formatDocumentTitle(title: string, absolute = false): string {
  const trimmed = title.trim();
  if (absolute || /machinefit/i.test(trimmed)) return trimmed;
  return `${trimmed} | ${SEO_SITE_NAME}`;
}

export function stripQueryAndHash(pathWithSearch: string): string {
  const noHash = pathWithSearch.split('#')[0] ?? pathWithSearch;
  const noQuery = noHash.split('?')[0] ?? noHash;
  if (!noQuery || noQuery === '') return '/';
  return noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
}

export { SITE_APP_URL, SITE_DOMAIN, SITE_URL };
