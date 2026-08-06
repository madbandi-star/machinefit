/** Canonical marketing domain (Cloudflare). */
export const SITE_DOMAIN = 'machine-fit.com';

/** Canonical marketing origin (https, no trailing slash). */
export const SITE_URL = `https://${SITE_DOMAIN}`;

/**
 * Published app base path (Vite `base: /` on custom domain).
 * Empty string — app is served at the domain root.
 */
export const SITE_APP_BASE_PATH = '';

/** Full app URL without trailing slash — default for invites & marketing shares. */
export const SITE_APP_URL = SITE_URL;
