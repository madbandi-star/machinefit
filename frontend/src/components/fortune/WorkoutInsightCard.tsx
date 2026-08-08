import { useTranslation } from 'react-i18next';
import type { EquipmentSlice } from '@/components/fortune/fortuneVisuals';
import { topEquipment } from '@/components/fortune/fortuneVisuals';

interface WorkoutInsightCardProps {
  bullets: string[];
  slices: EquipmentSlice[];
  styleLabel?: string;
  sparse: boolean;
  empty: boolean;
}

export function WorkoutInsightCard({
  bullets,
  slices,
  styleLabel,
  sparse,
  empty,
}: WorkoutInsightCardProps) {
  const { t } = useTranslation('fortune');
  const top = topEquipment(slices);

  if (empty) {
    return (
      <div className="fortune-insight fortune-insight--empty">
        <p className="fortune-insight__eyebrow">
          <span aria-hidden>💡</span> {t('insightTitle')}
        </p>
        <p className="fortune-insight__body">{t('dataEmptyBody')}</p>
      </div>
    );
  }

  return (
    <div className="fortune-insight">
      <p className="fortune-insight__eyebrow">
        <span aria-hidden>💡</span> {t('insightTitle')}
      </p>
      {sparse ? (
        <p className="fortune-insight__seed">
          <span aria-hidden>🌱</span> {t('dataSparseTitle')}
          <span className="fortune-insight__seed-body">{t('dataSparseBody')}</span>
        </p>
      ) : null}
      {top ? (
        <p className="fortune-insight__top">
          <span aria-hidden>{top.emoji}</span>{' '}
          {t('insightTopEquipment', {
            equipment: t(top.labelKey),
            percent: top.value,
          })}
        </p>
      ) : null}
      {bullets.length ? (
        <ul className="fortune-insight__bullets">
          {bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {styleLabel ? (
        <p className="fortune-insight__bridge">
          {t('insightBridgeStyle', { style: styleLabel })}
        </p>
      ) : null}
    </div>
  );
}
