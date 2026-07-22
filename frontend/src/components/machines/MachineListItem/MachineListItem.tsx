import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/query-keys';
import { queryClient } from '@/app/providers/QueryProvider';
import { machineApi } from '@/api';
import { getLocalizedName } from '@/utils/localizedName';
import { shouldShowDefaultMachineMuscle } from '@/utils/freeWeightDisplay';
import { machinePlaceholderUrl, resolveMachineImageUrl } from '@/utils/catalogAssets';
import '@/styles/machines.css';

interface MachineListItemProps {
  machine: Machine;
  selectedMuscle?: string | null;
}

function prefetchMachineDetail(machineCode: string) {
  void queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.machine(machineCode),
    queryFn: async () => (await machineApi.getByCode(machineCode)).data.data,
    staleTime: 5 * 60_000,
  });
}

export function MachineListItem({ machine, selectedMuscle }: MachineListItemProps) {
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
        : undefined;
  const brandName =
    machine.brandName && !isFreeWeight
      ? getLocalizedName(machine.brandName, i18n.language, '')
      : null;
  const typeLabel = isFreeWeight ? t('machineTypes.free_weight') : null;
  const imageUrl = resolveMachineImageUrl(machine.code, machine.primaryImageUrl);

  const detailPath = ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code);
  const detailTo =
    selectedMuscle && isFreeWeight
      ? `${detailPath}?muscle=${encodeURIComponent(selectedMuscle)}`
      : detailPath;

  return (
    <Link
      to={detailTo}
      className="machine-list-item"
      onMouseEnter={() => prefetchMachineDetail(machine.code)}
      onTouchStart={() => prefetchMachineDetail(machine.code)}
    >
      <div className="machine-list-item__thumb">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" width={72} height={72} />
        ) : displayMuscle ? (
          <div className="machine-list-item__muscle-icon" aria-hidden>
            <MuscleGroupIcon group={displayMuscle as MuscleGroup} size={52} />
          </div>
        ) : (
          <img
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
          <MachineNameWithMuscle
            muscleGroup={displayMuscle}
            name={localizedName}
            iconSize={20}
            labelClassName="machine-list-item__name-text"
          />
        </p>
        {typeLabel ? (
          <p className="machine-list-item__brand">{typeLabel}</p>
        ) : brandName ? (
          <p className="machine-list-item__brand">{brandName}</p>
        ) : null}
      </div>
      <span className="machine-list-item__chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
}
