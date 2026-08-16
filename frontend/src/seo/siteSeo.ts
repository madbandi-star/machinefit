/**
 * Production SEO helpers for the Vite SPA (GitHub Pages base `/machinefit/`).
 *
 * Brand:
 * - KO: 머신핏
 * - EN: MachineFit / MACHINE FIT
 * - Marketing origin (preferred brand URL): https://machine-fit.com/
 * - App deep links: https://machine-fit.com/machinefit/...
 *
 * Cloudflare should URL-Rewrite `/` → `/machinefit/` (200) instead of 301,
 * so the marketing origin and home canonical stay aligned for Naver/Google.
 */
import { SITE_APP_URL, SITE_DOMAIN, SITE_URL } from '@machinefit/shared';

/** Official Korean brand name (primary for titles / OG site_name). */
export const SEO_SITE_NAME = '머신핏';

/** Official English brand name. */
export const SEO_SITE_NAME_EN = 'MachineFit';

/** Combined display when both languages help disambiguation. */
export const SEO_SITE_NAME_FULL = '머신핏(MachineFit)';

export const SEO_THEME_COLOR = '#000000';

/** Home document title — Korean brand first, concise product phrase. */
export const SEO_HOME_TITLE = '머신핏 - 헬스장 운동기구 운동 기록 서비스';

/** Home meta description — factual product summary with brand + core terms. */
export const SEO_HOME_DESCRIPTION =
  '머신핏(MACHINE FIT)은 헬스장 머신·운동기구와 프리웨이트·맨몸운동을 기록하고 운동량·볼륨을 분석하는 피트니스 서비스입니다.';

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
  /** When true, do not append " | 머신핏" if already present. */
  titleAbsolute?: boolean;
};

/**
 * Build absolute canonical URL for an in-app path (basename-aware).
 * Home (`/`) uses the marketing origin https://machine-fit.com/ so brand search
 * resolves to the primary domain (requires Cloudflare rewrite, not 301).
 */
export function absoluteAppUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean === '/') return `${SITE_URL}/`;
  return `${SITE_APP_URL}${clean}`.replace(/\/+$/, '');
}

/** True when title already contains the brand (KO or EN). */
export function titleIncludesBrand(title: string): boolean {
  return /머신핏|machinefit|machine fit/i.test(title);
}

export function formatDocumentTitle(title: string, absolute = false): string {
  const trimmed = title.trim();
  if (absolute || titleIncludesBrand(trimmed)) return trimmed;
  return `${trimmed} | ${SEO_SITE_NAME}`;
}

export function stripQueryAndHash(pathWithSearch: string): string {
  const noHash = pathWithSearch.split('#')[0] ?? pathWithSearch;
  const noQuery = noHash.split('?')[0] ?? noHash;
  if (!noQuery || noQuery === '') return '/';
  return noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
}

export { SITE_APP_URL, SITE_DOMAIN, SITE_URL };
