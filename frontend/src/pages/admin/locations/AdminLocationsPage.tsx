import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { locationApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

export function AdminLocationsPage() {
  const { t, i18n } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [countryCode, setCountryCode] = useState('KR');
  const [countryNameKo, setCountryNameKo] = useState('');
  const [countryNameEn, setCountryNameEn] = useState('');
  const [flagEmoji, setFlagEmoji] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  const [stateCode, setStateCode] = useState('');
  const [stateNameKo, setStateNameKo] = useState('');
  const [stateNameEn, setStateNameEn] = useState('');

  const [selectedStateId, setSelectedStateId] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [cityNameKo, setCityNameKo] = useState('');
  const [cityNameEn, setCityNameEn] = useState('');

  const countriesQuery = useQuery({
    queryKey: QUERY_KEYS.locationCountries,
    queryFn: async () => (await locationApi.countries()).data.data,
  });

  const statesQuery = useQuery({
    queryKey: QUERY_KEYS.locationStates(countryCode),
    queryFn: async () => (await locationApi.states(countryCode)).data.data,
    enabled: Boolean(countryCode),
  });

  const citiesQuery = useQuery({
    queryKey: QUERY_KEYS.locationCities(selectedStateId),
    queryFn: async () => (await locationApi.cities(selectedStateId)).data.data,
    enabled: Boolean(selectedStateId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['locations'] });
  };

  const countryMutation = useMutation({
    mutationFn: () =>
      locationApi.adminUpsertCountry({
        code: countryCode.toUpperCase(),
        name: { ko: countryNameKo || countryCode, en: countryNameEn || countryCode },
        flagEmoji: flagEmoji || undefined,
        defaultTimezone: timezone || 'UTC',
        isActive: true,
      }),
    onSuccess: async () => {
      showToast(t('locations.saved'), 'success');
      await invalidate();
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const stateMutation = useMutation({
    mutationFn: () =>
      locationApi.adminUpsertState({
        countryCode: countryCode.toUpperCase(),
        code: stateCode.trim(),
        name: { ko: stateNameKo || stateCode, en: stateNameEn || stateCode },
        isActive: true,
      }),
    onSuccess: async () => {
      showToast(t('locations.saved'), 'success');
      setStateCode('');
      setStateNameKo('');
      setStateNameEn('');
      await invalidate();
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const cityMutation = useMutation({
    mutationFn: () =>
      locationApi.adminUpsertCity({
        stateId: selectedStateId,
        code: cityCode.trim(),
        name: { ko: cityNameKo || cityCode, en: cityNameEn || cityCode },
        isActive: true,
      }),
    onSuccess: async () => {
      showToast(t('locations.saved'), 'success');
      setCityCode('');
      setCityNameKo('');
      setCityNameEn('');
      await invalidate();
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const nameOf = (name: { ko?: string; en?: string }) =>
    locale.startsWith('ko') ? name.ko || name.en || '' : name.en || name.ko || '';

  return (
    <PageShell title={t('locations.title')} subtitle={t('locations.subtitle')}>
      <section className="admin-table" style={{ marginBottom: '1.5rem' }}>
        <h3>{t('locations.addCountry')}</h3>
        <div className="card admin-table__row" style={{ display: 'grid', gap: '0.5rem' }}>
          <input
            className="input"
            placeholder={t('locations.code')}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            maxLength={2}
          />
          <input
            className="input"
            placeholder={t('locations.nameKo')}
            value={countryNameKo}
            onChange={(e) => setCountryNameKo(e.target.value)}
          />
          <input
            className="input"
            placeholder={t('locations.nameEn')}
            value={countryNameEn}
            onChange={(e) => setCountryNameEn(e.target.value)}
          />
          <input
            className="input"
            placeholder={t('locations.flag')}
            value={flagEmoji}
            onChange={(e) => setFlagEmoji(e.target.value)}
          />
          <input
            className="input"
            placeholder={t('locations.timezone')}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => countryMutation.mutate()}
            disabled={countryMutation.isPending || countryCode.length !== 2}
          >
            {t('locations.addCountry')}
          </button>
        </div>
        <ul style={{ marginTop: '0.75rem' }}>
          {(countriesQuery.data ?? []).slice(0, 30).map((c) => (
            <li key={c.code}>
              {c.flagEmoji ? `${c.flagEmoji} ` : ''}
              {nameOf(c.name)} ({c.code})
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-table" style={{ marginBottom: '1.5rem' }}>
        <h3>{t('locations.addState')}</h3>
        <div className="card admin-table__row" style={{ display: 'grid', gap: '0.5rem' }}>
          <select
            className="input"
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value);
              setSelectedStateId('');
            }}
          >
            {(countriesQuery.data ?? []).map((c) => (
              <option key={c.code} value={c.code}>
                {c.flagEmoji ? `${c.flagEmoji} ` : ''}
                {nameOf(c.name)}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t('locations.code')}
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          />
          <input
            className="input"
            placeholder={t('locations.nameKo')}
            value={stateNameKo}
            onChange={(e) => setStateNameKo(e.target.value)}
          />
          <input
            className="input"
            placeholder={t('locations.nameEn')}
            value={stateNameEn}
            onChange={(e) => setStateNameEn(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => stateMutation.mutate()}
            disabled={stateMutation.isPending || !stateCode.trim()}
          >
            {t('locations.addState')}
          </button>
        </div>
        <ul style={{ marginTop: '0.75rem' }}>
          {(statesQuery.data ?? []).map((s) => (
            <li key={s.id}>
              {nameOf(s.name)} ({s.code}) — {s.id}
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-table">
        <h3>{t('locations.addCity')}</h3>
        <div className="card admin-table__row" style={{ display: 'grid', gap: '0.5rem' }}>
          <select
            className="input"
            value={selectedStateId}
            onChange={(e) => setSelectedStateId(e.target.value)}
          >
            <option value="">{t('locations.selectStateFirst')}</option>
            {(statesQuery.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {nameOf(s.name)}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t('locations.code')}
            value={cityCode}
            onChange={(e) => setCityCode(e.target.value)}
          />
          <input
            className="input"
            placeholder={t('locations.nameKo')}
            value={cityNameKo}
            onChange={(e) => setCityNameKo(e.target.value)}
          />
          <input
            className="input"
            placeholder={t('locations.nameEn')}
            value={cityNameEn}
            onChange={(e) => setCityNameEn(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => cityMutation.mutate()}
            disabled={cityMutation.isPending || !selectedStateId || !cityCode.trim()}
          >
            {t('locations.addCity')}
          </button>
        </div>
        <ul style={{ marginTop: '0.75rem' }}>
          {(citiesQuery.data ?? []).map((c) => (
            <li key={c.id}>
              {nameOf(c.name)} ({c.code})
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
