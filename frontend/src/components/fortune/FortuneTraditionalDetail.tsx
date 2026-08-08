import { useTranslation } from 'react-i18next';
import type { FortuneTraditionalDetail as Detail } from '@machinefit/shared';

interface FortuneTraditionalDetailProps {
  detail: Detail;
}

export function FortuneTraditionalDetailPanel({ detail }: FortuneTraditionalDetailProps) {
  const { t } = useTranslation('fortune');

  return (
    <details className="fortune-detail">
      <summary className="fortune-detail__summary">{t('traditionalDetailTitle')}</summary>
      <div className="fortune-detail__body">
        <p className="fortune-detail__note">{t('traditionalDetailNote')}</p>
        <dl className="fortune-detail__grid">
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
        <p className="fortune-detail__line">
          <strong>{t('detail.shipshinLabel')}</strong> {t(detail.shipshinHintKey)}
        </p>
        <p className="fortune-detail__line">
          <strong>{t('detail.unseongLabel')}</strong> {t(detail.unseongHintKey)}
        </p>
        {detail.shinsalHintKeys.length ? (
          <p className="fortune-detail__line">
            <strong>{t('detail.shinsalLabel')}</strong>{' '}
            {detail.shinsalHintKeys.map((k) => t(k)).join(' · ')}
          </p>
        ) : null}
        <p className="fortune-detail__line">
          <strong>{t('detail.usefulLabel')}</strong>{' '}
          {t(detail.usefulHintKey, {
            yong: t(`element.${detail.yongshin}`),
            hui: t(`element.${detail.huishin}`),
            ki: t(`element.${detail.kishin}`),
          })}
        </p>
      </div>
    </details>
  );
}
