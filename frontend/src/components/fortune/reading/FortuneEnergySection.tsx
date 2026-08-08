import { useTranslation } from 'react-i18next';
import type { FortuneNarrative } from '@machinefit/shared';
import { FortuneExplainBlock } from '@/components/fortune/reading/FortuneExplainBlock';
import { FortuneSection } from '@/components/fortune/reading/FortuneSection';
import { elementBars, yinYangDisplay } from '@/components/fortune/fortuneVisuals';

interface FortuneEnergySectionProps {
  narrative: FortuneNarrative;
  delayMs?: number;
}

const ELEMENT_HAN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

export function FortuneEnergySection({ narrative, delayMs = 40 }: FortuneEnergySectionProps) {
  const { t } = useTranslation('fortune');
  const yy = yinYangDisplay(narrative.yinYang);
  const bars = elementBars(narrative.element);

  return (
    <FortuneSection
      title={`🌿 ${t('sectionTodayEnergy')}`}
      delayMs={delayMs}
      tone="fortune"
    >
      <div className="fr-energy">
        <div className="fr-energy__yy">
          <p className="fr-label">{t('yinYangLabel')}</p>
          <div className="fr-yy-bars">
            <div className="fr-yy-bars__row">
              <span>☯ {t('yinYangYang')}</span>
              <div className="fr-bar">
                <div className="fr-bar__fill fr-bar__fill--yang" style={{ width: `${yy.yang}%` }} />
              </div>
              <strong>{yy.yang}%</strong>
            </div>
            <div className="fr-yy-bars__row">
              <span>{t('yinYangYin')}</span>
              <div className="fr-bar">
                <div className="fr-bar__fill fr-bar__fill--yin" style={{ width: `${yy.yin}%` }} />
              </div>
              <strong>{yy.yin}%</strong>
            </div>
          </div>
          <p className="fr-energy__summary">{t(narrative.yinYangSummaryKey)}</p>
        </div>

        <div className="fr-energy__elements">
          <p className="fr-label">{t('wuxingLabel')}</p>
          <ul className="fr-el-bars">
            {bars.map((b) => (
              <li key={b.key} className="fr-el-bars__row">
                <span className="fr-el-bars__name">
                  {ELEMENT_HAN[b.key]} {t(`element.${b.key}`)}
                </span>
                <div className="fr-bar">
                  <div
                    className={`fr-bar__fill fr-bar__fill--${b.key}`}
                    style={{ width: `${b.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="fr-energy__summary">
            {t('energyWorkoutBridge', {
              primary: t(`element.${narrative.element.primary}`),
              support: t(`element.${narrative.element.support}`),
              mood: t(narrative.layers.find((l) => l.key === 'today')?.moodKey ?? 'mood.steady'),
            })}
          </p>
          <ul className="fr-el-hints">
            {bars.map((b) => (
              <li key={`hint-${b.key}`}>
                <strong>
                  {ELEMENT_HAN[b.key]} {t(`element.${b.key}`)}
                </strong>
                {' — '}
                {t(`explain.wuxingItems.${b.key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <FortuneExplainBlock prefix="energy" />
    </FortuneSection>
  );
}
