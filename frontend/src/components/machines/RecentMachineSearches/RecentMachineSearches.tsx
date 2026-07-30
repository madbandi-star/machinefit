import { Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/styles/machines.css';

interface RecentMachineSearchesProps {
  items: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}

export function RecentMachineSearches({
  items,
  onSelect,
  onRemove,
  onClearAll,
}: RecentMachineSearchesProps) {
  const { t } = useTranslation('machines');

  if (items.length === 0) return null;

  return (
    <section className="recent-searches" aria-label={t('recentSearches.title')}>
      <div className="recent-searches__header">
        <h2 className="recent-searches__title">{t('recentSearches.title')}</h2>
        <button
          type="button"
          className="recent-searches__clear-all"
          onClick={onClearAll}
          aria-label={t('recentSearches.clearAll')}
        >
          <Trash2 size={14} strokeWidth={2.1} aria-hidden />
          <span>{t('recentSearches.clearAll')}</span>
        </button>
      </div>
      <ul className="recent-searches__list">
        {items.map((item) => (
          <li key={item} className="recent-searches__item">
            <button
              type="button"
              className="recent-searches__query"
              onClick={() => onSelect(item)}
            >
              {item}
            </button>
            <button
              type="button"
              className="recent-searches__remove"
              onClick={() => onRemove(item)}
              aria-label={t('recentSearches.removeItem', { query: item })}
            >
              <X size={14} strokeWidth={2.25} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
