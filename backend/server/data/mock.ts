import type { Brand, Machine, Gym, GymMachine, GymPhoto, BusinessHours } from '@machinefit/shared';
import { MACHINE_CODES, BRAND_CODES } from '@machinefit/shared';

export const MOCK_BRANDS: Brand[] = [
  { id: '1', code: BRAND_CODES.HAMMER_STRENGTH, name: { ko: '해머 스트렝스', en: 'Hammer Strength', ja: 'ハンマーストレングス', zh: '悍马力量' }, isActive: true },
  { id: '2', code: BRAND_CODES.LIFE_FITNESS, name: { ko: '라이프 피트니스', en: 'Life Fitness', ja: 'ライフフィットネス', zh: '力健' }, isActive: true },
  { id: '4', code: BRAND_CODES.FREE_WEIGHT, name: { ko: '프리웨이트', en: 'Free Weight', ja: 'フリーウェイト', zh: '自由重量' }, isActive: true },
  { id: '5', code: BRAND_CODES.BODYWEIGHT, name: { ko: '맨몸운동', en: 'Bodyweight', ja: '自重トレ', zh: '自重训练' }, isActive: true },
  { id: '3', code: BRAND_CODES.CYBEX, name: { ko: '사이벡스', en: 'Cybex', ja: 'サイベックス', zh: '赛百斯' }, isActive: true },
];

export const MOCK_MACHINES: Machine[] = [
  { id: '6', brandId: '4', code: MACHINE_CODES.FW_DUMBBELL, name: { ko: '덤벨', en: 'Dumbbell', ja: 'ダンベル', zh: '哑铃' }, muscleGroup: 'shoulders', machineType: 'free_weight', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '7', brandId: '4', code: MACHINE_CODES.FW_BARBELL, name: { ko: '바벨', en: 'Barbell', ja: 'バーベル', zh: '杠铃' }, muscleGroup: 'chest', machineType: 'free_weight', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '8', brandId: '4', code: MACHINE_CODES.FW_SMITH, name: { ko: '스미스 머신', en: 'Smith Machine', ja: 'スミスマシン', zh: '史密斯机' }, muscleGroup: 'legs', machineType: 'smith', hasSeat: false, hasBackPad: false, hasFootPlate: true, hasHandle: true, isActive: true },
  { id: '9', brandId: '4', code: MACHINE_CODES.FW_CABLE, name: { ko: '케이블', en: 'Cable', ja: 'ケーブル', zh: '绳索' }, muscleGroup: 'back', machineType: 'cable', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '10', brandId: '4', code: MACHINE_CODES.FW_KETTLEBELL, name: { ko: '케틀벨', en: 'Kettlebell', ja: 'ケトルベル', zh: '壶铃' }, muscleGroup: 'shoulders', machineType: 'free_weight', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '11', brandId: '5', code: MACHINE_CODES.BW_PULL_UP, name: { ko: '풀업', en: 'Pull-up', ja: '懸垂', zh: '引体向上' }, muscleGroup: 'back', machineType: 'bodyweight', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '12', brandId: '5', code: MACHINE_CODES.BW_CHIN_UP, name: { ko: '친업', en: 'Chin-up', ja: 'チンアップ', zh: '反手引体' }, muscleGroup: 'back', machineType: 'bodyweight', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '13', brandId: '5', code: MACHINE_CODES.BW_DIPS, name: { ko: '딥스', en: 'Dips', ja: 'ディップス', zh: '双杠臂屈伸' }, muscleGroup: 'chest', machineType: 'bodyweight', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: true, isActive: true },
  { id: '14', brandId: '5', code: MACHINE_CODES.BW_PUSH_UP, name: { ko: '푸쉬업', en: 'Push-up', ja: 'プッシュアップ', zh: '俯卧撑' }, muscleGroup: 'chest', machineType: 'bodyweight', hasSeat: false, hasBackPad: false, hasFootPlate: false, hasHandle: false, isActive: true },
  { id: '15', brandId: '5', code: MACHINE_CODES.BW_SQUAT, name: { ko: '스쿼트', en: 'Squat', ja: 'スクワット', zh: '深蹲' }, muscleGroup: 'legs', machineType: 'bodyweight', hasSeat: false, hasBackPad: false, hasFootPlate: true, hasHandle: false, isActive: true },
  { id: '16', brandId: '5', code: MACHINE_CODES.BW_LUNGE, name: { ko: '런지', en: 'Lunge', ja: 'ランジ', zh: '弓步' }, muscleGroup: 'legs', machineType: 'bodyweight', hasSeat: false, hasBackPad: false, hasFootPlate: true, hasHandle: false, isActive: true },
  { id: '17', brandId: '5', code: MACHINE_CODES.BW_BULGARIAN_SPLIT_SQUAT, name: { ko: '불가리안 스플릿스쿼트', en: 'Bulgarian Split Squat', ja: 'ブルガリアンスプリットスクワット', zh: '保加利亚分腿蹲' }, muscleGroup: 'legs', machineType: 'bodyweight', hasSeat: false, hasBackPad: false, hasFootPlate: true, hasHandle: false, isActive: true },
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
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 170,
      heightMaxCm: 180,
      seatPosition: 5,
      backPadPosition: 3,
      handlePosition: 2,
      romSetting: 'full',
      weightKg: 40,
      tips: {
        en: ['Keep chest against pad', 'Pull elbows back in line with shoulders'],
        ko: ['가슴을 패드에 밀착', '팔꿈치를 어깨 라인에 맞춰 당기기'],
        ja: ['胸をパッドに密着', '肘を肩のラインに合わせて引く'],
        zh: ['胸部贴紧垫子', '肘部与肩部对齐后拉'],
      },
      warnings: {
        en: ['Do not round lower back'],
        ko: ['허리를 굽히지 마세요'],
        ja: ['腰を丸めない'],
        zh: ['不要弯腰弓背'],
      },
    },
  ],
  [MACHINE_CODES.HS_SELECTORIZED_CHEST_PRESS]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 170,
      heightMaxCm: 180,
      seatPosition: 4,
      backPadPosition: 3,
      handlePosition: 2,
      romSetting: 'full',
      weightKg: 50,
      tips: {
        en: ['Retract shoulder blades'],
        ko: ['견갑골을 모으고'],
        ja: ['肩甲骨を寄せる'],
        zh: ['收紧肩胛骨'],
      },
      warnings: {
        en: ['Do not lock elbows aggressively'],
        ko: ['팔꿈치를 과도하게 잠그지 마세요'],
        ja: ['肘を強く伸ばし切らない'],
        zh: ['不要过度锁死肘部'],
      },
    },
  ],
  [MACHINE_CODES.HS_LEG_EXTENSION]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 170,
      heightMaxCm: 180,
      seatPosition: 5,
      backPadPosition: 4,
      footPosition: 3,
      romSetting: 'full',
      weightKg: 45,
      tips: {
        en: ['Align knee with machine pivot'],
        ko: ['무릎을 머신 피벗에 맞추기'],
        ja: ['膝をマシンのピボットに合わせる'],
        zh: ['膝盖对准器械 pivot'],
      },
      warnings: {
        en: ['Avoid hyperextension'],
        ko: ['과도한 신전 금지'],
        ja: ['過度な伸展を避ける'],
        zh: ['避免过度伸展'],
      },
    },
  ],
  [MACHINE_CODES.FW_DUMBBELL]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      weightKg: 12,
      tips: {
        en: ['Choose a weight you can control for your target reps'],
        ko: ['목표 횟수를 컨트롤할 수 있는 중량 선택'],
        ja: ['目標回数をコントロールできる重量を選ぶ'],
        zh: ['选择能控制目标次数的重量'],
      },
      warnings: {
        en: ['Do not drop dumbbells from height'],
        ko: ['덤벨을 높은 곳에서 떨어뜨리지 마세요'],
        ja: ['ダンベルを高い位置から落とさない'],
        zh: ['不要从高处扔下哑铃'],
      },
    },
  ],
  [MACHINE_CODES.FW_BARBELL]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      weightKg: 40,
      tips: {
        en: ['Use collars on both sides', 'Brace core before each set'],
        ko: ['양쪽에 칼라 고정', '세트 전 코어 브레이싱'],
        ja: ['両側にカラーで固定', 'セット前にコアを固める'],
        zh: ['两侧使用卡扣', '每组前收紧核心'],
      },
      warnings: {
        en: ['Do not lift without spotter on heavy sets if unsure'],
        ko: ['무거운 중량은 보조 없이 무리하지 마세요'],
        ja: ['重い重量は無理に一人で行わない'],
        zh: ['大重量不确定时不要独自训练'],
      },
    },
  ],
  [MACHINE_CODES.FW_SMITH]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'variable',
      weightKg: 60,
      tips: {
        en: ['Lock safety stops before heavy sets', 'Keep bar path vertical'],
        ko: ['고중량 전에 안전 스토퍼 고정', '바를 수직으로 이동'],
        ja: ['高重量前に安全ストッパーを固定', 'バーを垂直に動かす'],
        zh: ['大重量前固定安全挡', '保持杠铃垂直路径'],
      },
      warnings: {
        en: ['Do not rotate wrists under load'],
        ko: ['하중 중 손목을 비틀지 마세요'],
        ja: ['負荷中に手首を捻らない'],
        zh: ['负重时不要扭动手腕'],
      },
    },
  ],
  [MACHINE_CODES.FW_CABLE]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'variable',
      weightKg: 25,
      tips: {
        en: ['Stand stable before pulling', 'Control the return phase'],
        ko: ['당기기 전 자세 고정', '복귀 구간 컨트롤'],
        ja: ['引く前に姿勢を固定', '戻す動作をコントロール'],
        zh: ['拉动前站稳', '控制回位阶段'],
      },
      warnings: {
        en: ['Avoid jerking the stack'],
        ko: ['무게 스택을 급격히 당기지 마세요'],
        ja: ['ウェイトスタックを急に引かない'],
        zh: ['不要猛拉配重'],
      },
    },
  ],
  [MACHINE_CODES.FW_KETTLEBELL]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      weightKg: 16,
      tips: {
        en: ['Grip the handle firmly', 'Use hip drive on swings'],
        ko: ['손잡이를 단단히 잡기', '스윙 시 엉덩이 힘 활용'],
        ja: ['ハンドルをしっかり握る', 'スイング時は股関節を使う'],
        zh: ['握紧把手', '摆动时使用髋部发力'],
      },
      warnings: {
        en: ['Keep clearance around your body'],
        ko: ['주변에 충분한 공간 확보'],
        ja: ['周囲に十分なスペースを確保'],
        zh: ['确保周围有足够空间'],
      },
    },
  ],
  [MACHINE_CODES.BW_PULL_UP]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      tips: {
        en: ['Start from a dead hang', 'Pull chest toward the bar'],
        ko: ['데드행에서 시작', '가슴을 바 쪽으로 당기기'],
        ja: ['デッドハングから開始', '胸をバーに引き寄せる'],
        zh: ['从悬垂开始', '将胸部拉向横杆'],
      },
      warnings: {
        en: ['Avoid kipping if focusing on strength'],
        ko: ['근력 위주면 키핑 피하기'],
        ja: ['筋力重視ならキップを避ける'],
        zh: ['侧重力量时避免借力摆动'],
      },
    },
  ],
  [MACHINE_CODES.BW_CHIN_UP]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      tips: {
        en: ['Use supinated grip', 'Keep elbows close to body'],
        ko: ['손바닥 자신 쪽 그립', '팔꿈치를 몸 가까이'],
        ja: ['手のひらを自分側に', '肘を体の近くに'],
        zh: ['采用反手抓握', '肘部贴近身体'],
      },
      warnings: {
        en: ['Do not swing the torso'],
        ko: ['상체를 흔들지 마세요'],
        ja: ['体幹を揺らさない'],
        zh: ['不要摆动躯干'],
      },
    },
  ],
  [MACHINE_CODES.BW_DIPS]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      tips: {
        en: ['Keep shoulders down on descent', 'Lean slightly forward for chest focus'],
        ko: ['하강 시 어깨 내리기', '가슴 자극을 위해 약간 숙이기'],
        ja: ['下ろす時は肩を下げる', '胸に効かせるためやや前傾'],
        zh: ['下降时沉肩', '略前倾以刺激胸部'],
      },
      warnings: {
        en: ['Stop if shoulder pain occurs'],
        ko: ['어깨 통증 시 즉시 중단'],
        ja: ['肩に痛みがあれば中止'],
        zh: ['肩部疼痛时立即停止'],
      },
    },
  ],
  [MACHINE_CODES.BW_PUSH_UP]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      tips: {
        en: ['Keep body in a straight line', 'Lower chest near the floor'],
        ko: ['몸을 일자로 유지', '가슴을 바닥 가까이'],
        ja: ['体を一直線に', '胸を床近くまで'],
        zh: ['身体保持一条直线', '胸部接近地面'],
      },
      warnings: {
        en: ['Do not sag the hips'],
        ko: ['엉덩이가 처지지 않게'],
        ja: ['腰が落ちないように'],
        zh: ['不要塌腰'],
      },
    },
  ],
  [MACHINE_CODES.BW_SQUAT]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      tips: {
        en: ['Keep knees in line with toes', 'Sit hips back and down'],
        ko: ['무릎을 발끝과 같은 방향', '엉덩이를 뒤로 빼며 앉기'],
        ja: ['膝をつま先と同じ方向に', '股関節を後ろに引いて下ろす'],
        zh: ['膝盖与脚尖同向', '髋部后坐下'],
      },
      warnings: {
        en: ['Do not let knees cave inward'],
        ko: ['무릎이 안쪽으로 모이지 않게'],
        ja: ['膝が内側に入らないように'],
        zh: ['不要让膝盖内扣'],
      },
    },
  ],
  [MACHINE_CODES.BW_LUNGE]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      tips: {
        en: ['Keep front knee over ankle', 'Torso upright'],
        ko: ['앞무릎을 발목 위에', '상체 세우기'],
        ja: ['前膝を足首の上に', '上体を起こす'],
        zh: ['前膝在脚踝上方', '上身挺直'],
      },
      warnings: {
        en: ['Avoid pushing front knee too far forward'],
        ko: ['앞무릎이 과도하게 앞으로 나가지 않게'],
        ja: ['前膝が過度に前に出ないように'],
        zh: ['前膝不要过度前移'],
      },
    },
  ],
  [MACHINE_CODES.BW_BULGARIAN_SPLIT_SQUAT]: [
    {
      gender: 'male',
      experienceLevel: 'intermediate',
      heightMinCm: 160,
      heightMaxCm: 190,
      romSetting: 'full',
      tips: {
        en: ['Rear foot on bench for balance', 'Lower until front thigh is parallel'],
        ko: ['뒷발을 벤치에 올려 균형', '앞 허벅지가 수평까지'],
        ja: ['後ろ足をベンチに', '前ももが水平まで'],
        zh: ['后脚放凳上保持平衡', '前大腿蹲至水平'],
      },
      warnings: {
        en: ['Keep most weight on front leg'],
        ko: ['체중은 앞다리에 집중'],
        ja: ['体重は前足に'],
        zh: ['重心放在前腿'],
      },
    },
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
