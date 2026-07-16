import type { Brand, Machine, Gym, GymMachine, GymPhoto, BusinessHours } from '@machinefit/shared';
import { MACHINE_CODES, BRAND_CODES } from '@machinefit/shared';

export const MOCK_BRANDS: Brand[] = [
  { id: '1', code: BRAND_CODES.HAMMER_STRENGTH, name: { ko: '해머 스트렝스', en: 'Hammer Strength', ja: 'ハンマーストレングス', zh: '悍马力量' }, isActive: true },
  { id: '2', code: BRAND_CODES.LIFE_FITNESS, name: { ko: '라이프 피트니스', en: 'Life Fitness', ja: 'ライフフィットネス', zh: '力健' }, isActive: true },
  { id: '3', code: BRAND_CODES.CYBEX, name: { ko: '사이벡스', en: 'Cybex', ja: 'サイベックス', zh: '赛百斯' }, isActive: true },
];

export const MOCK_MACHINES: Machine[] = [
  { id: '1', brandId: '1', code: MACHINE_CODES.HS_ISO_LATERAL_HIGH_ROW, name: { ko: '아이소 레터럴 하이 로우', en: 'Iso-Lateral High Row', ja: 'アイソラテラルハイロー', zh: '等轴高位拉' }, muscleGroup: 'back', machineType: 'plate_loaded', hasSeat: true, hasBackPad: true, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '2', brandId: '1', code: MACHINE_CODES.HS_SELECTORIZED_CHEST_PRESS, name: { ko: '셀렉터라이즈드 체스트 프레스', en: 'Selectorized Chest Press', ja: 'セレクタライズドチェストプレス', zh: '选择式胸部推举' }, muscleGroup: 'chest', machineType: 'selectorized', hasSeat: true, hasBackPad: true, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '3', brandId: '1', code: MACHINE_CODES.HS_LEG_EXTENSION, name: { ko: '레그 익스텐션', en: 'Leg Extension', ja: 'レッグエクステンション', zh: '腿部伸展' }, muscleGroup: 'legs', machineType: 'selectorized', hasSeat: true, hasBackPad: true, hasFootPlate: true, hasHandle: false, isActive: true },
  { id: '4', brandId: '1', code: MACHINE_CODES.HS_LEG_CURL, name: { ko: '레그 컬', en: 'Leg Curl', ja: 'レッグカール', zh: '腿部弯举' }, muscleGroup: 'legs', machineType: 'selectorized', hasSeat: true, hasBackPad: true, hasFootPlate: true, hasHandle: false, isActive: true },
  { id: '5', brandId: '1', code: MACHINE_CODES.HS_SHOULDER_PRESS, name: { ko: '숄더 프레스', en: 'Shoulder Press', ja: 'ショルダープレス', zh: '肩部推举' }, muscleGroup: 'shoulders', machineType: 'plate_loaded', hasSeat: true, hasBackPad: true, hasFootPlate: false, hasHandle: true, isActive: true },
];

export interface MockSettingRule {
  gender: string;
  experienceLevel: string;
  heightMinCm: number;
  heightMaxCm: number;
  seatPosition?: number;
  backPadPosition?: number;
  footPosition?: number;
  handlePosition?: number;
  romSetting?: string;
  weightKg?: number;
  tips: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export const MOCK_SETTINGS: Record<string, MockSettingRule[]> = {
  [MACHINE_CODES.HS_ISO_LATERAL_HIGH_ROW]: [
    { gender: 'male', experienceLevel: 'intermediate', heightMinCm: 170, heightMaxCm: 180, seatPosition: 5, backPadPosition: 3, handlePosition: 2, romSetting: 'full', weightKg: 40, tips: { en: ['Keep chest against pad', 'Pull elbows back in line with shoulders'], ko: ['가슴을 패드에 밀착', '팔꿈치를 어깨 라인에 맞춰 당기기'] }, warnings: { en: ['Do not round lower back'], ko: ['허리를 굽히지 마세요'] } },
  ],
  [MACHINE_CODES.HS_SELECTORIZED_CHEST_PRESS]: [
    { gender: 'male', experienceLevel: 'intermediate', heightMinCm: 170, heightMaxCm: 180, seatPosition: 4, backPadPosition: 3, handlePosition: 2, romSetting: 'full', weightKg: 50, tips: { en: ['Retract shoulder blades'], ko: ['견갑골을 모으고'] }, warnings: { en: ['Do not lock elbows aggressively'], ko: ['팔꿈치를 과도하게 잠그지 마세요'] } },
  ],
  [MACHINE_CODES.HS_LEG_EXTENSION]: [
    { gender: 'male', experienceLevel: 'intermediate', heightMinCm: 170, heightMaxCm: 180, seatPosition: 5, backPadPosition: 4, footPosition: 3, romSetting: 'full', weightKg: 45, tips: { en: ['Align knee with machine pivot'], ko: ['무릎을 머신 피벗에 맞추기'] }, warnings: { en: ['Avoid hyperextension'], ko: ['과도한 신전 금지'] } },
  ],
};

export interface MockGym extends Gym {
  photos: GymPhoto[];
  machines: GymMachine[];
}

const DEFAULT_HOURS: BusinessHours = {
  mon: { open: '06:00', close: '22:00' },
  tue: { open: '06:00', close: '22:00' },
  wed: { open: '06:00', close: '22:00' },
  thu: { open: '06:00', close: '22:00' },
  fri: { open: '06:00', close: '22:00' },
  sat: { open: '08:00', close: '20:00' },
  sun: { open: '08:00', close: '18:00' },
};

export const MOCK_GYMS: MockGym[] = [
  {
    id: 'gym-1',
    ownerId: 'owner-1',
    slug: 'fitzone-gangnam',
    name: 'FitZone Gangnam',
    description: { en: 'Premium strength training gym in Gangnam', ko: '강남 프리미엄 근력 트레이닝 체육관' },
    address: '123 Teheran-ro, Gangnam-gu',
    city: 'Seoul',
    countryId: 'kr',
    countryCode: 'KR',
    latitude: 37.4979,
    longitude: 127.0276,
    phone: '+82-2-1234-5678',
    websiteUrl: 'https://fitzone.example.com',
    businessHours: DEFAULT_HOURS,
    amenities: { parking: true, shower: true, '24h': false },
    isVerified: true,
    isActive: true,
    machineCount: 4,
    photos: [{ id: 'p1', gymId: 'gym-1', photoUrl: 'https://placehold.co/600x400/111/ffd400?text=FitZone', sortOrder: 0 }],
    machines: [
      { id: 'gm1', gymId: 'gym-1', machineId: '1', machineCode: MACHINE_CODES.HS_ISO_LATERAL_HIGH_ROW, machineName: 'Iso-Lateral High Row', muscleGroup: 'back', quantity: 2, isAvailable: true, floorZone: 'Upper Body' },
      { id: 'gm2', gymId: 'gym-1', machineId: '2', machineCode: MACHINE_CODES.HS_SELECTORIZED_CHEST_PRESS, machineName: 'Selectorized Chest Press', muscleGroup: 'chest', quantity: 1, isAvailable: true, floorZone: 'Upper Body' },
      { id: 'gm3', gymId: 'gym-1', machineId: '3', machineCode: MACHINE_CODES.HS_LEG_EXTENSION, machineName: 'Leg Extension', muscleGroup: 'legs', quantity: 2, isAvailable: true, floorZone: 'Lower Body' },
      { id: 'gm4', gymId: 'gym-1', machineId: '5', machineCode: MACHINE_CODES.HS_SHOULDER_PRESS, machineName: 'Shoulder Press', muscleGroup: 'shoulders', quantity: 1, isAvailable: true, floorZone: 'Upper Body' },
    ],
  },
  {
    id: 'gym-2',
    ownerId: 'owner-2',
    slug: 'iron-temple-seoul',
    name: 'Iron Temple Seoul',
    description: { en: 'Hardcore strength gym', ko: '하드코어 근력 체육관' },
    address: '45 Olympic-ro, Songpa-gu',
    city: 'Seoul',
    countryId: 'kr',
    countryCode: 'KR',
    latitude: 37.5145,
    longitude: 127.1059,
    phone: '+82-2-9876-5432',
    businessHours: DEFAULT_HOURS,
    amenities: { parking: true, shower: true, '24h': true },
    isVerified: true,
    isActive: true,
    machineCount: 3,
    photos: [{ id: 'p2', gymId: 'gym-2', photoUrl: 'https://placehold.co/600x400/111/ffd400?text=Iron+Temple', sortOrder: 0 }],
    machines: [
      { id: 'gm5', gymId: 'gym-2', machineId: '1', machineCode: MACHINE_CODES.HS_ISO_LATERAL_HIGH_ROW, machineName: 'Iso-Lateral High Row', muscleGroup: 'back', quantity: 1, isAvailable: true },
      { id: 'gm6', gymId: 'gym-2', machineId: '4', machineCode: MACHINE_CODES.HS_LEG_CURL, machineName: 'Leg Curl', muscleGroup: 'legs', quantity: 2, isAvailable: true },
      { id: 'gm7', gymId: 'gym-2', machineId: '2', machineCode: MACHINE_CODES.HS_SELECTORIZED_CHEST_PRESS, machineName: 'Selectorized Chest Press', muscleGroup: 'chest', quantity: 1, isAvailable: false, notes: 'Under maintenance' },
    ],
  },
  {
    id: 'gym-3',
    ownerId: 'owner-3',
    slug: 'powerhouse-nyc',
    name: 'PowerHouse NYC',
    description: { en: 'Midtown Manhattan fitness center', ko: '맨해튼 미드타운 피트니스 센터' },
    address: '350 5th Ave',
    city: 'New York',
    countryId: 'us',
    countryCode: 'US',
    latitude: 40.7484,
    longitude: -73.9857,
    phone: '+1-212-555-0100',
    businessHours: DEFAULT_HOURS,
    amenities: { parking: false, shower: true, '24h': false },
    isVerified: true,
    isActive: true,
    machineCount: 2,
    photos: [{ id: 'p3', gymId: 'gym-3', photoUrl: 'https://placehold.co/600x400/111/ffd400?text=PowerHouse', sortOrder: 0 }],
    machines: [
      { id: 'gm8', gymId: 'gym-3', machineId: '3', machineCode: MACHINE_CODES.HS_LEG_EXTENSION, machineName: 'Leg Extension', muscleGroup: 'legs', quantity: 3, isAvailable: true },
      { id: 'gm9', gymId: 'gym-3', machineId: '5', machineCode: MACHINE_CODES.HS_SHOULDER_PRESS, machineName: 'Shoulder Press', muscleGroup: 'shoulders', quantity: 1, isAvailable: true },
    ],
  },
];
