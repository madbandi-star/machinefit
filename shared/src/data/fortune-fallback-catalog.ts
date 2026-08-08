import type { FortuneContentCategory } from '../types/fortune.types.js';

/** Minimal KO fallback when DB catalog is empty. */
export interface FortuneFallbackItem {
  category: FortuneContentCategory;
  code: string;
  title: string;
  body: string;
  priority: number;
}

export const FORTUNE_FALLBACK_CATALOG: FortuneFallbackItem[] = [
  { category: 'keyword', code: 'DUMBBELL_DAY', title: 'DUMBBELL DAY', body: '덤벨과 궁합이 좋은 날', priority: 20 },
  { category: 'keyword', code: 'PR_DAY', title: 'PR DAY', body: '기록을 노려볼 만한 날', priority: 10 },
  { category: 'keyword', code: 'RECOVERY_DAY', title: 'RECOVERY DAY', body: '회복을 우선하기 좋은 날', priority: 70 },
  { category: 'keyword', code: 'CONTROL_DAY', title: 'CONTROL DAY', body: '컨트롤·자극에 집중하기 좋은 날', priority: 90 },
  { category: 'headline', code: 'DUMBBELL_COMPAT', title: '오늘은 덤벨과 궁합이 좋은 날입니다.', body: '', priority: 20 },
  { category: 'headline', code: 'PR_PUSH', title: '오늘은 기록을 노려볼 만한 날입니다.', body: '', priority: 10 },
  { category: 'headline', code: 'RECOVERY_LISTEN', title: '오늘은 몸이 보내는 신호에 귀를 기울여야 하는 날입니다.', body: '', priority: 40 },
  { category: 'strategy', code: 'PR_CHALLENGE', title: 'PR 도전', body: '준비세트를 충분히 하세요.', priority: 10 },
  { category: 'strategy', code: 'DROP_SET', title: '드랍세트', body: '드랍세트로 자극을 이어가세요.', priority: 20 },
  { category: 'strategy', code: 'WEIGHT_HOLD', title: '중량 유지', body: '중량을 유지하고 자세에 집중하세요.', priority: 50 },
  { category: 'style', code: 'DUMBBELL', title: '덤벨', body: '덤벨 운동', priority: 20 },
  { category: 'style', code: 'BARBELL', title: '바벨', body: '바벨 운동', priority: 10 },
  { category: 'style', code: 'MACHINE', title: '머신', body: '머신 운동', priority: 30 },
  { category: 'condition', code: 'NORMAL', title: '평소 강도', body: '', priority: 20 },
  { category: 'condition', code: 'RECOVERY', title: '회복 중심', body: '', priority: 40 },
  { category: 'pre_workout', code: 'PREP_SETS', title: '충분한 준비세트', body: '준비세트를 충분히 가져가세요.', priority: 40 },
  { category: 'post_workout', code: 'STRETCH', title: '스트레칭', body: '운동 후 스트레칭을 추천해요.', priority: 20 },
  { category: 'avoid', code: 'HEAVY_EGO', title: '무리한 고중량', body: '무리한 고중량은 피하는 것을 추천해요.', priority: 10 },
  { category: 'one_liner', code: 'PREP_WINS', title: '기록은 욕심보다 준비에서 나온다.', body: '', priority: 20 },
  { category: 'body_part', code: 'BACK', title: '등', body: '등', priority: 20 },
  { category: 'body_part', code: 'CHEST', title: '가슴', body: '가슴', priority: 10 },
  { category: 'body_part', code: 'LEGS', title: '하체', body: '하체', priority: 40 },
];
