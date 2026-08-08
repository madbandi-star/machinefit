import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/** One-shot viewport reveal for fade-up sections. */
export function useRevealOnView<T extends HTMLElement = HTMLDivElement>(
  rootMargin = '0px 0px -8% 0px'
) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, rootMargin]);

  return { ref, visible };
}
