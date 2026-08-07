import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Maximize2 } from 'lucide-react';
import type { VoiceCoachPhase } from '@/utils/voiceCoach';
import {
  getVoiceCoachDisplayState,
  voiceCoachStatusLabel,
} from '@/utils/voiceCoachDisplay';
import '@/styles/recommendation.css';

export const COUNT_SESSION_SLOT_ID = 'mf-count-session-slot';

interface CountSessionBannerProps {
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  turbo: boolean;
  intensity: number;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop: () => void;
  /** Return to fullscreen overlay when available. */
  onExpand?: () => void;
  /** Prefer home slot when present; otherwise dock above bottom nav. */
  placement?: 'auto' | 'inline' | 'dock';
}

/**
 * Compact running-count chrome (home slot or floating dock).
 * Shown after leaving fullscreen count, or on home when fullscreen is off.
 */
export function CountSessionBanner({
  phase,
  currentRep,
  countdown,
  turbo,
  intensity,
  isPaused = false,
  onPause,
  onResume,
  onStop,
  onExpand,
  placement = 'auto',
}: CountSessionBannerProps) {
  const { t } = useTranslation('machines');
  const display = getVoiceCoachDisplayState(
    phase,
    currentRep,
    countdown,
    turbo,
    intensity,
    t('voiceCoach.oneMoreShort'),
    t('voiceCoach.holdCueShort')
  );

  const slot =
    typeof document !== 'undefined' ? document.getElementById(COUNT_SESSION_SLOT_ID) : null;
  const resolvedPlacement =
    placement === 'auto' ? (slot ? 'inline' : 'dock') : placement;
  const mountNode = resolvedPlacement === 'inline' && slot ? slot : document.body;

  const status = voiceCoachStatusLabel(t, phase, currentRep, countdown);
  const pauseResume =
    onPause && onResume ? (
      <button
        type="button"
        className="btn btn--secondary count-session-banner__btn"
        onClick={isPaused ? onResume : onPause}
      >
        {isPaused ? t('restTimer.resume') : t('restTimer.pause')}
      </button>
    ) : null;

  const banner = (
    <div
      className={`count-session-banner count-session-banner--${resolvedPlacement}${
        turbo || phase === 'hold' ? ' count-session-banner--turbo' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="count-session-banner__content">
        <div className="count-session-banner__meta">
          <span className="count-session-banner__label">
            {t('voiceCoach.title')}
            {isPaused ? ` · ${t('restTimer.paused')}` : ''}
            {turbo ? ` · ${t('voiceCoach.turboBadge')}` : ''}
          </span>
          <span className="count-session-banner__status">{status}</span>
        </div>
        <strong
          className="count-session-banner__value"
          style={
            display.showLiveDisplay
              ? { transform: `scale(${Math.min(display.scale, 1.2)})` }
              : undefined
          }
        >
          {display.showLiveDisplay ? display.displayNumber : '…'}
        </strong>
      </div>
      <div className="count-session-banner__actions">
        {pauseResume}
        {onExpand ? (
          <button
            type="button"
            className="btn btn--secondary count-session-banner__btn"
            onClick={onExpand}
            aria-label={t('restTimer.expand')}
          >
            <Maximize2 size={14} aria-hidden />
            <span>{t('restTimer.expand')}</span>
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--secondary count-session-banner__btn"
          onClick={onStop}
        >
          {t('voiceCoach.stop')}
        </button>
      </div>
    </div>
  );

  return createPortal(banner, mountNode);
}
