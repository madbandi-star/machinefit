import { useTranslation } from 'react-i18next';
import type { MachineRarityGrade } from '@machinefit/shared';
import { MACHINE_RARITY_META } from '@machinefit/shared';
import { RarityEmblem } from './RarityEmblem';

export function RarityBadge({
  grade,
  compact,
}: {
  grade: MachineRarityGrade;
  compact?: boolean;
}) {
  const { t } = useTranslation('community');
  const resolved = MACHINE_RARITY_META[grade] ? grade : 'COMMON';
  const meta = MACHINE_RARITY_META[resolved];

  return (
    <span
      className={`rarity-badge rarity-badge--${resolved.toLowerCase()}${compact ? ' rarity-badge--compact' : ''}`}
      style={{ ['--rarity-swatch' as string]: meta.swatch }}
    >
      <RarityEmblem grade={resolved} size={compact ? 14 : 16} />
      <span className="rarity-badge__label">{t(`showcase.grades.${resolved}`)}</span>
    </span>
  );
}
