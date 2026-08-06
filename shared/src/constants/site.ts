/** Canonical marketing domain (Cloudflare). */
export const SITE_DOMAIN = 'machine-fit.com';

/** Canonical marketing origin (https, no trailing slash). */
export const SITE_URL = `https://${SITE_DOMAIN}`;

/**
 * Published app base path while the frontend still uses Vite `base: /machinefit/`.
 * Invite / share deep links append under this path.
 */
export const SITE_APP_BASE_PATH = '/machinefit';

/** Full app URL without trailing slash — default for invites & marketing shares. */
export const SITE_APP_URL = `${SITE_URL}${SITE_APP_BASE_PATH}`;
