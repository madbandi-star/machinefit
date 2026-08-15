import { useEffect } from 'react';
import { applyPageSeo } from '@/seo/applyPageSeo';
import type { PageSeoInput } from '@/seo/siteSeo';

/**
 * Declarative page SEO. Renders nothing — updates document head only.
 */
export function Seo(props: PageSeoInput) {
  const { title, description, path, robots, image, type, jsonLd, titleAbsolute } = props;

  useEffect(() => {
    applyPageSeo({
      title,
      description,
      path,
      robots,
      image,
      type,
      jsonLd,
      titleAbsolute,
    });
  }, [title, description, path, robots, image, type, jsonLd, titleAbsolute]);

  return null;
}

/** Imperative helper for pages that already have useEffect blocks. */
export function usePageSeo(input: PageSeoInput | null) {
  useEffect(() => {
    if (!input) return;
    applyPageSeo(input);
  }, [
    input?.title,
    input?.description,
    input?.path,
    input?.robots,
    input?.image,
    input?.type,
    input?.jsonLd,
    input?.titleAbsolute,
  ]);
}
