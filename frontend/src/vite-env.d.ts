/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __MF_DEMO_PASSWORD__: string;
declare const __MF_APP_VERSION__: string;
declare const __MF_BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** When "true", show fixed demo password UX. Defaults off in production builds. */
  readonly VITE_DEMO_AUTH?: string;
  readonly VITE_APP_VERSION?: string;
  /** Google Identity Services client ID (web). */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Kakao JavaScript key. */
  readonly VITE_KAKAO_JS_KEY?: string;
  /** Apple Services ID (web). */
  readonly VITE_APPLE_CLIENT_ID?: string;
  /** Apple Sign In redirect URI (must match Apple Developer config). */
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
