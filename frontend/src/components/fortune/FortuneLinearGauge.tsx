import { Link } from 'react-router-dom';
import { useCountUp } from '@/hooks/useCountUp';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface FortuneLinearGaugeProps {
  value: number;
  label: string;
  emoji?: string;
  caption?: string;
  tone?: 'pr' | 'recovery';
  animate?: boolean;
  to?: string;
}

export function FortuneLinearGauge({
  value,
  label,
  emoji,
  caption,
  tone = 'pr',
  animate = true,
  to,
}: FortuneLinearGaugeProps) {
  const reduced = usePrefersReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));
  const shown = useCountUp(clamped, 900, animate && !reduced);
  const high = clamped >= 80;

  const className = `fortune-linear fortune-linear--${tone}${
    high && tone === 'pr' ? ' fortune-linear--pr-high' : ''
  }${high && tone === 'recovery' ? ' fortune-linear--recovery-high' : ''}${
    to ? ' fortune-linear--link' : ''
  }`;

  const inner = (
    <>
      <div className="fortune-linear__head">
        <span className="fortune-linear__title">
          {emoji ? (
            <span className="fortune-linear__emoji" aria-hidden>
              {emoji}
            </span>
          ) : null}
          {label}
        </span>
        <strong className="fortune-linear__value">{shown}%</strong>
      </div>
      <div
        className="fortune-linear__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="fortune-linear__fill" style={{ width: `${shown}%` }} />
      </div>
      {caption ? <p className="fortune-linear__caption">{caption}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link className={className} to={to}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
