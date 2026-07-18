import { Building2, Cpu, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HistoryEquipmentMetaProps {
  muscleGroup?: string;
  machineCode: string;
  brandPlaceholder?: string;
}

export function HistoryEquipmentMeta({
  muscleGroup,
  machineCode,
  brandPlaceholder,
}: HistoryEquipmentMetaProps) {
  const { t } = useTranslation('machines');

  const brand = brandPlaceholder ?? t('history.metaBrandPlaceholder');
  const muscle = muscleGroup ?? t('history.metaMusclePlaceholder');
  const machineLabel = machineCode
    ? machineCode.replace(/_/g, ' ').toUpperCase()
    : t('history.metaMachinePlaceholder');

  return (
    <div className="history-equipment-meta" aria-label={t('history.metaLabel')}>
      <span className="history-equipment-meta__chip">
        <Building2 size={11} strokeWidth={2.25} aria-hidden />
        {brand}
      </span>
      <span className="history-equipment-meta__divider" aria-hidden>
        |
      </span>
      <span className="history-equipment-meta__chip">
        <Target size={11} strokeWidth={2.25} aria-hidden />
        {muscle}
      </span>
      <span className="history-equipment-meta__divider" aria-hidden>
        |
      </span>
      <span className="history-equipment-meta__chip history-equipment-meta__chip--muted">
        <Cpu size={11} strokeWidth={2.25} aria-hidden />
        {machineLabel}
      </span>
    </div>
  );
}
