import { useTranslation } from 'react-i18next';
import type { FortuneNarrative, FortuneTraditionalDetail } from '@machinefit/shared';
import { FortuneSection } from '@/components/fortune/reading/FortuneSection';
import { FortuneTraditionalDetailPanel } from '@/components/fortune/FortuneTraditionalDetail';
import {
  formatBirthDateDisplay,
  formatBirthTimeDisplay,
} from '@/components/fortune/fortuneVisuals';

interface FortuneBaseSectionProps {
  narrative?: FortuneNarrative | null;
  traditionalDetail?: FortuneTraditionalDetail | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  delayMs?: number;
}

export function FortuneBaseSection({
  narrative,
  traditionalDetail,
  birthDate,
  birthTime,
  birthTimeUnknown,
  delayMs = 60,
}: FortuneBaseSectionProps) {
  const { t } = useTranslation('fortune');
  const baseLayer = narrative?.layers.find((l) => l.key === 'base');
  const todayLayer = narrative?.layers.find((l) => l.key === 'today');
  const timeLabel = formatBirthTimeDisplay(birthTime, birthTimeUnknown);

  return (
    <FortuneSection title={`🌙 ${t('sectionBaseEnergy')}`} delayMs={delayMs}>
      <div className="fr-base">
        <dl className="fr-base__meta">
          <div>
            <dt>{t('birthDateLabel')}</dt>
            <dd>{birthDate ? formatBirthDateDisplay(birthDate) : '—'}</dd>
          </div>
          <div>
            <dt>{t('birthTimeLabel')}</dt>
            <dd>{timeLabel || t('birthTimeUnknown')}</dd>
          </div>
        </dl>

        {baseLayer ? (
          <p className="fr-base__energy">
            <span className="fr-label">{t('layer.base')}</span>
            <strong>
              {t(`element.${baseLayer.element}`)} · {t(baseLayer.moodKey)}
            </strong>
          </p>
        ) : null}

        <p className="fr-base__harmony">
          {t('baseHarmony', {
            base: baseLayer ? t(baseLayer.moodKey) : t('mood.steady'),
            today: todayLayer ? t(todayLayer.moodKey) : t('mood.steady'),
          })}
        </p>

        {traditionalDetail ? (
          <FortuneTraditionalDetailPanel
            detail={traditionalDetail}
            narrative={narrative}
          />
        ) : null}
      </div>
    </FortuneSection>
  );
}
