/**
 * Demo-auth mode: fixed password UX + server may force DEMO_PASSWORD.
 * Production builds default off; override with VITE_DEMO_AUTH=true|false.
 */
export function isDemoAuthEnabled(): boolean {
  const flag = import.meta.env.VITE_DEMO_AUTH;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return !import.meta.env.PROD;
}
