import { useTranslation } from 'react-i18next';
import type { FortuneScores } from '@machinefit/shared';
import { FortuneSection } from '@/components/fortune/reading/FortuneSection';
import { scoreToStars } from '@/components/fortune/fortuneVisuals';

interface FortuneLuckSectionProps {
  scores: FortuneScores;
  scoreStars: number;
  delayMs?: number;
}

function Stars({ value }: { value: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span className="fr-luck__stars" aria-hidden>
      {'★'.repeat(filled)}
      {'☆'.repeat(5 - filled)}
    </span>
  );
}

export function FortuneLuckSection({
  scores,
  scoreStars,
  delayMs = 100,
}: FortuneLuckSectionProps) {
  const { t } = useTranslation('fortune');

  const items = [
    {
      key: 'workout',
      emoji: '🏋️',
      label: t('starsLabel'),
      stars: scoreStars,
      blurb: t(captionFor('workout', scores.healthmanIndex)),
    },
    {
      key: 'pr',
      emoji: '🏆',
      label: t('prLuckLabel'),
      stars: scoreToStars(scores.prLuck),
      blurb: t(captionFor('pr', scores.prLuck)),
    },
    {
      key: 'recovery',
      emoji: '🧘',
      label: t('recoveryLuckLabel'),
      stars: scoreToStars(scores.recoveryLuck),
      blurb: t(captionFor('recovery', scores.recoveryLuck)),
    },
    {
      key: 'volume',
      emoji: '📈',
      label: t('volumeLuckLabel'),
      stars: scoreToStars(scores.volumeLuck ?? 50),
      blurb: t(captionFor('volume', scores.volumeLuck ?? 50)),
    },
    {
      key: 'focus',
      emoji: '🎯',
      label: t('focusLuckLabel'),
      stars: scoreToStars(scores.focusLuck ?? 50),
      blurb: t(captionFor('focus', scores.focusLuck ?? 50)),
    },
    {
      key: 'change',
      emoji: '✨',
      label: t('changeLuckLabel'),
      stars: scoreToStars(scores.changeLuck ?? 50),
      blurb: t(captionFor('change', scores.changeLuck ?? 50)),
    },
  ];

  return (
    <FortuneSection title={`🏋️ ${t('sectionWorkoutLuck')}`} delayMs={delayMs}>
      <div className="fr-luck-grid">
        {items.map((item) => (
          <article key={item.key} className="fr-luck-card">
            <p className="fr-luck-card__label">
              <span aria-hidden>{item.emoji}</span> {item.label}
            </p>
            <Stars value={item.stars} />
            <p className="fr-luck-card__blurb">{item.blurb}</p>
          </article>
        ))}
      </div>
    </FortuneSection>
  );
}

function captionFor(
  kind: 'workout' | 'pr' | 'recovery' | 'volume' | 'focus' | 'change',
  score: number
): string {
  if (kind === 'workout') {
    if (score >= 80) return 'captionHealthmanHot';
    if (score >= 60) return 'captionHealthmanGood';
    if (score >= 45) return 'captionHealthmanSteady';
    return 'captionHealthmanEasy';
  }
  if (kind === 'pr') {
    return score >= 70 ? 'content.prHigh' : score >= 40 ? 'content.prMid' : 'content.prLow';
  }
  if (kind === 'recovery') {
    return score >= 70
      ? 'content.recoveryHigh'
      : score >= 40
        ? 'content.recoveryMid'
        : 'content.recoveryLow';
  }
  if (kind === 'volume') {
    return score >= 70 ? 'luckBlurb.volumeHigh' : 'luckBlurb.volumeLow';
  }
  if (kind === 'focus') {
    return score >= 70 ? 'luckBlurb.focusHigh' : 'luckBlurb.focusLow';
  }
  return score >= 70 ? 'luckBlurb.changeHigh' : 'luckBlurb.changeLow';
}
