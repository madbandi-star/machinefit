import { useTranslation } from 'react-i18next';

export interface FortuneExplainBlockProps {
  /** i18n prefix under fortune:explain.<prefix>.* */
  prefix: string;
  showTimeRangeChart?: boolean;
  showFootnote?: boolean;
  /** When true (default), guide is collapsed until the user expands it. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/**
 * Beginner guide: what it is → what it looks at → gym metaphor.
 * Presentation only — does not affect fortune results.
 */
export function FortuneExplainBlock({
  prefix,
  showTimeRangeChart = false,
  showFootnote = true,
  collapsible = true,
  defaultOpen = false,
}: FortuneExplainBlockProps) {
  const { t } = useTranslation('fortune');

  const body = (
    <>
      <p className="fr-explain__heading">📖 {t('explain.whatTitle')}</p>
      <p className="fr-explain__text">{t(`explain.${prefix}.what`)}</p>
      <p className="fr-explain__heading">{t('explain.lookTitle')}</p>
      <p className="fr-explain__text">{t(`explain.${prefix}.look`)}</p>
      <p className="fr-explain__heading fr-explain__heading--gym">
        💪 {t('explain.gymTitle')}
      </p>
      <p className="fr-explain__text fr-explain__text--gym">{t(`explain.${prefix}.gym`)}</p>
      {showTimeRangeChart ? (
        <div className="fr-explain__chart">
          <p className="fr-explain__heading">🏋️ {t('explain.timeRangeTitle')}</p>
          <ul className="fr-explain__list">
            <li>
              <strong>{t('layer.daeun')}</strong>
              <span>{t('explain.timeRange.daeun')}</span>
            </li>
            <li>
              <strong>{t('layer.seun')}</strong>
              <span>{t('explain.timeRange.seun')}</span>
            </li>
            <li>
              <strong>{t('layer.wolun')}</strong>
              <span>{t('explain.timeRange.wolun')}</span>
            </li>
            <li>
              <strong>{t('layer.today')}</strong>
              <span>{t('explain.timeRange.iljin')}</span>
            </li>
          </ul>
          <p className="fr-explain__tip">💡 {t('explain.timeRange.tip')}</p>
        </div>
      ) : null}
      {showFootnote ? (
        <p className="fr-explain__footnote">{t('explain.metaphorNote')}</p>
      ) : null}
    </>
  );

  if (!collapsible) {
    return (
      <aside className="fr-explain" aria-label={t('explain.ariaLabel')}>
        <div className="fr-explain__divider" aria-hidden />
        {body}
      </aside>
    );
  }

  return (
    <details className="fr-explain fr-explain--collapsible" open={defaultOpen || undefined}>
      <summary className="fr-explain__summary">
        📖 {t('explain.whatTitle')}
      </summary>
      <div className="fr-explain__panel">{body}</div>
    </details>
  );
}
