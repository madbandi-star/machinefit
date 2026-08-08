import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bodyPartHref, styleHref } from '@/components/fortune/fortuneVisuals';

interface TodayRecommendationGridProps {
  bodyPart: string;
  bodyPartLabel: string;
  style: string;
  styleLabel: string;
  strategyLabel: string;
  conditionLabel: string;
  recordsHref?: string;
}

export function TodayRecommendationGrid({
  bodyPart,
  bodyPartLabel,
  style,
  styleLabel,
  strategyLabel,
  conditionLabel,
  recordsHref = '/records?tab=history',
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
      to: bodyPartHref(bodyPart),
    },
    {
      key: 'style',
      emoji: '💪',
      label: t('styleShort'),
      value: styleLabel,
      to: styleHref(style),
    },
    {
      key: 'strategy',
      emoji: '📈',
      label: t('strategyShort'),
      value: strategyLabel,
      to: recordsHref,
    },
    {
      key: 'condition',
      emoji: '🧘',
      label: t('conditionShort'),
      value: conditionLabel,
      to: undefined as string | undefined,
    },
  ];

  return (
    <div className="fortune-rec-grid">
      {cards.map((card) =>
        card.to ? (
          <Link key={card.key} to={card.to} className="fortune-rec-card">
            <span className="fortune-rec-card__emoji" aria-hidden>
              {card.emoji}
            </span>
            <span className="fortune-rec-card__label">{card.label}</span>
            <strong className="fortune-rec-card__value">{card.value}</strong>
          </Link>
        ) : (
          <div key={card.key} className="fortune-rec-card fortune-rec-card--static">
            <span className="fortune-rec-card__emoji" aria-hidden>
              {card.emoji}
            </span>
            <span className="fortune-rec-card__label">{card.label}</span>
            <strong className="fortune-rec-card__value">{card.value}</strong>
          </div>
        )
      )}
    </div>
  );
}
