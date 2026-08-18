import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { adEventBus } from '@/ads/adEventBus';
import { bumpNavCount, shouldDedupe } from '@/ads/adSession';
import { trackPageView } from '@/utils/opsTelemetry';
import { trackUsageForPath } from '@/utils/usageTelemetry';
import { startPagePerf } from '@/utils/pagePerformance';

/** Maps location changes to ops page_view events + selective usage tracking. */
export function OpsTelemetryBridge() {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    const pathKey = `${location.pathname}${location.search ? '?…' : ''}`.slice(0, 200);
    startPagePerf(pathKey);
    trackPageView(pathKey, { entrance: first.current });
    trackUsageForPath(location.pathname);

    if (!first.current) {
      const count = bumpNavCount();
      const dedupeKey = `nav:${pathKey}:${count}`;
      if (!shouldDedupe(dedupeKey, 800)) {
        adEventBus.emit({
          placement: 'PAGE_TRANSITION',
          event: 'PAGE_TRANSITION',
          eventCount: count,
        });
      }
    }
    first.current = false;
  }, [location.pathname, location.search]);

  return null;
}
