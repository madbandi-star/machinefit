import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Gym } from '@machinefit/shared';
import { gymApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/components.css';

export interface HomeGymValue {
  homeGymId?: string;
  homeGymName?: string;
}

interface HomeGymFieldProps {
  value: HomeGymValue;
  onChange: (value: HomeGymValue) => void;
  invalid?: boolean;
}

export function HomeGymField({ value, onChange, invalid = false }: HomeGymFieldProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(value.homeGymName ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.homeGymId) return;
    setQuery(value.homeGymName ?? '');
  }, [value.homeGymId, value.homeGymName]);

  const { data: gyms = [], isFetching } = useQuery({
    queryKey: [...QUERY_KEYS.gyms, query],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 8 };
      if (query.trim()) params.q = query.trim();
      const res = await gymApi.list(params);
      return res.data.data.items;
    },
    enabled: open && query.trim().length >= 1,
  });

  const selectedGymLabel = useMemo(() => {
    if (!value.homeGymId) return null;
    return value.homeGymName ?? value.homeGymId;
  }, [value.homeGymId, value.homeGymName]);

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setOpen(true);
    onChange({ homeGymId: undefined, homeGymName: next.trim() || undefined });
  };

  const handleSelectGym = (gym: Gym) => {
    const name = typeof gym.name === 'string' ? gym.name : getLocalizedName(gym.name, i18n.language, gym.slug ?? '');
    setQuery(name);
    setOpen(false);
    onChange({ homeGymId: gym.id, homeGymName: name });
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    onChange({});
  };

  return (
    <div className="home-gym-field">
      <label className="home-gym-field__label" htmlFor="home-gym-input">
        {t('auth.homeGym')}
      </label>
      <p className="form-section__desc home-gym-field__desc">{t('auth.homeGymDesc')}</p>
      <div className="home-gym-field__input-wrap">
        <input
          id="home-gym-input"
          className={`input${invalid ? ' input--invalid' : ''}`}
          type="text"
          value={selectedGymLabel ?? query}
          placeholder={t('auth.homeGymPlaceholder')}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          autoComplete="organization"
        />
        {(value.homeGymId || value.homeGymName || query) && (
          <button
            type="button"
            className="home-gym-field__clear"
            onClick={handleClear}
            aria-label={t('actions.cancel')}
          >
            ×
          </button>
        )}
      </div>
      {open && query.trim().length >= 1 && !value.homeGymId ? (
        <ul className="home-gym-field__suggestions" role="listbox">
          {isFetching ? (
            <li className="home-gym-field__suggestion home-gym-field__suggestion--muted">
              {t('auth.homeGymSearching')}
            </li>
          ) : gyms.length > 0 ? (
            gyms.map((gym) => (
              <li key={gym.id}>
                <button
                  type="button"
                  className="home-gym-field__suggestion"
                  role="option"
                  onClick={() => handleSelectGym(gym)}
                >
                  {typeof gym.name === 'string'
                    ? gym.name
                    : getLocalizedName(gym.name, i18n.language, gym.slug ?? '')}
                </button>
              </li>
            ))
          ) : (
            <li className="home-gym-field__suggestion home-gym-field__suggestion--muted">
              {t('auth.homeGymUseTyped', { name: query.trim() })}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
