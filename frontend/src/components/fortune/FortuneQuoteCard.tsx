import { useTranslation } from 'react-i18next';

interface FortuneQuoteCardProps {
  oneLiner: string;
  detail?: string;
}

export function FortuneQuoteCard({ oneLiner, detail }: FortuneQuoteCardProps) {
  const { t } = useTranslation('fortune');
  return (
    <blockquote className="fortune-quote">
      <p className="fortune-quote__eyebrow">
        <span aria-hidden>💬</span> {t('oneLiner')}
      </p>
      <p className="fortune-quote__text">“{oneLiner}”</p>
      {detail ? <p className="fortune-quote__detail">{detail}</p> : null}
    </blockquote>
  );
}
