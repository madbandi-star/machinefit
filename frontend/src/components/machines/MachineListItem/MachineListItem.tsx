import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import { getLocalizedName } from '@/utils/localizedName';
import { shouldShowDefaultMachineMuscle } from '@/utils/freeWeightDisplay';
import '@/styles/machines.css';

interface MachineListItemProps {
  machine: Machine;
  selectedMuscle?: string | null;
}

export function MachineListItem({ machine, selectedMuscle }: MachineListItemProps) {
  const { t, i18n } = useTranslation('machines');
  const localizedName = getLocalizedName(machine.name, i18n.language, '');
  const isFreeWeight = isFreeWeightMachineCode(machine.code);
  const showMuscle = shouldShowDefaultMachineMuscle(machine.code);
  const brandName =
    machine.brandName && !isFreeWeight
      ? getLocalizedName(machine.brandName, i18n.language, '')
      : null;
  const typeLabel = isFreeWeight ? t('machineTypes.free_weight') : null;

  const detailPath = ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code);
  const detailTo =
    selectedMuscle && machine.code.startsWith('FW_')
      ? `${detailPath}?muscle=${encodeURIComponent(selectedMuscle)}`
      : detailPath;

  return (
    <Link
      to={detailTo}
      className="machine-list-item"
    >
      <div className="machine-list-item__thumb">
        {machine.primaryImageUrl ? (
          <img src={machine.primaryImageUrl} alt="" loading="lazy" />
        ) : showMuscle && machine.muscleGroup ? (
          <div className="machine-list-item__muscle-icon" aria-hidden>
            <MuscleGroupIcon group={machine.muscleGroup as MuscleGroup} size={52} />
          </div>
        ) : (
          <div className="machine-list-item__thumb-placeholder" aria-hidden>
            🏋️
          </div>
        )}
      </div>
      <div className="machine-list-item__body">
        <p className="machine-list-item__name">
          <MachineNameWithMuscle
            muscleGroup={showMuscle ? machine.muscleGroup : undefined}
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
