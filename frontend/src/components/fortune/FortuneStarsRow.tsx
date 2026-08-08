import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface FortuneStarsRowProps {
  scoreStars: number;
  label: string;
}

export function FortuneStarsRow({ scoreStars, label }: FortuneStarsRowProps) {
  const reduced = usePrefersReducedMotion();
  const filled = Math.min(5, Math.max(0, Math.round(scoreStars)));
  const [visibleCount, setVisibleCount] = useState(reduced ? 5 : 0);

  useEffect(() => {
    if (reduced) {
      setVisibleCount(5);
      return;
    }
    setVisibleCount(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setVisibleCount(n);
      if (n >= 5) window.clearInterval(id);
    }, 110);
    return () => window.clearInterval(id);
  }, [filled, reduced]);

  return (
    <div className="fortune-stars" aria-label={`${label} ${filled} / 5`}>
      <p className="fortune-stars__label">
        <span aria-hidden>🔥</span> {label}
      </p>
      <div className="fortune-stars__row" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => {
          const on = i < filled;
          const shown = i < visibleCount;
          return (
            <span
              key={i}
              className={`fortune-stars__star${on ? ' fortune-stars__star--on' : ''}${
                shown ? ' fortune-stars__star--shown' : ''
              }`}
            >
              {on ? '★' : '☆'}
            </span>
          );
        })}
      </div>
      <p className="fortune-stars__meta">
        {filled} / 5
      </p>
    </div>
  );
}
