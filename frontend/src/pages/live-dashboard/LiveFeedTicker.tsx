import { useEffect, useState } from 'react';
import type { LiveFeedItem } from '@machinefit/shared';

const HOLD_MS = 3200;
const SLIDE_MS = 380;

type Props = {
  items: LiveFeedItem[];
  emptyLabel: string;
};

/**
 * One feed line at a time — snaps to the next on a steady live beat.
 */
export function LiveFeedTicker({ items, emptyLabel }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'idle' | 'out'>('idle');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
    setPhase('idle');
  }, [items]);

  useEffect(() => {
    if (paused || items.length <= 1) return;

    let cancelled = false;
    let holdTimer = 0;
    let outTimer = 0;
    let inTimer = 0;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const schedule = () => {
      holdTimer = window.setTimeout(() => {
        if (cancelled) return;
        if (reduceMotion) {
          setIndex((i) => (i + 1) % items.length);
          schedule();
          return;
        }
        setPhase('out');
        outTimer = window.setTimeout(() => {
          if (cancelled) return;
          setIndex((i) => (i + 1) % items.length);
          setPhase('in');
          inTimer = window.setTimeout(() => {
            if (cancelled) return;
            setPhase('idle');
            schedule();
          }, SLIDE_MS);
        }, SLIDE_MS);
      }, HOLD_MS);
    };

    schedule();

    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
      window.clearTimeout(outTimer);
      window.clearTimeout(inTimer);
    };
  }, [items, paused]);

  const current = items[index];
  const label = current ? `${current.emoji} ${current.text}` : emptyLabel;

  return (
    <div
      className="live-ticker glass"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
    >
      <span className="live-ticker__badge pulse" aria-hidden>
        <span className="live-badge__dot" />
        LIVE
      </span>
      <div className="live-ticker__viewport" aria-live="polite" aria-atomic="true">
        <p
          key={current?.id ?? 'empty'}
          className={`live-ticker__line live-ticker__line--${phase}${current ? '' : ' is-empty'}`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
