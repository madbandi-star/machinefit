import { useTranslation } from 'react-i18next';
import type {
  FortuneNarrative,
  FortuneTraditionalDetail as Detail,
} from '@machinefit/shared';

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
        </details>

        <details className="fr-detail__item">
          <summary>{t('detail.shipshinLabel')}</summary>
          <p>{t(detail.shipshinHintKey)}</p>
        </details>

        <details className="fr-detail__item">
          <summary>{t('detail.unseongLabel')}</summary>
          <p>{t(detail.unseongHintKey)}</p>
        </details>

        <details className="fr-detail__item">
          <summary>{t('detail.shinsalLabel')}</summary>
          <p>
            {detail.shinsalHintKeys.length
              ? detail.shinsalHintKeys.map((k) => t(k)).join(' · ')
              : t('detail.shinsalNone')}
          </p>
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
          </details>
        ) : null}
      </div>
    </details>
  );
}
