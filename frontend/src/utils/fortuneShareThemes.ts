/** Per-keyword Helchang fortune share themes (order matches product mock). */

export type FortuneShareTheme = {
  /** Background under public/assets/share/fortune/ */
  bgFile: string;
  /** Primary accent (headline emphasis, stars, glows) */
  accent: string;
  accentSoft: string;
  eyebrow: string;
  quoteBorder: string;
  /** Metric card accents: healthman / PR / recovery */
  metricHealthman: string;
  metricPr: string;
  metricRecovery: string;
  /** Soft radial glow tint behind hero emoji */
  glow: string;
};

const DEFAULT: FortuneShareTheme = {
  bgFile: 'super-set-day.jpg',
  accent: '#ffd24a',
  accentSoft: '#f6c453',
  eyebrow: '#f8fafc',
  quoteBorder: 'rgba(69, 224, 200, 0.55)',
  metricHealthman: '#ffd24a',
  metricPr: '#ff7a3d',
  metricRecovery: '#45e0c8',
  glow: 'rgba(255, 210, 80, 0.35)',
};

/** Order: PR ??DUMBBELL ??FREE WEIGHT ??DROP SET ??VOLUME ??RECOVERY ??CARDIO ??CONTROL ??LEG ??CHEST ??BACK (+ SUPER SET) */
export const FORTUNE_SHARE_THEMES: Record<string, FortuneShareTheme> = {
  PR_DAY: {
    bgFile: 'pr-day.jpg',
    accent: '#c084fc',
    accentSoft: '#e9d5ff',
    eyebrow: '#f3e8ff',
    quoteBorder: 'rgba(192, 132, 252, 0.65)',
    metricHealthman: '#e9d5ff',
    metricPr: '#c084fc',
    metricRecovery: '#a78bfa',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
  DUMBBELL_DAY: {
    bgFile: 'dumbbell-day.jpg',
    accent: '#22d3ee',
    accentSoft: '#a5f3fc',
    eyebrow: '#ecfeff',
    quoteBorder: 'rgba(34, 211, 238, 0.6)',
    metricHealthman: '#67e8f9',
    metricPr: '#22d3ee',
    metricRecovery: '#06b6d4',
    glow: 'rgba(34, 211, 238, 0.38)',
  },
  FREE_WEIGHT_DAY: {
    bgFile: 'free-weight-day.jpg',
    accent: '#a3e635',
    accentSoft: '#d9f99d',
    eyebrow: '#f7fee7',
    quoteBorder: 'rgba(163, 230, 53, 0.6)',
    metricHealthman: '#bef264',
    metricPr: '#a3e635',
    metricRecovery: '#84cc16',
    glow: 'rgba(163, 230, 53, 0.35)',
  },
  DROP_SET_DAY: {
    bgFile: 'drop-set-day.jpg',
    accent: '#f43f5e',
    accentSoft: '#fda4af',
    eyebrow: '#fff1f2',
    quoteBorder: 'rgba(244, 63, 94, 0.6)',
    metricHealthman: '#fb7185',
    metricPr: '#f43f5e',
    metricRecovery: '#e11d48',
    glow: 'rgba(244, 63, 94, 0.38)',
  },
  SUPER_SET_DAY: {
    ...DEFAULT,
    bgFile: 'super-set-day.jpg',
  },
  VOLUME_DAY: {
    bgFile: 'volume-day.jpg',
    accent: '#fbbf24',
    accentSoft: '#fde68a',
    eyebrow: '#fffbeb',
    quoteBorder: 'rgba(251, 191, 36, 0.6)',
    metricHealthman: '#fcd34d',
    metricPr: '#f59e0b',
    metricRecovery: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.38)',
  },
  RECOVERY_DAY: {
    bgFile: 'recovery-day.jpg',
    accent: '#2dd4bf',
    accentSoft: '#99f6e4',
    eyebrow: '#f0fdfa',
    quoteBorder: 'rgba(45, 212, 191, 0.6)',
    metricHealthman: '#5eead4',
    metricPr: '#14b8a6',
    metricRecovery: '#2dd4bf',
    glow: 'rgba(45, 212, 191, 0.38)',
  },
  CARDIO_DAY: {
    bgFile: 'cardio-day.jpg',
    accent: '#fb923c',
    accentSoft: '#fdba74',
    eyebrow: '#fff7ed',
    quoteBorder: 'rgba(251, 146, 60, 0.6)',
    metricHealthman: '#fdba74',
    metricPr: '#f97316',
    metricRecovery: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
  CONTROL_DAY: {
    bgFile: 'control-day.jpg',
    accent: '#38bdf8',
    accentSoft: '#bae6fd',
    eyebrow: '#f0f9ff',
    quoteBorder: 'rgba(56, 189, 248, 0.6)',
    metricHealthman: '#7dd3fc',
    metricPr: '#0ea5e9',
    metricRecovery: '#38bdf8',
    glow: 'rgba(14, 165, 233, 0.38)',
  },
  LEG_DAY: {
    bgFile: 'leg-day.jpg',
    accent: '#84cc16',
    accentSoft: '#d9f99d',
    eyebrow: '#f7fee7',
    quoteBorder: 'rgba(132, 204, 22, 0.6)',
    metricHealthman: '#a3e635',
    metricPr: '#65a30d',
    metricRecovery: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.38)',
  },
  CHEST_DAY: {
    bgFile: 'chest-day.jpg',
    accent: '#ef4444',
    accentSoft: '#fca5a5',
    eyebrow: '#fef2f2',
    quoteBorder: 'rgba(239, 68, 68, 0.6)',
    metricHealthman: '#f87171',
    metricPr: '#dc2626',
    metricRecovery: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.38)',
  },
  BACK_DAY: {
    bgFile: 'back-day.jpg',
    accent: '#3b82f6',
    accentSoft: '#93c5fd',
    eyebrow: '#eff6ff',
    quoteBorder: 'rgba(59, 130, 246, 0.6)',
    metricHealthman: '#60a5fa',
    metricPr: '#2563eb',
    metricRecovery: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.38)',
  },
};

export function getFortuneShareTheme(keywordCode: string | undefined | null): FortuneShareTheme {
  if (!keywordCode) return DEFAULT;
  return FORTUNE_SHARE_THEMES[keywordCode] ?? DEFAULT;
}
