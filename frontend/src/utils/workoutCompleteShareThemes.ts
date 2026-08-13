/** Visual-only themes for TODAY'S WORKOUT share cards (10 mock variants). */

export type WorkoutShareLayout =
  | 'sport'
  | 'hud'
  | 'minimal'
  | 'grunge'
  | 'gauge'
  | 'cosmic'
  | 'photo'
  | 'heat'
  | 'neonFrame'
  | 'cinematic';

export type WorkoutShareTheme = {
  id: string;
  layout: WorkoutShareLayout;
  /** Optional photo under public/assets/share/workout/ */
  bgFile?: string;
  brand: string;
  title: string;
  titleAlt?: string;
  date: string;
  hero: string;
  heroGlow: string;
  accent: string;
  accent2: string;
  accent3: string;
  power: string;
  keepGoing: string;
  hashtag: string;
  panel: string;
  panelStroke: string;
  bgTop: string;
  bgMid: string;
  bgBot: string;
};

/** Order matches the 9-card sheet + 1 cinematic gym hero mock. */
export const WORKOUT_SHARE_THEMES: WorkoutShareTheme[] = [
  {
    id: 'neon_sport',
    layout: 'sport',
    brand: '#b8ff3c',
    title: '#b8ff3c',
    date: '#d1d5db',
    hero: '#b8ff3c',
    heroGlow: 'rgba(184, 255, 60, 0.45)',
    accent: '#b8ff3c',
    accent2: '#86efac',
    accent3: '#a3e635',
    power: '#b8ff3c',
    keepGoing: '#e5e7eb',
    hashtag: '#b8ff3c',
    panel: 'rgba(0,0,0,0.35)',
    panelStroke: 'rgba(184, 255, 60, 0.25)',
    bgTop: '#050505',
    bgMid: '#0a0c0a',
    bgBot: '#000000',
  },
  {
    id: 'cyber_hud',
    layout: 'hud',
    brand: '#22d3ee',
    title: '#f8fafc',
    date: '#94a3b8',
    hero: '#67e8f9',
    heroGlow: 'rgba(34, 211, 238, 0.5)',
    accent: '#22d3ee',
    accent2: '#67e8f9',
    accent3: '#0ea5e9',
    power: '#ecfeff',
    keepGoing: '#a5f3fc',
    hashtag: '#22d3ee',
    panel: 'rgba(8, 20, 28, 0.72)',
    panelStroke: 'rgba(34, 211, 238, 0.65)',
    bgTop: '#020617',
    bgMid: '#0b1220',
    bgBot: '#020617',
  },
  {
    id: 'minimal_lavender',
    layout: 'minimal',
    brand: '#c4b5fd',
    title: '#f8fafc',
    date: '#94a3b8',
    hero: '#ddd6fe',
    heroGlow: 'rgba(167, 139, 250, 0.35)',
    accent: '#a78bfa',
    accent2: '#c4b5fd',
    accent3: '#8b5cf6',
    power: '#c4b5fd',
    keepGoing: '#ddd6fe',
    hashtag: '#a78bfa',
    panel: 'rgba(15, 10, 30, 0.4)',
    panelStroke: 'rgba(167, 139, 250, 0.2)',
    bgTop: '#0b0a14',
    bgMid: '#12101f',
    bgBot: '#08070f',
  },
  {
    id: 'grunge_yellow',
    layout: 'grunge',
    brand: '#facc15',
    title: '#facc15',
    titleAlt: '#fde047',
    date: '#e5e7eb',
    hero: '#facc15',
    heroGlow: 'rgba(250, 204, 21, 0.4)',
    accent: '#facc15',
    accent2: '#fde047',
    accent3: '#eab308',
    power: '#111827',
    keepGoing: '#fde047',
    hashtag: '#facc15',
    panel: 'rgba(0,0,0,0.45)',
    panelStroke: 'rgba(250, 204, 21, 0.35)',
    bgTop: '#0a0a0a',
    bgMid: '#111111',
    bgBot: '#050505',
  },
  {
    id: 'gauge_ring',
    layout: 'gauge',
    brand: '#4ade80',
    title: '#f8fafc',
    date: '#9ca3af',
    hero: '#4ade80',
    heroGlow: 'rgba(74, 222, 128, 0.45)',
    accent: '#4ade80',
    accent2: '#86efac',
    accent3: '#22c55e',
    power: '#4ade80',
    keepGoing: '#bbf7d0',
    hashtag: '#4ade80',
    panel: 'rgba(6, 20, 12, 0.55)',
    panelStroke: 'rgba(74, 222, 128, 0.35)',
    bgTop: '#020805',
    bgMid: '#06140c',
    bgBot: '#010403',
  },
  {
    id: 'cosmic_nebula',
    layout: 'cosmic',
    brand: '#e879f9',
    title: '#f5d0fe',
    date: '#c4b5fd',
    hero: '#f0abfc',
    heroGlow: 'rgba(232, 121, 249, 0.5)',
    accent: '#a78bfa',
    accent2: '#e879f9',
    accent3: '#60a5fa',
    power: '#e9d5ff',
    keepGoing: '#f5d0fe',
    hashtag: '#c084fc',
    panel: 'rgba(20, 10, 40, 0.5)',
    panelStroke: 'rgba(192, 132, 252, 0.35)',
    bgTop: '#0a0618',
    bgMid: '#1a0b2e',
    bgBot: '#05030c',
  },
  {
    id: 'industrial_photo',
    layout: 'photo',
    bgFile: 'industrial-plates.png',
    brand: '#f8fafc',
    title: '#ffffff',
    date: '#e5e7eb',
    hero: '#ffffff',
    heroGlow: 'rgba(255,255,255,0.25)',
    accent: '#a3e635',
    accent2: '#facc15',
    accent3: '#e5e7eb',
    power: '#a3e635',
    keepGoing: '#f8fafc',
    hashtag: '#a3e635',
    panel: 'rgba(0,0,0,0.55)',
    panelStroke: 'rgba(255,255,255,0.2)',
    bgTop: '#111111',
    bgMid: '#1a1a1a',
    bgBot: '#0a0a0a',
  },
  {
    id: 'heat_ember',
    layout: 'heat',
    brand: '#fb923c',
    title: '#fff7ed',
    date: '#fdba74',
    hero: '#fb923c',
    heroGlow: 'rgba(249, 115, 22, 0.5)',
    accent: '#f97316',
    accent2: '#fb7185',
    accent3: '#ef4444',
    power: '#fb923c',
    keepGoing: '#fdba74',
    hashtag: '#fb923c',
    panel: 'rgba(30, 10, 5, 0.55)',
    panelStroke: 'rgba(249, 115, 22, 0.4)',
    bgTop: '#0c0604',
    bgMid: '#1a0a06',
    bgBot: '#050201',
  },
  {
    id: 'neon_blue_frame',
    layout: 'neonFrame',
    brand: '#38bdf8',
    title: '#e0f2fe',
    date: '#7dd3fc',
    hero: '#38bdf8',
    heroGlow: 'rgba(56, 189, 248, 0.55)',
    accent: '#0ea5e9',
    accent2: '#38bdf8',
    accent3: '#7dd3fc',
    power: '#e0f2fe',
    keepGoing: '#7dd3fc',
    hashtag: '#38bdf8',
    panel: 'rgba(5, 15, 30, 0.65)',
    panelStroke: 'rgba(56, 189, 248, 0.7)',
    bgTop: '#020617',
    bgMid: '#0a1628',
    bgBot: '#01040a',
  },
  {
    id: 'cinematic_gym',
    layout: 'cinematic',
    bgFile: 'cinematic-gym.png',
    brand: '#b8ff3c',
    title: '#f8fafc',
    date: '#e5e7eb',
    hero: '#b8ff3c',
    heroGlow: 'rgba(184, 255, 60, 0.55)',
    accent: '#b8ff3c',
    accent2: '#c084fc',
    accent3: '#67e8f9',
    power: '#b8ff3c',
    keepGoing: '#c084fc',
    hashtag: '#b8ff3c',
    panel: 'rgba(0, 0, 0, 0.55)',
    panelStroke: 'rgba(184, 255, 60, 0.35)',
    bgTop: '#050505',
    bgMid: '#0c0c10',
    bgBot: '#000000',
  },
];

export function pickRandomWorkoutShareTheme(
  themes: WorkoutShareTheme[] = WORKOUT_SHARE_THEMES
): WorkoutShareTheme {
  const i = Math.floor(Math.random() * themes.length);
  return themes[i] ?? themes[0]!;
}
