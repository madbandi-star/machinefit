/**
 * Fixed demo password used only when demo-auth mode is enabled.
 * Production frontend builds replace this with '' via Vite `define`
 * unless VITE_DEMO_AUTH=true is explicitly set.
 */
declare const __MF_DEMO_PASSWORD__: string | undefined;

const defined =
  typeof __MF_DEMO_PASSWORD__ !== 'undefined' ? String(__MF_DEMO_PASSWORD__) : undefined;

export const DEMO_PASSWORD = defined !== undefined ? defined : 'demo1234';
