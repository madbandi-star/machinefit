/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __MF_APP_VERSION__: string;
declare const __MF_BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_VERSION?: string;
  /** Optional Sentry DSN (browser). When unset, Sentry stays disabled. */
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
  /** When true, send browser events in Vite dev (default off). */
  readonly VITE_SENTRY_ENABLE_DEV?: string;
  /** Dev-only OAuth fallbacks — production uses GET /auth/oauth/client-config. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_KAKAO_JS_KEY?: string;
  readonly VITE_APPLE_CLIENT_ID?: string;
  readonly VITE_APPLE_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface NavigatorUAData {
  readonly platform: string;
  readonly mobile: boolean;
}

interface Navigator {
  readonly userAgentData?: NavigatorUAData;
}
