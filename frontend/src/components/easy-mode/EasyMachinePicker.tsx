import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  isFreeWeightMachineCode,
  TARGET_MUSCLE_GROUPS,
  type Machine,
  type TargetMuscleGroup,
} from '@machinefit/shared';
import { brandApi, machineApi } from '@/api';
import { BrandFilterChips } from '@/components/machines/BrandFilterChips/BrandFilterChips';
import { FilterChips } from '@/components/machines/FilterChips/FilterChips';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { MachineHero } from '@/components/machines/MachineHero/MachineHero';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/machines.css';

export interface EasyMachinePickResult {
  code: string;
  name: string;
  brandName?: string;
  targetMuscle: TargetMuscleGroup | null;
}

interface EasyMachinePickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (pick: EasyMachinePickResult) => void;
  /** Open directly on detail for a known code (recent/favorites). */
  initialCode?: string | null;
}

export function EasyMachinePicker({
  open,
  onClose,
  onConfirm,
  initialCode = null,
}: EasyMachinePickerProps) {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [brandCode, setBrandCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<Machine | null>(null);
  const [targetMuscle, setTargetMuscle] = useState<TargetMuscleGroup | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setMuscleGroup(null);
    setBrandCode(null);
    setDetail(null);
    setTargetMuscle(null);

    if (!initialCode) return;
    let cancelled = false;
    setDetailLoading(true);
    void machineApi
      .getByCode(initialCode)
      .then((res) => {
        if (cancelled) return;
        setDetail(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, initialCode]);

  const { data: brands = [] } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => (await brandApi.list()).data.data,
    staleTime: 10 * 60_000,
    enabled: open,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QUERY_KEYS.machines, 'easy-picker', debouncedQuery, muscleGroup, brandCode],
    queryFn: async (): Promise<Machine[]> => {
      const params: Record<string, string | number> = { limit: 100 };
      if (muscleGroup) params.muscleGroup = muscleGroup;
      if (brandCode) params.brandCode = brandCode;
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      const res = await machineApi.list(params);
      return res.data.data.items;
    },
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    enabled: open && !detail && !detailLoading,
  });

  if (!open) return null;

  const needsMuscle = detail ? isFreeWeightMachineCode(detail.code) : false;
  const canConfirm = Boolean(detail) && (!needsMuscle || Boolean(targetMuscle));
  const hasFilters = !!debouncedQuery.trim() || !!muscleGroup || !!brandCode;

  const confirm = () => {
    if (!detail) return;
    if (needsMuscle && !targetMuscle) return;
    const name = getLocalizedName(detail.name, i18n.language, detail.code);
    const brand =
      detail.brandName && !isFreeWeightMachineCode(detail.code)
        ? getLocalizedName(detail.brandName, i18n.language, '')
        : undefined;
    onConfirm({
      code: detail.code,
      name,
      brandName: brand || undefined,
      targetMuscle: needsMuscle ? targetMuscle : null,
    });
  };

  return (
    <div className="easy-picker" role="dialog" aria-modal="true" aria-label={t('easyMode.pickerTitle')}>
      <div className="easy-picker__top">
        <button
          type="button"
          className="easy-shell__icon-btn"
          onClick={() => {
            if (detail) {
              setDetail(null);
              setTargetMuscle(null);
              return;
            }
            onClose();
          }}
          aria-label={t('easyMode.back')}
        >
          ←
        </button>
        <h2 className="easy-shell__title">
          {detail ? t('easyMode.pickerDetailTitle') : t('easyMode.pickerTitle')}
        </h2>
        <button
          type="button"
          className="easy-shell__icon-btn"
          onClick={onClose}
          aria-label={t('easyMode.close')}
        >
          ✕
        </button>
      </div>

      <div className="easy-picker__body">
        {detailLoading ? (
          <Skeleton count={3} height={72} />
        ) : detail ? (
          <>
            <MachineHero machine={detail} />
            {needsMuscle ? (
              <>
                <p className="easy-list__label">{t('easyMode.muscleTitle')}</p>
                <div className="easy-muscle-grid">
                  {TARGET_MUSCLE_GROUPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      className={`easy-fit__btn${targetMuscle === group ? ' easy-fit__btn--on' : ''}`}
                      onClick={() => setTargetMuscle(group)}
                    >
                      {t(`machines:muscleGroups.${group}`, { defaultValue: group })}
                    </button>
                  ))}
                </div>
                {!targetMuscle ? <p className="easy-hint">{t('easyMode.needMuscle')}</p> : null}
              </>
            ) : null}
          </>
        ) : (
          <div className="machine-search easy-picker__search">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={t('machines:searchPlaceholder')}
            />
            <FilterChips value={muscleGroup} onChange={setMuscleGroup} />
            <BrandFilterChips brands={brands} value={brandCode} onChange={setBrandCode} />
            {isLoading && !data ? (
              <Skeleton count={5} height={72} />
            ) : !data?.length ? (
              <MachineEmptyState hasQuery={hasFilters} />
            ) : (
              <div className={`machine-list${isFetching ? ' machine-list--fetching' : ''}`}>
                {data.map((machine) => (
                  <MachineListItem
                    key={machine.id}
                    machine={machine}
                    selectedMuscle={muscleGroup}
                    onSelect={(m) => {
                      setDetail(m);
                      if (
                        isFreeWeightMachineCode(m.code) &&
                        muscleGroup &&
                        (TARGET_MUSCLE_GROUPS as readonly string[]).includes(muscleGroup)
                      ) {
                        setTargetMuscle(muscleGroup as TargetMuscleGroup);
                      } else {
                        setTargetMuscle(null);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {detail && !detailLoading ? (
        <div className="easy-picker__footer">
          <button
            type="button"
            className="easy-btn easy-btn--primary"
            disabled={!canConfirm}
            onClick={confirm}
          >
            {t('easyMode.pickerConfirm')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
