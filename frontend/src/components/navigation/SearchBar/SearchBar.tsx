import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder }: SearchBarProps) {
  const { t } = useTranslation();
  const label = placeholder ?? t('actions.search');

  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="search-bar__field">
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
