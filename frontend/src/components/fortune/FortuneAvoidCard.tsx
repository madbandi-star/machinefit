import { useTranslation } from 'react-i18next';

interface FortuneAvoidCardProps {
  label: string;
}

export function FortuneAvoidCard({ label }: FortuneAvoidCardProps) {
  const { t } = useTranslation('fortune');
  return (
    <aside className="fortune-avoid" aria-label={t('avoid')}>
      <p className="fortune-avoid__eyebrow">
        <span aria-hidden>⚠️</span> {t('avoidTitle')}
      </p>
      <p className="fortune-avoid__body">{label}</p>
    </aside>
  );
}
