import type { MachineRarityGrade } from '@machinefit/shared';
import { MACHINE_RARITY_META } from '@machinefit/shared';

const MARK: Record<MachineRarityGrade, string> = {
  COMMON: '○',
  UNCOMMON: '◇',
  RARE: '◆',
  EPIC: '✦',
  LEGENDARY: '★',
  MYTHIC: '✸',
  UNIQUE: '❖',
};

export function RarityBadge({
  grade,
  compact,
}: {
  grade: MachineRarityGrade;
  compact?: boolean;
}) {
  const meta = MACHINE_RARITY_META[grade] ?? MACHINE_RARITY_META.COMMON;
  return (
    <span
      className={`rarity-badge rarity-badge--${grade.toLowerCase()}${compact ? ' rarity-badge--compact' : ''}`}
      style={{ ['--rarity-swatch' as string]: meta.swatch }}
    >
      <span aria-hidden>{MARK[grade] ?? '○'}</span>
      {grade}
    </span>
  );
}
