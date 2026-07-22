import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { LocationRef, LocationVisibility } from '@machinefit/shared';
import { locationApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import './LocationPicker.css';

export interface LocationPickerValue {
  countryCode: string | null;
  stateId: string | null;
  cityId: string | null;
  districtId: string | null;
  districtName: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  visibility?: LocationVisibility;
}

interface LocationPickerProps {
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
  showDistrict?: boolean;
  showVisibility?: boolean;
  showGps?: boolean;
  required?: boolean;
  disabled?: boolean;
}

function nameOf(name: { ko?: string; en?: string }, locale: string): string {
  return locale.startsWith('ko') ? name.ko || name.en || '' : name.en || name.ko || '';
}

export function emptyLocationValue(): LocationPickerValue {
  return {
    countryCode: null,
    stateId: null,
    cityId: null,
    districtId: null,
    districtName: '',
    postalCode: '',
    latitude: null,
    longitude: null,
    visibility: 'gym',
  };
}

export function locationValueFromRef(ref?: LocationRef | null): LocationPickerValue {
  if (!ref?.countryCode) return emptyLocationValue();
  return {
    countryCode: ref.countryCode,
    stateId: ref.stateId,
    cityId: ref.cityId,
    districtId: ref.districtId,
    districtName: ref.districtName ?? '',
    postalCode: ref.postalCode ?? '',
    latitude: ref.latitude ?? null,
    longitude: ref.longitude ?? null,
    visibility: (ref as { visibility?: LocationVisibility }).visibility ?? 'gym',
  };
}

export function LocationPicker({
  value,
  onChange,
  showDistrict = true,
  showVisibility = false,
  showGps = true,
  required = false,
  disabled = false,
}: LocationPickerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isKr = value.countryCode === 'KR' || locale.startsWith('ko');
  const [districtQuery, setDistrictQuery] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const labelState = isKr ? t('location.stateKr') : t('location.state');
  const labelCity = isKr ? t('location.cityKr') : t('location.city');
  const labelDistrict = isKr ? t('location.districtKr') : t('location.district');

  const countriesQuery = useQuery({
    queryKey: QUERY_KEYS.locationCountries,
    queryFn: async () => (await locationApi.countries()).data.data,
    staleTime: 300_000,
  });

  const statesQuery = useQuery({
    queryKey: QUERY_KEYS.locationStates(value.countryCode ?? ''),
    queryFn: async () => (await locationApi.states(value.countryCode!)).data.data,
    enabled: Boolean(value.countryCode),
    staleTime: 300_000,
  });

  const citiesQuery = useQuery({
    queryKey: QUERY_KEYS.locationCities(value.stateId ?? ''),
    queryFn: async () => (await locationApi.cities(value.stateId!)).data.data,
    enabled: Boolean(value.stateId),
    staleTime: 300_000,
  });

  const districtsQuery = useQuery({
    queryKey: QUERY_KEYS.locationDistricts(value.cityId ?? ''),
    queryFn: async () => (await locationApi.districts(value.cityId!)).data.data,
    enabled: Boolean(showDistrict && value.cityId),
    staleTime: 300_000,
  });

  const countries = countriesQuery.data ?? [];

  const filteredDistricts = useMemo(() => {
    const list = districtsQuery.data ?? [];
    const q = districtQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => nameOf(d.name, locale).toLowerCase().includes(q));
  }, [districtsQuery.data, districtQuery, locale]);

  const pathLabel = useMemo(() => {
    const country = countriesQuery.data?.find((c) => c.code === value.countryCode);
    const state = statesQuery.data?.find((s) => s.id === value.stateId);
    const city = citiesQuery.data?.find((c) => c.id === value.cityId);
    const district = districtsQuery.data?.find((d) => d.id === value.districtId);
    const districtLabel =
      (district ? nameOf(district.name, locale) : null) || value.districtName.trim() || null;
    const parts = [
      country ? `${country.flagEmoji ?? ''} ${nameOf(country.name, locale)}`.trim() : null,
      state ? nameOf(state.name, locale) : null,
      city ? nameOf(city.name, locale) : null,
      districtLabel,
    ].filter(Boolean);
    return parts.join(' > ');
  }, [
    countriesQuery.data,
    statesQuery.data,
    citiesQuery.data,
    districtsQuery.data,
    value,
    locale,
  ]);

  const handleGps = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError(t('location.gpsUnsupported'));
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await locationApi.reverseGeocode({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          const hit = res.data.data;
          if (!hit?.countryCode) {
            setGpsError(t('location.gpsNoMatch'));
            return;
          }
          onChange({
            ...value,
            countryCode: hit.countryCode,
            stateId: hit.stateId,
            cityId: hit.cityId,
            districtId: hit.districtId,
            districtName: hit.districtName ?? '',
            latitude: hit.latitude ?? pos.coords.latitude,
            longitude: hit.longitude ?? pos.coords.longitude,
          });
        } catch {
          setGpsError(t('location.gpsFailed'));
        } finally {
          setGpsBusy(false);
        }
      },
      () => {
        setGpsBusy(false);
        setGpsError(t('location.gpsDenied'));
      },
      { enableHighAccuracy: false, timeout: 12000 }
    );
  };

  const districts = districtsQuery.data ?? [];
  const hasDistrictCatalog = districts.length > 0;

  return (
    <div className={`location-picker${disabled ? ' is-disabled' : ''}`}>
      {pathLabel && <p className="location-picker__path">{pathLabel}</p>}

      <label className="location-picker__field">
        <span>
          {t('location.country')}
          {required ? ' *' : ''}
        </span>
        <select
          className="input"
          value={value.countryCode ?? ''}
          disabled={disabled}
          onChange={(e) => {
            const code = e.target.value || null;
            setDistrictQuery('');
            onChange({
              ...value,
              countryCode: code,
              stateId: null,
              cityId: null,
              districtId: null,
              districtName: '',
            });
          }}
        >
          <option value="">{t('location.selectCountry')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flagEmoji ? `${c.flagEmoji} ` : ''}
              {nameOf(c.name, locale)} ({c.code})
            </option>
          ))}
        </select>
      </label>

      <label className="location-picker__field">
        <span>
          {labelState}
          {required ? ' *' : ''}
        </span>
        <select
          className="input"
          value={value.stateId ?? ''}
          disabled={disabled || !value.countryCode}
          onChange={(e) => {
            setDistrictQuery('');
            onChange({
              ...value,
              stateId: e.target.value || null,
              cityId: null,
              districtId: null,
              districtName: '',
            });
          }}
        >
          <option value="">{t('location.selectState')}</option>
          {(statesQuery.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {nameOf(s.name, locale)}
            </option>
          ))}
        </select>
      </label>

      <label className="location-picker__field">
        <span>
          {labelCity}
          {required ? ' *' : ''}
        </span>
        <select
          className="input"
          value={value.cityId ?? ''}
          disabled={disabled || !value.stateId}
          onChange={(e) => {
            setDistrictQuery('');
            onChange({
              ...value,
              cityId: e.target.value || null,
              districtId: null,
              districtName: '',
            });
          }}
        >
          <option value="">{isKr ? t('location.selectCityKr') : t('location.selectCity')}</option>
          {(citiesQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {nameOf(c.name, locale)}
            </option>
          ))}
        </select>
      </label>

      {showDistrict && (
        <div className="location-picker__field">
          <span>{labelDistrict}</span>
          {hasDistrictCatalog ? (
            <>
              <input
                className="input"
                type="search"
                value={districtQuery}
                disabled={disabled || !value.cityId}
                onChange={(e) => setDistrictQuery(e.target.value)}
                placeholder={t('location.searchDistrict')}
              />
              <select
                className="input"
                value={value.districtId ?? ''}
                disabled={disabled || !value.cityId}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const hit = districts.find((d) => d.id === id);
                  onChange({
                    ...value,
                    districtId: id,
                    districtName: hit ? nameOf(hit.name, locale) : '',
                  });
                }}
              >
                <option value="">
                  {isKr ? t('location.selectDistrictKr') : t('location.selectDistrict')}
                </option>
                {filteredDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {nameOf(d.name, locale)}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <input
              className="input"
              value={value.districtName}
              disabled={disabled || !value.cityId}
              onChange={(e) =>
                onChange({
                  ...value,
                  districtId: null,
                  districtName: e.target.value,
                })
              }
              placeholder={t('location.districtNamePlaceholder')}
            />
          )}
          {!hasDistrictCatalog && value.cityId ? (
            <p className="location-picker__hint">{t('location.districtNameHint')}</p>
          ) : null}
        </div>
      )}

      {showVisibility && (
        <label className="location-picker__field">
          <span>{t('location.visibility')}</span>
          <select
            className="input"
            value={value.visibility ?? 'gym'}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...value,
                visibility: e.target.value as LocationVisibility,
              })
            }
          >
            <option value="hidden">{t('location.visibilityHidden')}</option>
            <option value="country">{t('location.visibilityCountry')}</option>
            <option value="city">{t('location.visibilityCity')}</option>
            <option value="gym">{t('location.visibilityGym')}</option>
          </select>
        </label>
      )}

      {showGps && (
        <div className="location-picker__gps">
          <button
            type="button"
            className="btn btn--secondary btn--block"
            disabled={disabled || gpsBusy}
            onClick={handleGps}
          >
            {gpsBusy ? t('location.gpsLoading') : t('location.useCurrent')}
          </button>
          {gpsError && <p className="location-picker__error">{gpsError}</p>}
          <p className="location-picker__hint">{t('location.gpsHint')}</p>
        </div>
      )}
    </div>
  );
}
