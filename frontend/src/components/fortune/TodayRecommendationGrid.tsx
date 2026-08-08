import { useTranslation } from 'react-i18next';

interface TodayRecommendationGridProps {
  bodyPart: string;
  bodyPartLabel: string;
  styleLabel: string;
  strategyLabel: string;
  conditionLabel: string;
}

export function TodayRecommendationGrid({
  bodyPart,
  bodyPartLabel,
  styleLabel,
  strategyLabel,
  conditionLabel,
}: TodayRecommendationGridProps) {
  const { t } = useTranslation('fortune');

  const bodyEmoji =
    bodyPart === 'CHEST'
      ? '💪'
      : bodyPart === 'BACK'
        ? '🔥'
        : bodyPart === 'LEGS'
          ? '🦵'
          : bodyPart === 'SHOULDERS'
            ? '🏋️'
            : '✨';

  const cards = [
    {
      key: 'body',
      emoji: bodyEmoji,
      label: t('bodyPartShort'),
      value: bodyPartLabel,
    },
    {
      key: 'style',
      emoji: '💪',
      label: t('styleShort'),
      value: styleLabel,
    },
    {
      key: 'strategy',
      emoji: '📈',
      label: t('strategyShort'),
      value: strategyLabel,
    },
    {
      key: 'condition',
      emoji: '🧘',
      label: t('conditionShort'),
      value: conditionLabel,
    },
  ];

  return (
    <div className="fortune-rec-grid">
      {cards.map((card) => (
        <div key={card.key} className="fortune-rec-card fortune-rec-card--static">
          <span className="fortune-rec-card__emoji" aria-hidden>
            {card.emoji}
          </span>
          <span className="fortune-rec-card__label">{card.label}</span>
          <strong className="fortune-rec-card__value">{card.value}</strong>
        </div>
      ))}
    </div>
  );
}
