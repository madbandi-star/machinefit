import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import '@/styles/scroll-carousel.css';

type ScrollCarouselProps = {
  children: ReactNode;
  /** Outer wrapper (position: relative). */
  className?: string;
  /** Class on the overflow-x scroll element. */
  scrollerClassName?: string;
  scrollerProps?: Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>;
  /** Scroll distance as a fraction of visible width (default 0.8). */
  scrollRatio?: number;
  /** Hide both chevrons when content does not overflow. */
  hideWhenNoOverflow?: boolean;
};

export function ScrollCarousel({
  children,
  className,
  scrollerClassName,
  scrollerProps,
  scrollRatio = 0.8,
  hideWhenNoOverflow = true,
}: ScrollCarouselProps) {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const hasOverflow = max > 4;
    setOverflow(hasOverflow);
    setCanPrev(hasOverflow && el.scrollLeft > 4);
    setCanNext(hasOverflow && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    const mo = new MutationObserver(() => update());
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', update);

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update, children]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.max(140, el.clientWidth * scrollRatio) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const showButtons = overflow || !hideWhenNoOverflow;

  return (
    <div
      className={['scroll-carousel', className].filter(Boolean).join(' ')}
      data-overflow={overflow ? 'true' : 'false'}
    >
      {showButtons ? (
        <button
          type="button"
          className="scroll-carousel__btn scroll-carousel__btn--prev"
          disabled={!canPrev}
          aria-label={t('carousel.prev')}
          onClick={() => scrollByDir(-1)}
        >
          <Icon name="chevronLeft" size={18} aria-hidden />
        </button>
      ) : null}

      <div
        {...scrollerProps}
        ref={scrollerRef}
        className={['scroll-carousel__scroller', scrollerClassName].filter(Boolean).join(' ')}
      >
        {children}
      </div>

      {showButtons ? (
        <button
          type="button"
          className="scroll-carousel__btn scroll-carousel__btn--next"
          disabled={!canNext}
          aria-label={t('carousel.next')}
          onClick={() => scrollByDir(1)}
        >
          <Icon name="chevronRight" size={18} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
