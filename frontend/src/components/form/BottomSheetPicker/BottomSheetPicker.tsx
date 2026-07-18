import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import '@/styles/components.css';

export interface BottomSheetPickerOption {
  value: string;
  label: string;
  group?: string;
}

interface BottomSheetPickerProps {
  id?: string;
  label: string;
  value: string;
  options: BottomSheetPickerOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function BottomSheetPicker({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
}: BottomSheetPickerProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, BottomSheetPickerOption[]>();
    for (const option of filteredOptions) {
      const groupKey = option.group ?? '';
      const items = groups.get(groupKey) ?? [];
      items.push(option);
      groups.set(groupKey, items);
    }
    return [...groups.entries()];
  }, [filteredOptions]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <>
      <label className="bottom-sheet-picker__label" htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        className="bottom-sheet-picker__trigger input"
        onClick={() => setOpen(true)}
        disabled={disabled || options.length === 0}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="bottom-sheet-picker__trigger-label">
          {selectedLabel ?? placeholder ?? t('picker.selectOption')}
        </span>
        <Icon name="chevronDown" size={18} className="bottom-sheet-picker__chevron" />
      </button>

      {open ? (
        <div
          className="bottom-sheet-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="bottom-sheet card"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bottom-sheet__header">
              <h3 className="bottom-sheet__title">{label}</h3>
              <button
                type="button"
                className="bottom-sheet__close"
                onClick={() => setOpen(false)}
                aria-label={t('actions.close')}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <input
              className="input bottom-sheet__search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('picker.searchPlaceholder')}
            />

            <ul className="bottom-sheet__list" role="listbox">
              {groupedOptions.length === 0 ? (
                <li className="bottom-sheet__empty">{t('picker.noResults')}</li>
              ) : (
                groupedOptions.map(([group, items]) => (
                  <li key={group || 'default'} className="bottom-sheet__group">
                    {group ? <p className="bottom-sheet__group-label">{group}</p> : null}
                    <ul className="bottom-sheet__group-items">
                      {items.map((option) => (
                        <li key={option.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            className={`bottom-sheet__option${option.value === value ? ' bottom-sheet__option--active' : ''}`}
                            onClick={() => handleSelect(option.value)}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
