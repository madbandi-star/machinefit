import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/components.css';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  allowEmpty = false,
  emptyLabel,
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = options.find((option) => option.value === value)?.label;

  useEffect(() => {
    if (!open) {
      setQuery(selectedLabel ?? '');
    }
  }, [open, selectedLabel]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = allowEmpty
      ? [{ value: '', label: emptyLabel ?? t('picker.all') }, ...options]
      : options;

    if (!normalized) return base;
    return base.filter((option) => {
      if (allowEmpty && option.value === '') return true;
      return option.label.toLowerCase().includes(normalized);
    });
  }, [allowEmpty, emptyLabel, options, query, t]);

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    const label = options.find((option) => option.value === nextValue)?.label ?? '';
    setQuery(nextValue ? label : emptyLabel ?? '');
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const root = (id ? document.getElementById(`${id}-root`) : null) ?? null;
      if (root && !root.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, id]);

  const displayValue = open
    ? query
    : value
      ? (selectedLabel ?? '')
      : allowEmpty
        ? (emptyLabel ?? t('picker.all'))
        : '';

  return (
    <div
      id={id ? `${id}-root` : undefined}
      className={`searchable-select${className ? ` ${className}` : ''}`}
    >
      <input
        id={id}
        className="input searchable-select__input"
        type="text"
        value={displayValue}
        placeholder={placeholder ?? t('picker.searchPlaceholder')}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
      />
      {open ? (
        <ul
          id={id ? `${id}-listbox` : undefined}
          className="searchable-select__list"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <li className="searchable-select__empty">{t('picker.noResults')}</li>
          ) : (
            filteredOptions.map((option) => (
              <li key={option.value || '__empty'}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`searchable-select__option${option.value === value ? ' searchable-select__option--active' : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
