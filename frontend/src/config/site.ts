import { SITE_APP_URL, SITE_DOMAIN, SITE_URL } from '@machinefit/shared';

export { SITE_APP_URL, SITE_DOMAIN, SITE_URL };

/**
 * Canonical URL for app / invite / marketing shares.
 * Prefers `VITE_PUBLIC_SITE_URL`, otherwise machine-fit.com + Vite base path.
 */
export function getMarketingShareUrl(): string {
  const override = String(import.meta.env.VITE_PUBLIC_SITE_URL ?? '').trim();
  if (override) {
    return override.replace(/\/+$/, '') + '/';
  }
  const base = String(import.meta.env.BASE_URL ?? '/');
  const path = base.startsWith('/') ? base : `/${base}`;
  return `${SITE_URL}${path}`.replace(/\/+$/, '/');
}
