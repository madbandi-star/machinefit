import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EquipmentSlice } from '@/components/fortune/fortuneVisuals';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface EquipmentDonutChartProps {
  slices: EquipmentSlice[];
  empty: boolean;
}

const SIZE = 196;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function EquipmentDonutChart({ slices, empty }: EquipmentDonutChartProps) {
  const { t } = useTranslation('fortune');
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced || empty) {
      setProgress(1);
      return;
    }
    setProgress(0);
    let frame = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const tNorm = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - tNorm) ** 3;
      setProgress(eased);
      if (tNorm < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [slices, empty, reduced]);

  const total = useMemo(
    () => slices.reduce((sum, s) => sum + Math.max(0, s.value), 0),
    [slices]
  );
  const top = useMemo(() => {
    let best = slices[0];
    for (const s of slices) {
      if (s.value > (best?.value ?? -1)) best = s;
    }
    return best;
  }, [slices]);

  if (empty || total <= 0) {
    return (
      <div className="fortune-donut fortune-donut--empty">
        <p className="fortune-donut__empty-title">{t('dataEmptyTitle')}</p>
        <p className="fortune-donut__empty-body">{t('dataEmptyBody')}</p>
      </div>
    );
  }

  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const portion = s.value / total;
      const length = C * portion * progress;
      const gap = C - length;
      const item = {
        ...s,
        dasharray: `${length} ${gap}`,
        dashoffset: -offset,
      };
      offset += C * portion * progress;
      return item;
    });

  return (
    <div className="fortune-donut">
      <div className="fortune-donut__chart">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="color-mix(in srgb, var(--color-border) 55%, transparent)"
            strokeWidth={STROKE}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={arc.dasharray}
              strokeDashoffset={arc.dashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ))}
        </svg>
        <div className="fortune-donut__center">
          <span className="fortune-donut__center-emoji" aria-hidden>
            {top?.emoji}
          </span>
          <strong className="fortune-donut__center-value">{top?.value ?? 0}%</strong>
          <span className="fortune-donut__center-label">
            {top ? t(top.labelKey) : ''}
          </span>
        </div>
      </div>
      <ul className="fortune-donut__legend">
        {slices.map((s) => (
          <li key={s.key}>
            <span aria-hidden>{s.emoji}</span>
            <span>{t(s.labelKey)}</span>
            <strong>{s.value}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
