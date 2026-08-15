import { absoluteAppUrl, SEO_SITE_NAME, SITE_URL } from '@/seo/siteSeo';

export type BreadcrumbItem = { name: string; path: string };

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_SITE_NAME,
    url: SITE_URL,
    logo: absoluteAppUrl('/icon-512.png'),
    sameAs: [] as string[],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_SITE_NAME,
    url: absoluteAppUrl('/'),
    inLanguage: ['ko', 'en'],
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
      url: absoluteAppUrl('/'),
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
