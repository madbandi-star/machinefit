import { useTranslation } from 'react-i18next';

interface QueryErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryErrorMessage({ message, onRetry }: QueryErrorMessageProps) {
  const { t } = useTranslation();
  return (
    <div className="query-error-message">
      <p style={{ color: 'var(--color-error)', fontSize: '0.9rem', margin: 0 }}>
        {message ?? t('errors.loadFailed')}
      </p>
      {onRetry ? (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          {t('actions.retry')}
        </button>
      ) : null}
    </div>
  );
}
