/**
 * Server-side machine rarity scoring.
 * Clients must display cached grade/score from the API — never compute or submit a grade.
 */

export const MACHINE_RARITY_GRADES = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
  'UNIQUE',
] as const;

export type MachineRarityGrade = (typeof MACHINE_RARITY_GRADES)[number];

export type AutoMachineRarityGrade = Exclude<MachineRarityGrade, 'UNIQUE'>;

/** Admin-tunable thresholds (score is 0–100). UNIQUE is never auto-assigned. */
export interface MachineRarityThresholds {
  uncommonMin: number;
  rareMin: number;
  epicMin: number;
  legendaryMin: number;
  mythicMin: number;
  /** Avoid MYTHIC inflation on tiny catalogs. */
  minGymsForScarcityBoost: number;
}

export const DEFAULT_MACHINE_RARITY_THRESHOLDS: MachineRarityThresholds = {
  uncommonMin: 28,
  rareMin: 45,
  epicMin: 60,
  legendaryMin: 75,
  mythicMin: 90,
  minGymsForScarcityBoost: 50,
};

export interface MachineRarityInput {
  gymHoldingCount: number;
  totalGyms: number;
  userGymHoldingCount: number;
  postCount: number;
  discoveryCount: number;
  adminWeight?: number;
  uniqueFlag?: boolean;
  gradeOverride?: MachineRarityGrade | null;
  thresholds?: MachineRarityThresholds;
}

export interface MachineRarityResult {
  score: number;
  autoGrade: AutoMachineRarityGrade;
  grade: MachineRarityGrade;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function gradeFromScore(score: number, t: MachineRarityThresholds): AutoMachineRarityGrade {
  if (score >= t.mythicMin) return 'MYTHIC';
  if (score >= t.legendaryMin) return 'LEGENDARY';
  if (score >= t.epicMin) return 'EPIC';
  if (score >= t.rareMin) return 'RARE';
  if (score >= t.uncommonMin) return 'UNCOMMON';
  return 'COMMON';
}

/**
 * Higher score = rarer. Driven mainly by how few public gyms hold the machine.
 * Photo posts / discoveries slightly reduce rarity (more confirmed = less mysterious).
 */
export function calculateMachineRarity(input: MachineRarityInput): MachineRarityResult {
  const t = input.thresholds ?? DEFAULT_MACHINE_RARITY_THRESHOLDS;
  const gyms = Math.max(0, Math.floor(input.gymHoldingCount));
  const totalGyms = Math.max(0, Math.floor(input.totalGyms));
  const posts = Math.max(0, Math.floor(input.postCount));
  const adminWeight = clamp(input.adminWeight ?? 0, -100, 100);

  const denominator = Math.max(totalGyms, 20);
  const coverage = clamp(gyms / denominator, 0, 1);
  const scarcity = (1 - coverage) * 85;
  const evidencePenalty = Math.min(15, Math.log10(1 + gyms * 3 + posts) * 6);

  let score = clamp(Math.round(scarcity - evidencePenalty + adminWeight * 0.35), 0, 100);

  if (gyms === 0 && posts === 0) {
    score = clamp(Math.round(40 + adminWeight * 0.35), 0, 100);
  } else if (totalGyms >= t.minGymsForScarcityBoost) {
    if (gyms <= 1) score = Math.max(score, 92);
    else if (gyms <= 3) score = Math.max(score, 82);
    else if (gyms <= 7) score = Math.max(score, 70);
  }

  const autoGrade = gradeFromScore(score, t);
  let grade: MachineRarityGrade = autoGrade;
  if (input.uniqueFlag || input.gradeOverride === 'UNIQUE') {
    grade = 'UNIQUE';
  } else if (input.gradeOverride) {
    grade = input.gradeOverride;
  }

  return { score, autoGrade, grade };
}

export function getMachineRarityGrade(input: MachineRarityInput): MachineRarityGrade {
  return calculateMachineRarity(input).grade;
}

export const MACHINE_RARITY_META: Record<
  MachineRarityGrade,
  { label: string; swatch: string; rank: number }
> = {
  COMMON: { label: 'COMMON', swatch: '#9aa3ad', rank: 0 },
  UNCOMMON: { label: 'UNCOMMON', swatch: '#5cbf8a', rank: 1 },
  RARE: { label: 'RARE', swatch: '#4a90e8', rank: 2 },
  EPIC: { label: 'EPIC', swatch: '#9b6bdb', rank: 3 },
  LEGENDARY: { label: 'LEGENDARY', swatch: '#e89a3a', rank: 4 },
  MYTHIC: { label: 'MYTHIC', swatch: '#e24b4b', rank: 5 },
  UNIQUE: { label: 'UNIQUE', swatch: '#d46ad8', rank: 6 },
};

export function isRareOrHigher(grade: MachineRarityGrade): boolean {
  return MACHINE_RARITY_META[grade].rank >= MACHINE_RARITY_META.RARE.rank;
}
