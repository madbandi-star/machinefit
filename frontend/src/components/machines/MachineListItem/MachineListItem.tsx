import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/query-keys';
import { queryClient } from '@/app/providers/QueryProvider';
import { machineApi } from '@/api';
import { getLocalizedName } from '@/utils/localizedName';
import {
  shouldShowDefaultMachineMuscle,
  stripBrandFromMachineName,
} from '@/utils/freeWeightDisplay';
import { SafeImage } from '@/components/media/SafeImage';
import {
  StandardMachineImageBadge,
  StandardMachineImageCaption,
} from '@/components/machines/StandardMachineImageBadge/StandardMachineImageBadge';
import {
  isStandardMachineImageUrl,
  machinePlaceholderUrl,
  resolveMachineImageUrl,
} from '@/utils/catalogAssets';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useAuthStore } from '@/store/auth.store';
import { seedMachineDetailCache } from '@/utils/machineDetailCache';
import '@/styles/machines.css';

interface MachineListItemProps {
  machine: Machine;
  selectedMuscle?: string | null;
  /** When set, select in-place instead of navigating to detail (Easy mode picker). */
  onSelect?: (machine: Machine) => void;
  /** Seed favorite state from a list query to avoid N+1 checks. */
  initialFavorited?: boolean | null;
  initialFavoriteId?: string;
  showFavorite?: boolean;
  /** Forwarded as ?planDate= for workout plan creation. */
  planDate?: string | null;
  /** When true, show that this machine is already on the plan for planDate. */
  alreadyPlanned?: boolean;
}

function prefetchMachineDetail(machineCode: string, muscle?: string | null) {
  const muscleKey = muscle || undefined;
  void queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.machine(machineCode, muscleKey),
    queryFn: async () =>
      (
        await machineApi.getByCode(
          machineCode,
          muscleKey ? { muscle: muscleKey } : undefined
        )
      ).data.data,
    staleTime: 5 * 60_000,
  });
  if (muscleKey) {
    void queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.machine(machineCode),
      queryFn: async () => (await machineApi.getByCode(machineCode)).data.data,
      staleTime: 5 * 60_000,
    });
  }
}

function warmMachineDetailFromList(machine: Machine, muscle?: string | null) {
  seedMachineDetailCache(queryClient, machine, muscle);
  prefetchMachineDetail(machine.code, isFreeWeightMachineCode(machine.code) ? muscle : null);
}

function MachineFavoriteButton({
  machineCode,
  initialFavorited,
  initialFavoriteId,
}: {
  machineCode: string;
  initialFavorited?: boolean | null;
  initialFavoriteId?: string;
}) {
  const { t } = useTranslation('machines');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isFavorited, toggleFavorite, isPending, canFavorite } = useFavoriteToggle({
    machineCode,
    isAuthenticated,
    initialFavorited,
    initialFavoriteId,
  });

  return (
    <button
      type="button"
      className={`machine-list-item__favorite${isFavorited ? ' is-active' : ''}`}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? t('recommendation.removeFavorite') : t('recommendation.saveFavorite')}
      disabled={isPending || !canFavorite}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleFavorite();
      }}
    >
      <Heart size={17} strokeWidth={2.1} fill={isFavorited ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
}

export function MachineListItem({
  machine,
  selectedMuscle,
  onSelect,
  initialFavorited = null,
  initialFavoriteId,
  showFavorite = !onSelect,
  planDate = null,
  alreadyPlanned = false,
}: MachineListItemProps) {
  const { t, i18n } = useTranslation('machines');
  const localizedName = getLocalizedName(machine.name, i18n.language, '');
  const isFreeWeight = isFreeWeightMachineCode(machine.code);
  const showMuscle = shouldShowDefaultMachineMuscle(machine.code);
  /** Free-weight + muscle "전체": show every target label (display only). */
  const showAllFreeWeightMuscles = isFreeWeight && !selectedMuscle;
  /** Free-weight list under a muscle chip shows the selected target (e.g. biceps/triceps). */
  const displayMuscle =
    isFreeWeight && selectedMuscle
      ? selectedMuscle
      : showMuscle
        ? machine.muscleGroup
        : machine.muscleGroup || undefined;
  const muscleLabel = displayMuscle
    ? t(`muscleGroups.${displayMuscle}`, { defaultValue: displayMuscle })
    : null;
  const brandName = machine.brandName
    ? getLocalizedName(machine.brandName, i18n.language, '')
    : null;
  const typeLabel = isFreeWeight ? t('machineTypes.free_weight') : null;
  const brandOrType = brandName || typeLabel;
  const displayName = stripBrandFromMachineName(localizedName, brandName);
  const imageUrl = resolveMachineImageUrl(machine.code, machine.primaryImageUrl);
  const showStandardImageBadge = isStandardMachineImageUrl(imageUrl);

  const detailPath = ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code);
  const detailParams = new URLSearchParams();
  if (selectedMuscle && isFreeWeight) {
    detailParams.set('muscle', selectedMuscle);
  }
  if (planDate) {
    detailParams.set('planDate', planDate);
    detailParams.set('logDate', planDate);
  }
  const detailQuery = detailParams.toString();
  const detailTo = detailQuery ? `${detailPath}?${detailQuery}` : detailPath;

  const main = (
    <>
      <div className="machine-list-item__thumb">
        {imageUrl ? (
          <>
            <SafeImage
              src={imageUrl}
              fallbackSrc={machinePlaceholderUrl()}
              alt=""
              loading="lazy"
              width={72}
              height={72}
            />
            {showStandardImageBadge ? <StandardMachineImageBadge /> : null}
          </>
        ) : displayMuscle ? (
          <div className="machine-list-item__muscle-icon" aria-hidden>
            <MuscleGroupIcon group={displayMuscle as MuscleGroup} size={52} />
          </div>
        ) : (
          <SafeImage
            className="machine-list-item__placeholder-img"
            src={machinePlaceholderUrl()}
            alt=""
            loading="lazy"
            width={72}
            height={72}
          />
        )}
      </div>
      <div className="machine-list-item__body">
        <p className="machine-list-item__name">
          <span className="machine-list-item__name-text">{displayName}</span>
          {alreadyPlanned ? (
            <span className="machine-list-item__planned-badge">{t('history.planAlreadyAdded')}</span>
          ) : null}
        </p>
        {showStandardImageBadge ? <StandardMachineImageCaption /> : null}
        {showAllFreeWeightMuscles ? (
          <div className="machine-list-item__muscle-list" aria-label={t('targetMuscleLabel')}>
            {MUSCLE_GROUPS.map((group) => (
              <span key={group} className="machine-list-item__muscle">
                <MuscleGroupIcon
                  group={group}
                  size={16}
                  className="machine-list-item__muscle-badge"
                />
                <span>{t(`muscleGroups.${group}`)}</span>
              </span>
            ))}
          </div>
        ) : muscleLabel && displayMuscle ? (
          <p className="machine-list-item__muscle">
            <MuscleGroupIcon
              group={displayMuscle as MuscleGroup}
              size={18}
              className="machine-list-item__muscle-badge"
            />
            <span>{muscleLabel}</span>
          </p>
        ) : null}
        {brandOrType ? <p className="machine-list-item__brand">{brandOrType}</p> : null}
      </div>
    </>
  );

  const actions = (
    <div className="machine-list-item__aside">
      {showFavorite ? (
        <MachineFavoriteButton
          machineCode={machine.code}
          initialFavorited={initialFavorited}
          initialFavoriteId={initialFavoriteId}
        />
      ) : null}
      {!onSelect ? (
        <span className="machine-list-item__chevron" aria-hidden>
          ›
        </span>
      ) : null}
    </div>
  );

  if (onSelect) {
    return (
      <div className={`machine-list-item${alreadyPlanned ? ' machine-list-item--planned' : ''}`}>
        <button
          type="button"
          className="machine-list-item__main"
          onClick={() => onSelect(machine)}
          onMouseEnter={() =>
            warmMachineDetailFromList(
              machine,
              isFreeWeight && selectedMuscle ? selectedMuscle : null
            )
          }
          onTouchStart={() =>
            warmMachineDetailFromList(
              machine,
              isFreeWeight && selectedMuscle ? selectedMuscle : null
            )
          }
        >
          {main}
        </button>
        {actions}
      </div>
    );
  }

  return (
    <div className={`machine-list-item${alreadyPlanned ? ' machine-list-item--planned' : ''}`}>
      <Link
        to={detailTo}
        className="machine-list-item__main"
        onClick={() =>
          warmMachineDetailFromList(
            machine,
            isFreeWeight && selectedMuscle ? selectedMuscle : null
          )
        }
        onMouseEnter={() =>
          warmMachineDetailFromList(
            machine,
            isFreeWeight && selectedMuscle ? selectedMuscle : null
          )
        }
        onTouchStart={() =>
          warmMachineDetailFromList(
            machine,
            isFreeWeight && selectedMuscle ? selectedMuscle : null
          )
        }
      >
        {main}
      </Link>
      {actions}
    </div>
  );
}
