import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { GymCard } from '@/components/cards/GymCard/GymCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { gymApi, machineApi } from '@/api';
import { getLocalizedName } from '@/utils/localizedName';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/gym.css';

export function GymFinderPage() {
  const { t, i18n } = useTranslation('gyms');
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useUIStore((s) => s.showToast);

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [machineCode, setMachineCode] = useState(searchParams.get('machineCode') ?? '');
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: machines } = useQuery({
    queryKey: QUERY_KEYS.machines,
    queryFn: async () => {
      const res = await machineApi.list({ limit: 50 });
      return res.data.data.items;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.gyms, query, city, machineCode, nearbyCoords],
    queryFn: async () => {
      if (nearbyCoords) {
        const res = await gymApi.nearby(nearbyCoords.lat, nearbyCoords.lng, {
          radius: 50,
          machineCode: machineCode || undefined,
        });
        return { items: res.data.data, meta: { total: res.data.data.length } };
      }
      const params: Record<string, string | number> = { limit: 20 };
      if (query) params.q = query;
      if (city) params.city = city;
      if (machineCode) params.machineCode = machineCode;
      const res = await gymApi.list(params);
      return res.data.data;
    },
  });

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      showToast(t('locationError'), 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearbyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        showToast(t('locationError'), 'error');
        setLocating(false);
      }
    );
  };

  const handleSearch = () => {
    setNearbyCoords(null);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    if (machineCode) params.set('machineCode', machineCode);
    setSearchParams(params);
  };

  return (
    <PageShell title={t('title')} subtitle={t('subtitle')}>
      <div className="gym-filters">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          placeholder={t('searchPlaceholder')}
        />
        <div className="gym-filters__row">
          <input
            className="input"
            style={{ flex: 1, minWidth: 120 }}
            placeholder={t('filterCity')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <select
            className="input"
            style={{ flex: 1, minWidth: 140 }}
            value={machineCode}
            onChange={(e) => setMachineCode(e.target.value)}
          >
            <option value="">{t('allMachines')}</option>
            {machines?.map((m) => (
              <option key={m.code} value={m.code}>
                {getLocalizedName(m.name, i18n.language, '')}
              </option>
            ))}
          </select>
        </div>
        <div className="gym-filters__row">
          <button className="btn btn--primary" onClick={handleSearch}>
            {t('actions.search')}
          </button>
          <button
            className="btn btn--secondary"
            onClick={handleNearMe}
            disabled={locating}
          >
            📍 {locating ? t('locating') : t('nearMe')}
          </button>
          {nearbyCoords && (
            <button
              className="btn btn--secondary"
              onClick={() => setNearbyCoords(null)}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Skeleton count={4} height={100} />
      ) : data?.items.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('noResults')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data?.items.map((gym) => (
            <GymCard key={gym.id} gym={gym} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
