import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  TRADE_CONDITIONS,
  type TradeCondition,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  LocationPicker,
  emptyLocationValue,
  type LocationPickerValue,
} from '@/components/location/LocationPicker';
import { machineApi, machineTradeApi, locationApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getLocalizedName } from '@/utils/localizedName';
import { tradeListRoute, tradeTypeFromWritePath } from '@/utils/tradeRoutes';
import '@/styles/components.css';
import '@/styles/trade.css';

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

function nameOf(name: { ko?: string; en?: string }, locale: string): string {
  return locale.startsWith('ko') ? name.ko || name.en || '' : name.en || name.ko || '';
}

function useLocationPathLabel(value: LocationPickerValue, locale: string): string {
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
    enabled: Boolean(value.cityId),
    staleTime: 300_000,
  });

  return useMemo(() => {
    const country = countriesQuery.data?.find((c) => c.code === value.countryCode);
    const state = statesQuery.data?.find((s) => s.id === value.stateId);
    const city = citiesQuery.data?.find((c) => c.id === value.cityId);
    const district = districtsQuery.data?.find((d) => d.id === value.districtId);
    const districtLabel =
      (district ? nameOf(district.name, locale) : null) || value.districtName.trim() || null;
    const parts = [
      country ? nameOf(country.name, locale) : null,
      state ? nameOf(state.name, locale) : null,
      city ? nameOf(city.name, locale) : null,
      districtLabel,
    ].filter(Boolean);
    return parts.join(' ');
  }, [
    countriesQuery.data,
    statesQuery.data,
    citiesQuery.data,
    districtsQuery.data,
    value,
    locale,
  ]);
}

export function TradeWritePage() {
  const { t, i18n } = useTranslation('trade');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [params] = useSearchParams();
  const machineCode = params.get('machineCode') || '';
  const tradeType = tradeTypeFromWritePath(location.pathname);

  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<TradeCondition | ''>('grade_a');
  const [quantity, setQuantity] = useState('1');
  const [region, setRegion] = useState<LocationPickerValue>(emptyLocationValue());
  const [regionLabel, setRegionLabel] = useState('');
  const [regionTouched, setRegionTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);

  const pathLabel = useLocationPathLabel(region, i18n.language);

  useEffect(() => {
    if (!regionTouched && pathLabel) setRegionLabel(pathLabel);
  }, [pathLabel, regionTouched]);

  const machineQuery = useQuery({
    queryKey: QUERY_KEYS.machine(machineCode),
    queryFn: async () => (await machineApi.getByCode(machineCode)).data.data,
    enabled: Boolean(machineCode),
  });

  useEffect(() => {
    return () => {
      for (const img of images) URL.revokeObjectURL(img.previewUrl);
    };
  }, [images]);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!machineQuery.data) throw new Error('machine');
      return machineTradeApi.create({
        tradeType,
        machineId: machineQuery.data.id,
        price: Number(price),
        condition: tradeType === 'sell' ? (condition || null) : null,
        quantity: Math.max(1, Number(quantity) || 1),
        regionLabel: regionLabel.trim(),
        countryCode: region.countryCode,
        stateId: region.stateId,
        cityId: region.cityId,
        districtId: region.districtId,
        description: description.trim(),
        files: images.map((img) => img.file),
      });
    },
    onSuccess: async (res) => {
      // Global staleTime is 5m; clear list caches so 구매/판매글 보기에 바로 반영.
      await queryClient.invalidateQueries({ queryKey: ['machine-trades'] });
      showToast(t('createSuccess'), 'success');
      const listPath = tradeListRoute(res.data.data.tradeType);
      const q = machineCode ? `?machineCode=${encodeURIComponent(machineCode)}` : '';
      navigate(`${listPath}${q}`);
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next = [...images];
    for (const file of Array.from(fileList)) {
      if (next.length >= 10) break;
      if (!file.type.startsWith('image/')) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setImages(next);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const canSubmit = useMemo(() => {
    if (!machineQuery.data) return false;
    if (!price.trim() || Number.isNaN(Number(price)) || Number(price) < 0) return false;
    if (!regionLabel.trim()) return false;
    if (tradeType === 'sell' && !condition) return false;
    return true;
  }, [condition, machineQuery.data, price, regionLabel, tradeType]);

  const title = tradeType === 'sell' ? t('sellWrite') : t('buyWrite');
  const listRoute = `${tradeListRoute(tradeType)}${
    machineCode ? `?machineCode=${encodeURIComponent(machineCode)}` : ''
  }`;

  if (!machineCode) {
    return (
      <PageShell title={title}>
        <div className="card trade-empty">{t('machineRequired')}</div>
      </PageShell>
    );
  }

  if (machineQuery.isLoading) {
    return (
      <PageShell title={title}>
        <Skeleton count={3} height={88} />
      </PageShell>
    );
  }

  if (!machineQuery.data) {
    return (
      <PageShell title={title}>
        <div className="card trade-empty">{t('machineRequired')}</div>
      </PageShell>
    );
  }

  const machine = machineQuery.data;
  const brandName = getLocalizedName(machine.brandName, i18n.language, '');
  const machineName = getLocalizedName(machine.name, i18n.language, machine.code);

  return (
    <PageShell title={title} subtitle={t('writeHint')}>
      <div className="card trade-write__auto">
        <strong>{t('autoFields')}</strong>
        <div className="trade-write__auto-media">
          {machine.primaryImageUrl ? (
            <img src={machine.primaryImageUrl} alt="" />
          ) : (
            <div style={{ width: 72, height: 72 }} />
          )}
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {t('brand')}: {brandName || '—'}
            </div>
            <div style={{ fontWeight: 700 }}>
              {t('machine')}: {machineName}
            </div>
          </div>
        </div>
      </div>

      <form
        className="card"
        style={{ padding: '1rem', display: 'grid', gap: '0.85rem' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit || createMutation.isPending) return;
          createMutation.mutate();
        }}
      >
        <div className="form-row">
          <label htmlFor="trade-price">
            {tradeType === 'buy' ? t('hopePrice') : t('price')}
          </label>
          <input
            id="trade-price"
            className="input"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {tradeType === 'sell' ? (
          <>
            <div className="form-row">
              <label htmlFor="trade-condition">{t('condition')}</label>
              <select
                id="trade-condition"
                className="input"
                value={condition}
                onChange={(e) => setCondition(e.target.value as TradeCondition)}
                required
              >
                {TRADE_CONDITIONS.map((value) => (
                  <option key={value} value={value}>
                    {t(`conditions.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="trade-qty">{t('quantity')}</label>
              <input
                id="trade-qty"
                className="input"
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <div className="form-row">
          <span>{t('region')}</span>
          <LocationPicker
            value={region}
            onChange={(next) => {
              setRegion(next);
              setRegionTouched(false);
            }}
            showDistrict
            required={false}
          />
        </div>

        <div className="form-row">
          <label htmlFor="trade-region-label">{t('regionLabel')}</label>
          <input
            id="trade-region-label"
            className="input"
            value={regionLabel}
            onChange={(e) => {
              setRegionTouched(true);
              setRegionLabel(e.target.value);
            }}
            required
          />
          <small style={{ color: 'var(--color-text-muted)' }}>{t('regionLabelHint')}</small>
        </div>

        <div className="form-row">
          <label htmlFor="trade-desc">{t('description')}</label>
          <textarea
            id="trade-desc"
            className="input"
            rows={5}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {tradeType === 'sell' ? (
          <div className="form-row">
            <label htmlFor="trade-photos">{t('selectPhotos')}</label>
            <input
              id="trade-photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
            />
            {images.length ? (
              <div className="trade-write__previews">
                {images.map((img) => (
                  <div key={img.id} className="trade-write__preview">
                    <img src={img.previewUrl} alt="" />
                    <div className="trade-write__preview-actions">
                      <button type="button" onClick={() => removeImage(img.id)}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending ? '…' : t('submit')}
          </button>
          <Link to={listRoute} className="btn btn--secondary">
            {t('cancel')}
          </Link>
        </div>
      </form>
    </PageShell>
  );
}
