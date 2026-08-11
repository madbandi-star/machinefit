import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/opsTelemetry';
import { trackUsageForPath } from '@/utils/usageTelemetry';

/** Maps location changes to ops page_view events + selective usage tracking. */
export function OpsTelemetryBridge() {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    const pathKey = `${location.pathname}${location.search ? '?…' : ''}`.slice(0, 200);
    trackPageView(pathKey, { entrance: first.current });
    trackUsageForPath(location.pathname);
    first.current = false;
  }, [location.pathname, location.search]);

  return null;
}
