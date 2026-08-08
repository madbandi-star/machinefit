import type { ReactNode } from 'react';
import { FortuneReveal } from '@/components/fortune/FortuneReveal';

interface FortuneSectionProps {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  delayMs?: number;
  tone?: 'fortune' | 'data' | 'action';
  className?: string;
}

export function FortuneSection({
  eyebrow,
  title,
  children,
  delayMs = 0,
  tone = 'fortune',
  className = '',
}: FortuneSectionProps) {
  return (
    <FortuneReveal
      className={`fr-section fr-section--${tone}${className ? ` ${className}` : ''}`}
      delayMs={delayMs}
    >
      <header className="fr-section__head">
        {eyebrow ? <p className="fr-section__eyebrow">{eyebrow}</p> : null}
        <h2 className="fr-section__title">{title}</h2>
      </header>
      <div className="fr-section__body">{children}</div>
    </FortuneReveal>
  );
}
