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

export function parseFortuneDateParts(isoDate: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Display-only yin/yang split from narrative polarity (not engine output). */
export function yinYangDisplay(yinYang: 'yin' | 'yang'): { yang: number; yin: number } {
  return yinYang === 'yang' ? { yang: 68, yin: 32 } : { yang: 34, yin: 66 };
}

const ELEMENT_ORDER = ['wood', 'fire', 'earth', 'metal', 'water'] as const;

/** Display-only element bars from primary/support/weak ranks. */
export function elementBars(rank: {
  primary: string;
  support: string;
  weak: string;
}): Array<{ key: (typeof ELEMENT_ORDER)[number]; value: number }> {
  return ELEMENT_ORDER.map((key) => {
    if (key === rank.primary) return { key, value: 88 };
    if (key === rank.support) return { key, value: 66 };
    if (key === rank.weak) return { key, value: 28 };
    return { key, value: 48 };
  });
}

/** Map 0–100 score to 1–5 stars for compact luck dashboard. */
export function scoreToStars(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
}

export function formatBirthDateDisplay(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${m[1]}.${m[2]}.${m[3]}`;
}

export function formatBirthTimeDisplay(hhmm: string | null | undefined, unknown?: boolean): string {
  if (unknown || !hhmm?.trim()) return '';
  return hhmm.trim().slice(0, 5);
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
