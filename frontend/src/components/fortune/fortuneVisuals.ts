/** UI-only mappings. Does not change API scores or keywords. */

export function keywordEmoji(keywordCode: string): string {
  const map: Record<string, string> = {
    PR_DAY: '🏆',
    DUMBBELL_DAY: '💪',
    FREE_WEIGHT_DAY: '🏋️',
    DROP_SET_DAY: '🔥',
    SUPER_SET_DAY: '⚡',
    VOLUME_DAY: '📈',
    RECOVERY_DAY: '🧘',
    CARDIO_DAY: '🏃',
    CONTROL_DAY: '🎯',
    LEG_DAY: '🦵',
    CHEST_DAY: '💪',
    BACK_DAY: '🔥',
  };
  return map[keywordCode] ?? '✨';
}

export function keywordTone(keywordCode: string): 'pr' | 'recovery' | 'leg' | 'default' {
  if (keywordCode === 'PR_DAY') return 'pr';
  if (keywordCode === 'RECOVERY_DAY') return 'recovery';
  if (keywordCode === 'LEG_DAY') return 'leg';
  return 'default';
}

export function healthmanCaptionKey(score: number): string {
  if (score >= 90) return 'captionHealthmanHot';
  if (score >= 70) return 'captionHealthmanGood';
  if (score >= 50) return 'captionHealthmanSteady';
  return 'captionHealthmanEasy';
}

export function prCaptionKey(score: number): string | null {
  return score >= 80 ? 'captionPrHigh' : null;
}

export function recoveryCaptionKey(score: number): string | null {
  return score >= 80 ? 'captionRecoveryHigh' : null;
}

export type EquipmentKey = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';

export interface EquipmentSlice {
  key: EquipmentKey;
  labelKey: string;
  emoji: string;
  value: number;
  color: string;
}

export function buildEquipmentSlices(ratios: {
  barbellRatio30d: number;
  dumbbellRatio30d: number;
  machineRatio30d: number;
  cableRatio30d: number;
  bodyweightRatio30d: number;
}): EquipmentSlice[] {
  return [
    {
      key: 'barbell',
      labelKey: 'barbell',
      emoji: '🏋️',
      value: ratios.barbellRatio30d,
      color: 'var(--fortune-eq-barbell, #5b7cfa)',
    },
    {
      key: 'dumbbell',
      labelKey: 'dumbbell',
      emoji: '💪',
      value: ratios.dumbbellRatio30d,
      color: 'var(--fortune-eq-dumbbell, #34c759)',
    },
    {
      key: 'machine',
      labelKey: 'machine',
      emoji: '⚙️',
      value: ratios.machineRatio30d,
      color: 'var(--fortune-eq-machine, #ff9f0a)',
    },
    {
      key: 'cable',
      labelKey: 'cable',
      emoji: '🔗',
      value: ratios.cableRatio30d,
      color: 'var(--fortune-eq-cable, #af52de)',
    },
    {
      key: 'bodyweight',
      labelKey: 'bodyweight',
      emoji: '🤸',
      value: ratios.bodyweightRatio30d,
      color: 'var(--fortune-eq-bodyweight, #ff6259)',
    },
  ];
}

export function topEquipment(slices: EquipmentSlice[]): EquipmentSlice | null {
  let best: EquipmentSlice | null = null;
  for (const slice of slices) {
    if (!best || slice.value > best.value) best = slice;
  }
  return best && best.value > 0 ? best : null;
}

export function formatFortuneDate(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${m[1]}.${m[2]}.${m[3]}`;
}

export function bodyPartHref(bodyPart: string): string {
  const muscle: Record<string, string> = {
    CHEST: 'chest',
    BACK: 'back',
    LEGS: 'legs',
    SHOULDERS: 'shoulders',
    ARMS: 'arms',
    CORE: 'core',
  };
  const q = muscle[bodyPart];
  return q ? `/machines?muscle=${encodeURIComponent(q)}` : '/machines';
}

export function styleHref(style: string): string {
  if (style === 'DUMBBELL') return '/machines?q=dumbbell';
  if (style === 'BARBELL') return '/machines?q=barbell';
  if (style === 'MACHINE') return '/machines?q=machine';
  if (style === 'CABLE') return '/machines?q=cable';
  return '/machines';
}
