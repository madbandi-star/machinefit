import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  /** Called after the field is cleared (e.g. reset applied search). */
  onClear?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, onClear, placeholder }: SearchBarProps) {
  const { t } = useTranslation();
  const label = placeholder ?? t('actions.search');
  const hasValue = value.trim().length > 0;

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className={`search-bar__field${hasValue ? ' search-bar__field--clearable' : ''}`}>
        <span className="search-bar__leading" aria-hidden>
          <Icon name="search" size={18} className="search-bar__leading-icon" />
        </span>
        <input
          className="input search-bar__input"
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          aria-label={label}
        />
        {hasValue ? (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label={t('actions.close')}
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>
      {onSubmit ? (
        <button
          type="submit"
          className="btn btn--secondary icon-btn search-bar__submit"
          aria-label={t('actions.search')}
        >
          <Icon name="search" size={20} />
        </button>
      ) : null}
    </form>
  );
}
