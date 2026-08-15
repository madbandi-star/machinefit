import {
  absoluteAppUrl,
  SEO_SITE_NAME,
  SEO_SITE_NAME_EN,
  SEO_HOME_DESCRIPTION,
  SITE_URL,
} from '@/seo/siteSeo';

export type BreadcrumbItem = { name: string; path: string };

/**
 * Brand / publisher entity. Uses marketing origin (https://machine-fit.com/).
 * Do not invent sameAs / address / phone — only known facts.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_SITE_NAME,
    alternateName: SEO_SITE_NAME_EN,
    url: SITE_URL,
    logo: absoluteAppUrl('/icon-512.png'),
  };
}

/**
 * Site entity. url is marketing origin; app pages live under /machinefit/.
 * No SearchAction — in-app search is not a stable public URL pattern.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_SITE_NAME,
    alternateName: SEO_SITE_NAME_EN,
    url: SITE_URL,
    inLanguage: ['ko', 'en', 'ja', 'zh'],
    publisher: {
      '@type': 'Organization',
      name: SEO_SITE_NAME,
      alternateName: SEO_SITE_NAME_EN,
      url: SITE_URL,
    },
  };
}

/** Primary product as a web application (SPA). */
export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SEO_SITE_NAME,
    alternateName: SEO_SITE_NAME_EN,
    url: absoluteAppUrl('/'),
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    description: SEO_HOME_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteAppUrl(item.path),
    })),
  };
}

export function webPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.name,
    description: input.description,
    url: absoluteAppUrl(input.path),
    isPartOf: {
      '@type': 'WebSite',
      name: SEO_SITE_NAME,
      alternateName: SEO_SITE_NAME_EN,
      url: SITE_URL,
    },
  };
}

export function brandCollectionJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: absoluteAppUrl(input.path),
  };
}

/** Home graph: Organization + WebSite + WebApplication (no duplicates of type beyond this set). */
export function homeBrandJsonLd() {
  return [organizationJsonLd(), websiteJsonLd(), softwareApplicationJsonLd()];
}
