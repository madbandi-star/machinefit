import { useTranslation } from 'react-i18next';
import type { FortuneNarrative, FortuneRecommendation } from '@machinefit/shared';
import { FortuneSection } from '@/components/fortune/reading/FortuneSection';

interface FortuneGuideSectionProps {
  recommendation: FortuneRecommendation;
  narrative?: FortuneNarrative | null;
  delayMs?: number;
}

export function FortuneGuideSection({
  recommendation,
  narrative,
  delayMs = 120,
}: FortuneGuideSectionProps) {
  const { t } = useTranslation('fortune');
  const theme = narrative ? t(narrative.coreThemeLabelKey) : '';

  const cards = [
    { label: t('bodyPartShort'), value: recommendation.bodyPartLabel, emoji: '💪' },
    { label: t('styleShort'), value: recommendation.styleLabel, emoji: '🏋️' },
    { label: t('strategyShort'), value: recommendation.strategyLabel, emoji: '📈' },
    { label: t('avoid'), value: recommendation.avoidLabel, emoji: '🚫' },
    { label: t('preWorkout'), value: recommendation.preWorkoutBody, emoji: '🔥' },
    { label: t('postWorkout'), value: recommendation.postWorkoutBody, emoji: '💧' },
  ];

  return (
    <FortuneSection title={`🔥 ${t('sectionGuide')}`} delayMs={delayMs}>
      {theme ? (
        <p className="fr-guide__bridge">
          {t('guideThemeBridge', { theme })}
        </p>
      ) : null}
      <div className="fr-guide-grid">
        {cards.map((c) => (
          <article key={c.label} className="fr-tile">
            <p className="fr-tile__label">
              <span aria-hidden>{c.emoji}</span> {c.label}
            </p>
            <p className="fr-tile__value">{c.value}</p>
          </article>
        ))}
      </div>
    </FortuneSection>
  );
}
