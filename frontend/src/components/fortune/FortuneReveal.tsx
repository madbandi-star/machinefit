import type { CSSProperties, ReactNode } from 'react';
import { useRevealOnView } from '@/hooks/useRevealOnView';

interface FortuneRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

export function FortuneReveal({
  children,
  className = '',
  delayMs = 0,
}: FortuneRevealProps) {
  const { ref, visible } = useRevealOnView<HTMLDivElement>();
  const style: CSSProperties | undefined = delayMs
    ? ({ ['--fortune-reveal-delay' as string]: `${delayMs}ms` } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      className={`fortune-reveal${visible ? ' fortune-reveal--visible' : ''}${
        className ? ` ${className}` : ''
      }`}
      style={style}
    >
      {children}
    </div>
  );
}
