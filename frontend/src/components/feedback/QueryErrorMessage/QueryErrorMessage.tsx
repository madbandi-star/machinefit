import { useTranslation } from 'react-i18next';

export function QueryErrorMessage({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <p style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>
      {message ?? t('errors.loadFailed')}
    </p>
  );
}
