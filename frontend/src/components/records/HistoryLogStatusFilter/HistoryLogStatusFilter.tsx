import { useTranslation } from 'react-i18next';
import {
  HISTORY_LOG_STATUS_VALUES,
  type HistoryLogStatus,
} from '@/utils/historyLogStatus';
import '@/styles/records.css';

interface HistoryLogStatusFilterProps {
  value: HistoryLogStatus;
  onChange: (value: HistoryLogStatus) => void;
}

const LABEL_KEYS: Record<HistoryLogStatus, string> = {
  all: 'machines:history.logStatusAll',
  saved: 'machines:history.logStatusSaved',
  unsaved: 'machines:history.logStatusUnsaved',
};

export function HistoryLogStatusFilter({ value, onChange }: HistoryLogStatusFilterProps) {
  const { t } = useTranslation();

  return (
    <div
      className="history-log-status-filter"
      role="tablist"
      aria-label={t('machines:history.logStatusLabel')}
    >
      {HISTORY_LOG_STATUS_VALUES.map((status) => (
        <button
          key={status}
          type="button"
          role="tab"
          aria-selected={value === status}
          className={`history-log-status-filter__item${value === status ? ' history-log-status-filter__item--active' : ''}`}
          onClick={() => onChange(status)}
        >
          {t(LABEL_KEYS[status])}
        </button>
      ))}
    </div>
  );
}
