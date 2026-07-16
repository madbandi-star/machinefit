import { useTranslation } from 'react-i18next';
import '@/styles/machines.css';

interface MachineEmptyStateProps {
  hasQuery?: boolean;
}

export function MachineEmptyState({ hasQuery }: MachineEmptyStateProps) {
  const { t } = useTranslation('machines');

  return (
    <div className="machine-empty-state">
      <div className="machine-empty-state__icon" aria-hidden>
        🔍
      </div>
      <p className="machine-empty-state__title">
        {hasQuery ? t('search.noResults') : t('search.empty')}
      </p>
      <p className="machine-empty-state__hint">
        {hasQuery ? t('search.noResultsHint') : t('search.emptyHint')}
      </p>
    </div>
  );
}
