import { useCountUp } from '@/hooks/useCountUp';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface FortuneRadialGaugeProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label: string;
  unit?: string;
  caption?: string;
  emoji?: string;
  tone?: 'primary' | 'pr' | 'recovery';
  animate?: boolean;
}

export function FortuneRadialGauge({
  value,
  max = 100,
  size = 168,
  stroke = 12,
  label,
  unit = '',
  caption,
  emoji,
  tone = 'primary',
  animate = true,
}: FortuneRadialGaugeProps) {
  const reduced = usePrefersReducedMotion();
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const shown = useCountUp(clamped, 950, animate && !reduced);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = shown / safeMax;
  const dashOffset = circumference * (1 - progress);
  const high = clamped >= 90 && tone === 'primary';
  const prHigh = clamped >= 80 && tone === 'pr';
  const recoveryHigh = clamped >= 80 && tone === 'recovery';

  return (
    <div
      className={`fortune-gauge fortune-gauge--${tone}${
        high ? ' fortune-gauge--glow' : ''
      }${prHigh ? ' fortune-gauge--pr-pulse' : ''}${
        recoveryHigh ? ' fortune-gauge--float' : ''
      }`}
    >
      {emoji ? (
        <span className="fortune-gauge__emoji" aria-hidden>
          {emoji}
        </span>
      ) : null}
      <p className="fortune-gauge__label">{label}</p>
      <div className="fortune-gauge__ring-wrap" style={{ width: size, height: size }}>
        <svg
          className="fortune-gauge__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden
        >
          <circle
            className="fortune-gauge__track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
          />
          <circle
            className="fortune-gauge__progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="fortune-gauge__value">
          <span className="fortune-gauge__number">{shown}</span>
          <span className="fortune-gauge__max">
            /{safeMax}
            {unit}
          </span>
        </div>
      </div>
      {caption ? <p className="fortune-gauge__caption">{caption}</p> : null}
    </div>
  );
}
