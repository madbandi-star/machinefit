import { useEffect, useId, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BannerSlotKey, PublicBanner } from '@machinefit/shared';
import { bannerApi } from '@/api/banner.api';
import { SponsoredBadge } from '@/components/compliance/LegalDisclaimerBanner';
import '@/styles/banners.css';

function sessionId(): string {
  try {
    const key = 'mf_banner_sid';
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const next = `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    sessionStorage.setItem(key, next);
    return next;
  } catch {
    return `s_${Date.now()}`;
  }
}

function trackEvent(
  banner: PublicBanner,
  eventType: 'impression' | 'click'
): void {
  void bannerApi
    .recordEvent({
      bannerId: banner.id,
      slotKey: banner.slotKey,
      eventType,
      sessionId: sessionId(),
    })
    .catch(() => undefined);
}

function resolveHref(url: string): string {
  if (!url) return '#';
  if (url.startsWith('/')) {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
    return `${base}${url}`;
  }
  return url;
}

function isSafeExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

interface BannerSlotProps {
  slot: BannerSlotKey;
  /** Max creatives to show (default 1). */
  maxVisible?: number;
  className?: string;
}

/**
 * Renders active promo banners for a named slot.
 * Content comes from admin DB — no hard-coded creatives.
 */
export function BannerSlot({ slot, maxVisible = 1, className }: BannerSlotProps) {
  const regionId = useId();
  const impressed = useRef(new Set<string>());

  const { data: banners = [] } = useQuery({
    queryKey: ['banners', 'public', slot],
    queryFn: async () => {
      const res = await bannerApi.listPublic(slot);
      return res.data.data?.banners ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const visible = banners.slice(0, Math.max(1, maxVisible));

  useEffect(() => {
    for (const banner of visible) {
      if (impressed.current.has(banner.id)) continue;
      impressed.current.add(banner.id);
      trackEvent(banner, 'impression');
    }
  }, [visible]);

  if (visible.length === 0) return null;

  return (
    <aside
      className={['promo-banner-slot', className].filter(Boolean).join(' ')}
      aria-labelledby={regionId}
      data-slot={slot}
    >
      <div className="promo-banner-slot__label-row">
        <span id={regionId} className="promo-banner-slot__label">
          <SponsoredBadge />
        </span>
      </div>
      <ul className="promo-banner-slot__list">
        {visible.map((banner) => {
          const href = resolveHref(banner.targetUrl);
          const external = isSafeExternal(banner.targetUrl);
          const openNew = banner.openNewWindow && external;
          const desktop = banner.imageUrl;
          const mobile = banner.mobileImageUrl || banner.imageUrl;

          const media = (
            <picture>
              {banner.mobileImageUrl ? (
                <source media="(max-width: 719px)" srcSet={mobile} />
              ) : null}
              <img
                src={desktop}
                alt={banner.name}
                className="promo-banner-slot__img"
                loading="lazy"
                decoding="async"
              />
            </picture>
          );

          return (
            <li key={banner.id} className="promo-banner-slot__item">
              {banner.targetUrl ? (
                <a
                  className="promo-banner-slot__link"
                  href={href}
                  target={openNew ? '_blank' : undefined}
                  rel={openNew ? 'noopener noreferrer sponsored' : undefined}
                  onClick={() => trackEvent(banner, 'click')}
                >
                  {media}
                </a>
              ) : (
                <div className="promo-banner-slot__link promo-banner-slot__link--static">
                  {media}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
