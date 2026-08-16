import { useEffect, useRef, useState } from 'react';
import { adEventBus } from '@/ads/adEventBus';
import { useAdDecisionRequest } from '@/ads/AdSlot';
import { bumpNavCount, bumpWorkoutCompleteCount, shouldDedupe } from '@/ads/adSession';
import '@/styles/ads.css';

/**
 * Global hosts for interstitial / sticky / rewarded (flag-gated via server decision).
 * Failures never block navigation.
 */
export function AdRuntimeHosts() {
  const interstitial = useAdDecisionRequest();
  const sticky = useAdDecisionRequest();
  const rewarded = useAdDecisionRequest();

  const interstitialRef = useRef(interstitial);
  const stickyRef = useRef(sticky);
  const rewardedRef = useRef(rewarded);
  interstitialRef.current = interstitial;
  stickyRef.current = sticky;
  rewardedRef.current = rewarded;

  const [stickyProbed, setStickyProbed] = useState(false);

  useEffect(() => {
    return adEventBus.subscribe((payload) => {
      const key = `${payload.placement}:${payload.event ?? ''}:${payload.eventCount ?? 0}`;
      if (shouldDedupe(`bus:${key}`, 1200)) return;

      if (payload.placement === 'PAGE_TRANSITION') {
        const count = payload.eventCount ?? bumpNavCount();
        void interstitialRef.current.request('PAGE_TRANSITION', 'PAGE_TRANSITION', count);
        return;
      }
      if (payload.placement === 'WORKOUT_COMPLETE') {
        const count = payload.eventCount ?? bumpWorkoutCompleteCount();
        void interstitialRef.current.request('WORKOUT_COMPLETE', 'WORKOUT_COMPLETE', count);
        return;
      }
      if (payload.placement === 'GLOBAL_STICKY_BOTTOM') {
        void stickyRef.current.request('GLOBAL_STICKY_BOTTOM', payload.event);
        return;
      }
      if (payload.placement === 'LIMIT_REACHED') {
        void rewardedRef.current.request('LIMIT_REACHED', 'FREE_LIMIT_REACHED');
      }
    });
  }, []);

  useEffect(() => {
    if (stickyProbed) return;
    setStickyProbed(true);
    void stickyRef.current.request('GLOBAL_STICKY_BOTTOM', 'PAGE_VIEW');
  }, [stickyProbed]);

  return (
    <>
      {sticky.open && sticky.decision?.show ? (
        <div className="ad-sticky" data-nosnippet role="complementary" aria-label="Ad">
          <div className="ad-sticky__inner">
            <p className="ad-sticky__title">
              {sticky.decision.creative?.kind === 'mock'
                ? sticky.decision.creative.title
                : 'Sponsored'}
            </p>
            <button type="button" className="ad-sticky__close" onClick={sticky.close}>
              ×
            </button>
          </div>
        </div>
      ) : null}

      {interstitial.open && interstitial.decision?.show ? (
        <div
          className="ad-interstitial"
          role="dialog"
          aria-modal="true"
          data-nosnippet
        >
          <div className="ad-interstitial__card">
            <p className="ad-interstitial__eyebrow">Sponsored</p>
            <h2 className="ad-interstitial__title">
              {interstitial.decision.creative?.kind === 'mock'
                ? interstitial.decision.creative.title
                : 'Ad'}
            </h2>
            <p className="ad-interstitial__body">
              {interstitial.decision.creative?.kind === 'mock'
                ? interstitial.decision.creative.body
                : ''}
            </p>
            <button type="button" className="btn btn--primary" onClick={interstitial.close}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {rewarded.open && rewarded.decision?.show ? (
        <div className="ad-interstitial" role="dialog" aria-modal="true" data-nosnippet>
          <div className="ad-interstitial__card">
            <p className="ad-interstitial__eyebrow">Rewarded ad</p>
            <h2 className="ad-interstitial__title">Watch an ad for more uses?</h2>
            <p className="ad-interstitial__body">
              Quota unlock is not enabled yet. You can upgrade to Premium instead.
            </p>
            <div className="ad-interstitial__actions">
              <button type="button" className="btn btn--secondary" onClick={rewarded.close}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
