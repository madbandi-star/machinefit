import { useTranslation } from 'react-i18next';

interface FortuneBeforeAfterProps {
  preBody: string;
  postBody: string;
}

export function FortuneBeforeAfter({ preBody, postBody }: FortuneBeforeAfterProps) {
  const { t } = useTranslation('fortune');
  return (
    <div className="fortune-ba">
      <article className="fortune-ba__card fortune-ba__card--before">
        <p className="fortune-ba__eyebrow">
          <span aria-hidden>🔥</span> {t('content.beforeCheckTitle')}
        </p>
        <p className="fortune-ba__tag">
          <span aria-hidden>🏃</span> {t('warmupTag')}
        </p>
        <p className="fortune-ba__body">{preBody}</p>
        <p className="fortune-ba__expand">{t('content.beforeExpand')}</p>
        <ul className="fortune-ba__checks">
          <li>
            <span aria-hidden>☑</span> {t('content.beforeCheck1')}
          </li>
          <li>
            <span aria-hidden>☑</span> {t('content.beforeCheck2')}
          </li>
          <li>
            <span aria-hidden>☑</span> {t('content.beforeCheck3')}
          </li>
        </ul>
      </article>
      <article className="fortune-ba__card fortune-ba__card--after">
        <p className="fortune-ba__eyebrow">
          <span aria-hidden>🧘</span> {t('content.afterCheckTitle')}
        </p>
        <p className="fortune-ba__body">{postBody}</p>
        <p className="fortune-ba__expand">{t('content.afterExpand')}</p>
        <ul className="fortune-ba__checks">
          <li>
            <span aria-hidden>☑</span> {t('content.afterCheck1')}
          </li>
          <li>
            <span aria-hidden>☑</span> {t('content.afterCheck2')}
          </li>
          <li>
            <span aria-hidden>☑</span> {t('content.afterCheck3')}
          </li>
        </ul>
      </article>
    </div>
  );
}
