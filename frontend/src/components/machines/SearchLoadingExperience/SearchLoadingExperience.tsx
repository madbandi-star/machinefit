import { useEffect, useState } from 'react';
import { MACHINE_SEARCH_LOADING_TIPS } from '@/constants/machineSearchLoadingTips';
import './SearchLoadingExperience.css';

const TIP_ROTATE_MS = 3_500;

export interface SearchLoadingExperienceProps {
  progress: number;
  stageLabel: string;
  /** Optional brand mark — defaults to MACHINE FIT */
  brandLabel?: string;
}

export function SearchLoadingExperience({
  progress,
  stageLabel,
  brandLabel = 'MACHINE FIT',
}: SearchLoadingExperienceProps) {
  const tipCount = MACHINE_SEARCH_LOADING_TIPS.length;
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * tipCount));
  const [tipVisible, setTipVisible] = useState(true);

  useEffect(() => {
    if (tipCount <= 1) return;
    let fadeTimer: number | undefined;
    const rotateTimer = window.setInterval(() => {
      setTipVisible(false);
      fadeTimer = window.setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % tipCount);
        setTipVisible(true);
      }, 180);
    }, TIP_ROTATE_MS);
    return () => {
      window.clearInterval(rotateTimer);
      if (fadeTimer != null) window.clearTimeout(fadeTimer);
    };
  }, [tipCount]);

  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const tip = MACHINE_SEARCH_LOADING_TIPS[tipIndex] ?? MACHINE_SEARCH_LOADING_TIPS[0]!;

  return (
    <div
      className="search-loading-xp"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="search-loading-xp__brand">{brandLabel}</p>
      <p className="search-loading-xp__headline">검색 데이터를 준비하고 있습니다</p>

      <div className="search-loading-xp__progress-row">
        <div
          className="search-loading-xp__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamped}
          aria-label={stageLabel}
        >
          <div
            className="search-loading-xp__fill"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="search-loading-xp__pct" aria-hidden="true">
          {clamped}%
        </span>
      </div>

      <p className="search-loading-xp__stage">{stageLabel}</p>

      <div className="search-loading-xp__divider" aria-hidden="true" />

      <div className="search-loading-xp__tip">
        <p className="search-loading-xp__tip-label">MACHINE FIT TIP</p>
        <p
          className={`search-loading-xp__tip-text${tipVisible ? ' is-visible' : ''}`}
          key={tipIndex}
        >
          {tip}
        </p>
        <p className="search-loading-xp__tip-index" aria-hidden="true">
          {tipIndex + 1} / {tipCount}
        </p>
      </div>
    </div>
  );
}
