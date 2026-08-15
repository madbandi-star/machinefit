import {
  absoluteAppUrl,
  formatDocumentTitle,
  SEO_DEFAULT_IMAGE,
  SEO_SITE_NAME,
  SEO_THEME_COLOR,
  type PageSeoInput,
  type SeoRobots,
} from '@/seo/siteSeo';

const JSON_LD_ID = 'mf-seo-json-ld';

function upsertMeta(
  attr: 'name' | 'property',
  key: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data: PageSeoInput['jsonLd']): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(JSON_LD_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  const payload = (Array.isArray(data) ? data : [data]).map((item) => {
    const { ['@context']: _ctx, ...rest } = item as Record<string, unknown>;
    return rest;
  });
  const script =
    (existing as HTMLScriptElement | null) ?? document.createElement('script');
  script.id = JSON_LD_ID;
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': payload,
  });
  if (!existing) document.head.appendChild(script);
}

/**
 * Apply document head SEO tags. Safe to call on every route change.
 * Does not alter visible UI.
 */
export function applyPageSeo(input: PageSeoInput): void {
  if (typeof document === 'undefined') return;

  const title = formatDocumentTitle(input.title, input.titleAbsolute);
  const description = input.description.trim().slice(0, 320);
  const url = absoluteAppUrl(input.path);
  const robots: SeoRobots = input.robots ?? 'index,follow';
  const image = (input.image || SEO_DEFAULT_IMAGE).trim();
  const ogType = input.type ?? 'website';

  document.title = title;

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots);
  upsertMeta('name', 'googlebot', robots);
  upsertMeta('name', 'theme-color', SEO_THEME_COLOR);

  upsertLink('canonical', url);

  upsertMeta('property', 'og:site_name', SEO_SITE_NAME);
  upsertMeta('property', 'og:type', ogType);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:locale', document.documentElement.lang === 'en' ? 'en_US' : 'ko_KR');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image);

  setJsonLd(input.jsonLd ?? null);
}
