import { useTranslation } from 'react-i18next';
import '@/styles/components.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
    >
      <input
        className="input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('actions.search')}
      />
      <button type="submit" className="btn btn--primary">
        {t('actions.search')}
      </button>
    </form>
  );
}
