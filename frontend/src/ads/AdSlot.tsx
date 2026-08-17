import { useEffect, useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdDecision, PublicBanner } from '@machinefit/shared';
import { BANNER_SLOT_TO_AD_PLACEMENT } from '@machinefit/shared';
import { adApi } from '@/api/ad.api';
import { bannerApi } from '@/api/banner.api';
import { SponsoredBadge } from '@/components/compliance/LegalDisclaimerBanner';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import { getAdSessionId, shouldDedupe } from '@/ads/adSession';
import '@/styles/banners.css';
import '@/styles/ads.css';

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

interface AdSlotProps {
  placement: string;
  event?: string;
  eventCount?: number;
  maxVisible?: number;
  className?: string;
  /** When true, reserve no space if empty (default). */
  collapseWhenEmpty?: boolean;
}

export function AdSlot({
  placement,
  event,
  eventCount,
  maxVisible = 1,
  className,
}: AdSlotProps) {
  const regionId = useId();
  const impressed = useRef(new Set<string>());
  const authReady = useAuthHydration();
  const viewerId = useAuthStore((s) => s.user?.id ?? null);
  const marketingOptIn = useAuthStore((s) => Boolean(s.user?.marketingOptIn));
  const sessionId = getAdSessionId();
  // Identity for cache: persisted marketingOptIn alone is not enough — a decide
  // fired before JWT restore was cached as "no ad" and stuck across SPA navigations.
  const viewerKey = viewerId ?? 'anon';

  const { data: decision } = useQuery({
    queryKey: [
      'ads',
      'decision',
      placement,
      event ?? '',
      eventCount ?? 0,
      viewerKey,
      marketingOptIn,
    ],
    queryFn: async () => {
      const res = await adApi.decide({
        placement,
        event,
        sessionId,
        eventCount,
      });
      return res.data.data;
    },
    enabled: authReady,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Legacy fallback when migration 140 not applied yet.
  const legacySlot =
    decision?.reason === 'ADS_TABLES_MISSING'
      ? BANNER_SLOT_TO_AD_PLACEMENT[placement]
        ? placement
        : null
      : null;

  const { data: legacyBanners = [] } = useQuery({
    queryKey: ['banners', 'public', 'legacy', legacySlot, viewerKey],
    queryFn: async () => {
      const res = await bannerApi.listPublic(legacySlot!);
      return res.data.data?.banners ?? [];
    },
    enabled: authReady && Boolean(legacySlot) && marketingOptIn,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const banners: PublicBanner[] =
    decision?.show && decision.creative?.kind === 'cms_banner'
      ? (decision.creative.banners ?? []).slice(0, Math.max(1, maxVisible))
      : legacySlot && marketingOptIn
        ? legacyBanners.slice(0, Math.max(1, maxVisible))
        : [];

  const mock =
    decision?.show && decision.creative?.kind === 'mock' ? decision.creative : null;

  useEffect(() => {
    if (!decision?.show || !decision.adType) return;
    const key = `imp:${placement}:${event ?? ''}`;
    if (shouldDedupe(key, 2000)) return;
    if (impressed.current.has(key)) return;
    impressed.current.add(key);
    void adApi
      .track({
        type: 'impression',
        placement,
        event,
        sessionId,
        provider: decision.provider,
        adType: decision.adType,
      })
      .catch(() => undefined);

    // Also keep legacy banner_events for CMS creatives.
    if (decision.creative?.kind === 'cms_banner') {
      for (const b of decision.creative.banners ?? []) {
        void bannerApi
          .recordEvent({
            bannerId: b.id,
            slotKey: b.slotKey,
            eventType: 'impression',
            sessionId,
          })
          .catch(() => undefined);
      }
    }
  }, [decision, placement, event, sessionId]);

  if (banners.length > 0) {
    return (
      <aside
        className={['promo-banner-slot', 'ad-slot', className].filter(Boolean).join(' ')}
        aria-labelledby={regionId}
        data-placement={placement}
        data-nosnippet
      >
        <div className="promo-banner-slot__label-row">
          <span id={regionId} className="promo-banner-slot__label">
            <SponsoredBadge />
          </span>
        </div>
        <ul className="promo-banner-slot__list">
          {banners.map((banner) => {
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
                    onClick={() => {
                      void adApi
                        .track({
                          type: 'click',
                          placement,
                          event,
                          sessionId,
                          provider: decision?.provider ?? 'cms',
                          adType: decision?.adType ?? 'inline_cms',
                        })
                        .catch(() => undefined);
                      void bannerApi
                        .recordEvent({
                          bannerId: banner.id,
                          slotKey: banner.slotKey,
                          eventType: 'click',
                          sessionId,
                        })
                        .catch(() => undefined);
                    }}
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

  if (mock) {
    return (
      <aside
        className={['ad-slot', 'ad-slot--mock', className].filter(Boolean).join(' ')}
        aria-labelledby={regionId}
        data-placement={placement}
        data-nosnippet
      >
        <span id={regionId} className="ad-slot__badge">
          <SponsoredBadge />
        </span>
        <p className="ad-slot__title">{mock.title}</p>
        <p className="ad-slot__body">{mock.body}</p>
      </aside>
    );
  }

  return null;
}

/** Imperative interstitial / rewarded request helper. */
export function useAdDecisionRequest() {
  const [decision, setDecision] = useState<AdDecision | null>(null);
  const [open, setOpen] = useState(false);

  const request = async (placement: string, event?: string, eventCount?: number) => {
    try {
      const res = await adApi.decide({
        placement,
        event,
        sessionId: getAdSessionId(),
        eventCount,
      });
      const data = res.data.data;
      if (!data?.show) {
        setDecision(null);
        setOpen(false);
        return data;
      }
      setDecision(data);
      setOpen(true);
      void adApi
        .track({
          type: 'impression',
          placement,
          event,
          sessionId: getAdSessionId(),
          provider: data.provider,
          adType: data.adType ?? undefined,
        })
        .catch(() => undefined);
      return data;
    } catch {
      setDecision(null);
      setOpen(false);
      return null;
    }
  };

  const close = () => setOpen(false);

  return { decision, open, request, close };
}
