import { useTranslation } from 'react-i18next';
import type { FortuneNarrative } from '@machinefit/shared';

const ELEMENT_EMOJI: Record<string, string> = {
  wood: '🌿',
  fire: '🔥',
  earth: '⛰',
  metal: '⚙️',
  water: '💧',
};

interface FortuneFlowStripProps {
  narrative: FortuneNarrative;
}

export function FortuneFlowStrip({ narrative }: FortuneFlowStripProps) {
  const { t } = useTranslation('fortune');
  const flowLayers = narrative.layers.filter((l) => l.key !== 'shijin');

  return (
    <div className="fortune-flow">
      <div className="fortune-flow__core">
        <p className="fortune-flow__core-label">{t('coreThemeLabel')}</p>
        <p className="fortune-flow__core-value">{t(narrative.coreThemeLabelKey)}</p>
        <p className="fortune-flow__yin-yang">{t(narrative.yinYangSummaryKey)}</p>
        <p className="fortune-flow__elements">
          <span>
            {ELEMENT_EMOJI[narrative.element.primary]}{' '}
            {t('elementPrimary')}: {t(`element.${narrative.element.primary}`)}
          </span>
          <span>
            {t('elementSupport')}: {t(`element.${narrative.element.support}`)}
          </span>
          <span>
            {t('elementWeak')}: {t(`element.${narrative.element.weak}`)}
          </span>
        </p>
      </div>
      <ol className="fortune-flow__list">
        {flowLayers.map((layer, idx) => (
          <li key={layer.key} className="fortune-flow__item">
            {idx > 0 ? <span className="fortune-flow__arrow" aria-hidden>↓</span> : null}
            <div className="fortune-flow__card">
              <p className="fortune-flow__title">{t(layer.titleKey)}</p>
              <p className="fortune-flow__mood">
                {ELEMENT_EMOJI[layer.element] ?? ''} {t(layer.moodKey)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
