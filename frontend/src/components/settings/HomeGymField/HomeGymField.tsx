import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Gym, GymDirectoryEntry } from '@machinefit/shared';
import { gymApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/components.css';

export interface HomeGymValue {
  homeGymId?: string;
  homeGymName?: string;
}

export interface HomeGymLocationFilter {
  countryCode?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
}

interface HomeGymFieldProps {
  value: HomeGymValue;
  onChange: (value: HomeGymValue) => void;
  invalid?: boolean;
  showDesc?: boolean;
  /** Prefer results near the user's selected region (sido/sigungu/dong). */
  locationFilter?: HomeGymLocationFilter;
}

type Suggestion =
  | { kind: 'gym'; gym: Gym; name: string }
  | { kind: 'directory'; entry: GymDirectoryEntry; name: string };

export function HomeGymField({
  value,
  onChange,
  invalid = false,
  showDesc = true,
  locationFilter,
}: HomeGymFieldProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(value.homeGymName ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.homeGymId) return;
    setQuery(value.homeGymName ?? '');
  }, [value.homeGymId, value.homeGymName]);

  const trimmed = query.trim();
  const canSearch = open && trimmed.length >= 2 && !value.homeGymId;

  const locationParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (locationFilter?.districtId) params.districtId = locationFilter.districtId;
    if (locationFilter?.cityId) params.cityId = locationFilter.cityId;
    if (locationFilter?.stateId) params.stateId = locationFilter.stateId;
    if (locationFilter?.countryCode) params.countryCode = locationFilter.countryCode;
    return params;
  }, [locationFilter?.cityId, locationFilter?.countryCode, locationFilter?.districtId, locationFilter?.stateId]);

  const directoryQuery = useQuery({
    queryKey: [...QUERY_KEYS.gymDirectory, trimmed, locationParams],
    queryFn: async () => {
      const res = await gymApi.searchDirectory({
        q: trimmed,
        limit: 10,
        ...locationParams,
      });
      return res.data.data.items;
    },
    enabled: canSearch,
  });

  const gymsQuery = useQuery({
    queryKey: [...QUERY_KEYS.gyms, 'home-gym', trimmed, locationParams],
    queryFn: async () => {
      const res = await gymApi.list({
        limit: 5,
        q: trimmed,
        ...locationParams,
      });
      return res.data.data.items;
    },
    enabled: canSearch,
  });

  const suggestions = useMemo<Suggestion[]>(() => {
    const gymItems: Suggestion[] = (gymsQuery.data ?? []).map((gym) => ({
      kind: 'gym',
      gym,
      name:
        typeof gym.name === 'string'
          ? gym.name
          : getLocalizedName(gym.name, i18n.language, gym.slug ?? ''),
    }));
    const dirItems: Suggestion[] = (directoryQuery.data ?? []).map((entry) => ({
      kind: 'directory',
      entry,
      name: entry.name,
    }));
    const seen = new Set<string>();
    const merged: Suggestion[] = [];
    for (const item of [...gymItems, ...dirItems]) {
      const key = item.name.replace(/\s+/g, '').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged.slice(0, 12);
  }, [directoryQuery.data, gymsQuery.data, i18n.language]);

  const selectedGymLabel = useMemo(() => {
    if (!value.homeGymId) return null;
    return value.homeGymName ?? value.homeGymId;
  }, [value.homeGymId, value.homeGymName]);

  const isFetching = directoryQuery.isFetching || gymsQuery.isFetching;

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setOpen(true);
    onChange({ homeGymId: undefined, homeGymName: next.trim() || undefined });
  };

  const handleSelectSuggestion = (item: Suggestion) => {
    setQuery(item.name);
    setOpen(false);
    if (item.kind === 'gym') {
      onChange({ homeGymId: item.gym.id, homeGymName: item.name });
      return;
    }
    // Directory entries are catalog rows (not `gyms` FK) — store as free-text name.
    onChange({ homeGymId: undefined, homeGymName: item.name });
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
      {showDesc ? (
        <p className="form-section__desc home-gym-field__desc">{t('auth.homeGymDesc')}</p>
      ) : null}
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
      {open && trimmed.length > 0 && trimmed.length < 2 && !value.homeGymId ? (
        <ul className="home-gym-field__suggestions" role="listbox">
          <li className="home-gym-field__suggestion home-gym-field__suggestion--muted">
            {t('auth.homeGymMinChars')}
          </li>
        </ul>
      ) : null}
      {canSearch ? (
        <ul className="home-gym-field__suggestions" role="listbox">
          {isFetching ? (
            <li className="home-gym-field__suggestion home-gym-field__suggestion--muted">
              {t('auth.homeGymSearching')}
            </li>
          ) : suggestions.length > 0 ? (
            suggestions.map((item) => (
              <li key={`${item.kind}-${item.kind === 'gym' ? item.gym.id : item.entry.id}`}>
                <button
                  type="button"
                  className="home-gym-field__suggestion"
                  role="option"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <span className="home-gym-field__suggestion-name">{item.name}</span>
                  {item.kind === 'directory' && item.entry.locationLabel ? (
                    <span className="home-gym-field__suggestion-meta">{item.entry.locationLabel}</span>
                  ) : null}
                  {item.kind === 'gym' && item.gym.city ? (
                    <span className="home-gym-field__suggestion-meta">{item.gym.city}</span>
                  ) : null}
                </button>
              </li>
            ))
          ) : (
            <li className="home-gym-field__suggestion home-gym-field__suggestion--muted">
              <div>{t('auth.homeGymNotRegistered')}</div>
              <div className="home-gym-field__suggestion-meta">
                {t('auth.homeGymUseTyped', { name: trimmed })}
              </div>
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
