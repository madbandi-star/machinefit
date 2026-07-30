import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/query-keys';
import { queryClient } from '@/app/providers/QueryProvider';
import { machineApi } from '@/api';
import { getLocalizedName } from '@/utils/localizedName';
import { shouldShowDefaultMachineMuscle } from '@/utils/freeWeightDisplay';
import { SafeImage } from '@/components/media/SafeImage';
import { machinePlaceholderUrl, resolveMachineImageUrl } from '@/utils/catalogAssets';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useAuthStore } from '@/store/auth.store';
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
}

function prefetchMachineDetail(machineCode: string) {
  void queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.machine(machineCode),
    queryFn: async () => (await machineApi.getByCode(machineCode)).data.data,
    staleTime: 5 * 60_000,
  });
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
}: MachineListItemProps) {
  const { t, i18n } = useTranslation('machines');
  const localizedName = getLocalizedName(machine.name, i18n.language, '');
  const isFreeWeight = isFreeWeightMachineCode(machine.code);
  const showMuscle = shouldShowDefaultMachineMuscle(machine.code);
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
  const imageUrl = resolveMachineImageUrl(machine.code, machine.primaryImageUrl);

  const detailPath = ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code);
  const detailTo =
    selectedMuscle && isFreeWeight
      ? `${detailPath}?muscle=${encodeURIComponent(selectedMuscle)}`
      : detailPath;

  const main = (
    <>
      <div className="machine-list-item__thumb">
        {imageUrl ? (
          <SafeImage
            src={imageUrl}
            fallbackSrc={machinePlaceholderUrl()}
            alt=""
            loading="lazy"
            width={72}
            height={72}
          />
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
          <span className="machine-list-item__name-text">{localizedName}</span>
        </p>
        {muscleLabel && displayMuscle ? (
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
      <div className="machine-list-item">
        <button
          type="button"
          className="machine-list-item__main"
          onClick={() => onSelect(machine)}
          onMouseEnter={() => prefetchMachineDetail(machine.code)}
          onTouchStart={() => prefetchMachineDetail(machine.code)}
        >
          {main}
        </button>
        {actions}
      </div>
    );
  }

  return (
    <div className="machine-list-item">
      <Link
        to={detailTo}
        className="machine-list-item__main"
        onMouseEnter={() => prefetchMachineDetail(machine.code)}
        onTouchStart={() => prefetchMachineDetail(machine.code)}
      >
        {main}
      </Link>
      {actions}
    </div>
  );
}
