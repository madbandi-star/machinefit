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
          <span aria-hidden>🔥</span> {t('beforeTitle')}
        </p>
        <p className="fortune-ba__tag">
          <span aria-hidden>🏃</span> {t('warmupTag')}
        </p>
        <p className="fortune-ba__body">{preBody}</p>
      </article>
      <article className="fortune-ba__card fortune-ba__card--after">
        <p className="fortune-ba__eyebrow">
          <span aria-hidden>🧘</span> {t('afterTitle')}
        </p>
        <p className="fortune-ba__body">{postBody}</p>
      </article>
    </div>
  );
}
