import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';

interface MachineEmptyStateProps {
  hasQuery?: boolean;
}

export function MachineEmptyState({ hasQuery }: MachineEmptyStateProps) {
  const { t } = useTranslation('machines');

  return (
    <EmptyState
      icon="search"
      title={hasQuery ? t('search.noResults') : t('search.empty')}
      hint={hasQuery ? t('search.noResultsHint') : t('search.emptyHint')}
    />
  );
}
