import { useTranslation } from 'react-i18next';
import type {
  FortuneNarrative,
  FortuneTraditionalDetail as Detail,
} from '@machinefit/shared';
import { FortuneExplainBlock } from '@/components/fortune/reading/FortuneExplainBlock';

interface FortuneTraditionalDetailProps {
  detail: Detail;
  narrative?: FortuneNarrative | null;
}

export function FortuneTraditionalDetailPanel({
  detail,
  narrative,
}: FortuneTraditionalDetailProps) {
  const { t } = useTranslation('fortune');

  const cycleLayers =
    narrative?.layers.filter((l) =>
      ['daeun', 'seun', 'wolun', 'today', 'shijin'].includes(l.key)
    ) ?? [];

  const shipshinExtra = t(`explain.shipshinItems.${detail.shipshin}`, {
    defaultValue: '',
  });
  const unseongExtra = t(`explain.unseongItems.${detail.unseong}`, {
    defaultValue: '',
  });

  return (
    <details className="fr-detail">
      <summary className="fr-detail__summary">🔎 {t('traditionalDetailTitle')}</summary>
      <div className="fr-detail__body">
        <p className="fr-detail__note">{t('traditionalDetailNote')}</p>

        <details className="fr-detail__item" open>
          <summary>{t('detail.pillarsGroup')}</summary>
          <dl className="fr-detail__grid">
            <div>
              <dt>{t('detail.pillarsYear')}</dt>
              <dd>
                {detail.yearStem}
                {detail.yearBranch}
              </dd>
            </div>
            <div>
              <dt>{t('detail.pillarsMonth')}</dt>
              <dd>
                {detail.monthStem}
                {detail.monthBranch}
              </dd>
            </div>
            <div>
              <dt>{t('detail.pillarsDay')}</dt>
              <dd>
                {detail.dayStem}
                {detail.dayBranch}
              </dd>
            </div>
            <div>
              <dt>{t('detail.pillarsHour')}</dt>
              <dd>
                {detail.hourStem && detail.hourBranch
                  ? `${detail.hourStem}${detail.hourBranch}`
                  : t('detail.hourUnknown')}
              </dd>
            </div>
          </dl>
          <div className="fr-detail__sub">
            <p className="fr-detail__sub-title">{t('explain.pillars.fourTitle')}</p>
            <ul className="fr-detail__sub-list">
              <li>
                <strong>{t('detail.pillarsYear')}</strong> — {t('explain.pillars.yearGym')}
              </li>
              <li>
                <strong>{t('detail.pillarsMonth')}</strong> — {t('explain.pillars.monthGym')}
              </li>
              <li>
                <strong>{t('detail.pillarsDay')}</strong> — {t('explain.pillars.dayGym')}
              </li>
              <li>
                <strong>{t('detail.pillarsHour')}</strong> — {t('explain.pillars.hourGym')}
              </li>
            </ul>
          </div>
          <FortuneExplainBlock prefix="pillars" showFootnote={false} />
          <FortuneExplainBlock prefix="ganzhi" showDivider={false} />
        </details>

        <details className="fr-detail__item">
          <summary>{t('detail.shipshinLabel')}</summary>
          <p>{t(detail.shipshinHintKey)}</p>
          {shipshinExtra ? (
            <p className="fr-detail__item-gym">💪 {shipshinExtra}</p>
          ) : null}
          <FortuneExplainBlock prefix="shipshin" />
        </details>

        <details className="fr-detail__item">
          <summary>{t('detail.unseongLabel')}</summary>
          <p>{t(detail.unseongHintKey)}</p>
          {unseongExtra ? (
            <p className="fr-detail__item-gym">💪 {unseongExtra}</p>
          ) : null}
          <FortuneExplainBlock prefix="unseong" />
        </details>

        <details className="fr-detail__item">
          <summary>{t('detail.shinsalLabel')}</summary>
          <p>
            {detail.shinsalHintKeys.length
              ? detail.shinsalHintKeys.map((k) => t(k)).join(' · ')
              : t('detail.shinsalNone')}
          </p>
          <FortuneExplainBlock prefix="shinsal" />
        </details>

        <details className="fr-detail__item">
          <summary>{t('detail.usefulLabel')}</summary>
          <p>
            {t(detail.usefulHintKey, {
              yong: t(`element.${detail.yongshin}`),
              hui: t(`element.${detail.huishin}`),
              ki: t(`element.${detail.kishin}`),
            })}
          </p>
          <div className="fr-detail__sub">
            <ul className="fr-detail__sub-list">
              <li>
                <strong>{t('explain.useful.yongLabel')}</strong> —{' '}
                {t(`element.${detail.yongshin}`)} · {t('explain.useful.yongGym')}
              </li>
              <li>
                <strong>{t('explain.useful.huiLabel')}</strong> —{' '}
                {t(`element.${detail.huishin}`)} · {t('explain.useful.huiGym')}
              </li>
              <li>
                <strong>{t('explain.useful.kiLabel')}</strong> —{' '}
                {t(`element.${detail.kishin}`)} · {t('explain.useful.kiGym')}
              </li>
            </ul>
          </div>
          <FortuneExplainBlock prefix="useful" />
        </details>

        {cycleLayers.length ? (
          <details className="fr-detail__item">
            <summary>{t('detail.cyclesGroup')}</summary>
            <ul className="fr-detail__cycles">
              {cycleLayers.map((layer) => (
                <li key={layer.key}>
                  <strong>{t(layer.titleKey)}</strong>
                  {' — '}
                  {t(`element.${layer.element}`)} · {t(layer.moodKey)}
                </li>
              ))}
            </ul>
            <FortuneExplainBlock prefix="cycles" showTimeRangeChart />
          </details>
        ) : null}
      </div>
    </details>
  );
}
