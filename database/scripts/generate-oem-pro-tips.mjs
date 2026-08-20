#!/usr/bin/env node
/**
 * Generate HAMMER_STRENGTH PRO tips CSV from verified model research.
 * Output is trainer-style coaching (not verification-report dumps).
 *
 * Usage:
 *   node database/scripts/generate-hammer-strength-pro-tips.mjs [--out path.csv]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const BRAND_META = {
  HAMMER_STRENGTH: {
    displayKo: '해머 스트렝스',
    displayEn: 'HAMMER STRENGTH',
    manufacturerDefault: 'Life Fitness (Hammer Strength)',
    researchFile: 'hammer_strength_models.json',
    csvFile: 'hammer_strength_pro_tips.csv',
    noModelKo: '해머 스트렝스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated Hammer Strength SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '해머 스트렝스 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the Hammer Strength path instead of fighting it.',
  },
  LIFE_FITNESS: {
    displayKo: '라이프 피트니스',
    displayEn: 'LIFE FITNESS',
    manufacturerDefault: 'Life Fitness',
    researchFile: 'life_fitness_models.json',
    csvFile: 'life_fitness_pro_tips.csv',
    noModelKo: '라이프 피트니스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated Life Fitness SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '라이프 피트니스(Insignia·Signature·Axiom) 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the Life Fitness (Insignia / Signature / Axiom) path instead of fighting it.',
  },
  NAUTILUS: {
    displayKo: '노틸러스',
    displayEn: 'NAUTILUS',
    manufacturerDefault: 'Nautilus',
    researchFile: 'nautilus_models.json',
    csvFile: 'nautilus_pro_tips.csv',
    noModelKo: '노틸러스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated Nautilus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '노틸러스(Inspiration·Impact·Leverage) 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the Nautilus (Inspiration / Impact / Leverage) path instead of fighting it.',
  },
  CYBEX: {
    displayKo: '사이벡스',
    displayEn: 'CYBEX',
    manufacturerDefault: 'Cybex',
    researchFile: 'cybex_models.json',
    csvFile: 'cybex_pro_tips.csv',
    noModelKo: '사이벡스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated Cybex SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '사이벡스(Eagle NX·Prestige·VR3) 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the Cybex (Eagle NX / Prestige / VR3) path instead of fighting it.',
  },
  HOIST: {
    displayKo: '호이스트',
    displayEn: 'HOIST',
    manufacturerDefault: 'Hoist Fitness',
    researchFile: 'hoist_models.json',
    csvFile: 'hoist_pro_tips.csv',
    noModelKo: '호이스트 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated Hoist SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '호이스트 ROC-IT(ROX™) 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the Hoist ROC-IT (ROX™) path instead of fighting it.',
  },
  MATRIX: {
    displayKo: '매트릭스',
    displayEn: 'MATRIX',
    manufacturerDefault: 'Matrix Fitness',
    researchFile: 'matrix_models.json',
    csvFile: 'matrix_pro_tips.csv',
    noModelKo: '매트릭스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated Matrix SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '매트릭스 Ultra(G7)·Versa·Magnum 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the Matrix Ultra (G7) / Versa / Magnum path instead of fighting it.',
  },
  PRECOR: {
    displayKo: '프리코',
    displayEn: 'PRECOR',
    manufacturerDefault: 'Precor',
    researchFile: 'precor_models.json',
    csvFile: 'precor_pro_tips.csv',
    noModelKo: '프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '프리코 Discovery(DSL)·Resolute(RSL)·Plate Loaded 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the Precor Discovery (DSL) / Resolute (RSL) / Plate Loaded path instead of fighting it.',
  },
  PRIME_FITNESS: {
    displayKo: '프라임 피트니스',
    displayEn: 'PRIME FITNESS',
    manufacturerDefault: 'PRIME Fitness USA',
    researchFile: 'prime_fitness_models.json',
    csvFile: 'prime_fitness_pro_tips.csv',
    noModelKo: '프라임 피트니스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.',
    noModelEn: 'There is no dedicated PRIME Fitness SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.',
    rideKo: '프라임 Evolution·Hybrid SmartCam / Plate Loaded 3-peg 궤적을 그대로 타는 게 핵심입니다.',
    rideEn: 'Ride the PRIME Evolution / Hybrid SmartCam / Plate Loaded 3-peg path instead of fighting it.',
  },
};

function parseArg(prefix) {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const BRAND = parseArg('--brand=') || 'HAMMER_STRENGTH';
const brandMeta = BRAND_META[BRAND];
if (!brandMeta) {
  console.error(`Unknown brand: ${BRAND}. Known: ${Object.keys(BRAND_META).join(', ')}`);
  process.exit(1);
}

const RESEARCH = path.join(
  ROOT,
  'database/catalog/pro-tips/research',
  brandMeta.researchFile
);
const MAX_BYTES = 5000;

/** @typedef {'chest'|'back'|'shoulders'|'legs'|'glutes'|'calves'|'arms'|'core'|'cable'|'rack'|'unknown'} Family */

const FAMILY_BY_NAME = {
  '체스트 프레스': 'chest',
  '인클라인 체스트 프레스': 'chest',
  '디클라인 체스트 프레스': 'chest',
  '컨버징 체스트 프레스': 'chest',
  '아이소래터럴 체스트 프레스': 'chest',
  '플레이트로드 체스트 프레스': 'chest',
  펙덱: 'chest',
  '플라이 머신': 'chest',
  '딥 머신': 'chest',
  '어시스트 딥': 'chest',
  '슈퍼 인클라인 프레스': 'chest',
  랫풀다운: 'back',
  '와이드 랫풀다운': 'back',
  '프론트 풀다운': 'back',
  '아이소래터럴 랫풀다운': 'back',
  하이로우: 'back',
  '아이소래터럴 하이로우': 'back',
  '시티드 로우': 'back',
  '로우 머신': 'back',
  '로우 로우': 'back',
  '미드 로우': 'back',
  '아이소래터럴 로우': 'back',
  '아이소래터럴 로우 로우': 'back',
  '체스트 서포티드 로우': 'back',
  'T바 로우 머신': 'back',
  풀오버: 'back',
  '어시스트 풀업 / 친업': 'back',
  '숄더 프레스': 'shoulders',
  '아이소래터럴 숄더 프레스': 'shoulders',
  '플레이트로드 숄더 프레스': 'shoulders',
  '레터럴 레이즈': 'shoulders',
  '머신 레터럴 레이즈': 'shoulders',
  '리어 델트': 'shoulders',
  '리어 델트 / 리버스 펙덱': 'shoulders',
  '프론트 레이즈': 'shoulders',
  '업라이트 로우': 'shoulders',
  '로테이터 머신': 'shoulders',
  '숄더 프레스 / 레터럴 복합 머신': 'shoulders',
  '레그 프레스': 'legs',
  '45도 레그 프레스': 'legs',
  '수평 레그 프레스': 'legs',
  '핵 스쿼트': 'legs',
  '스쿼트 프레스': 'legs',
  '벨트 스쿼트': 'legs',
  '레그 익스텐션': 'legs',
  '시티드 레그 컬': 'legs',
  '라잉 레그 컬': 'legs',
  '스탠딩 레그 컬': 'legs',
  '싱글 레그 컬': 'legs',
  '힙 쓰러스트': 'glutes',
  '글루트 드라이브': 'glutes',
  '글루트 킥백': 'glutes',
  '힙 어브덕션': 'glutes',
  '힙 어덕션': 'glutes',
  '글루트 / 힙 머신': 'glutes',
  '힙 익스텐션': 'glutes',
  '스탠딩 카프': 'calves',
  '시티드 카프': 'calves',
  '레그 프레스 카프': 'calves',
  '바이셉 컬': 'arms',
  '프리처 컬': 'arms',
  '아이소래터럴 바이셉 컬': 'arms',
  '암 컬': 'arms',
  '트라이셉스 익스텐션': 'arms',
  '트라이셉스 프레스': 'arms',
  '딥 / 트라이셉스 머신': 'arms',
  '바이셉스 / 트라이셉스 복합 머신': 'arms',
  '앱 크런치': 'core',
  어브도미널: 'core',
  '로터리 토르소': 'core',
  '사이드 밴드': 'core',
  '백 익스텐션': 'core',
  '복근 / 허리 복합 머신': 'core',
  '케이블 크로스오버': 'cable',
  '듀얼 어저스터블 풀리': 'cable',
  '멀티 정글짐': 'cable',
  '어시스트 풀업 / 딥': 'cable',
  '스미스 머신': 'rack',
  '파워 랙': 'rack',
  '하프 랙': 'rack',
};

const NAME_EN = {
  '체스트 프레스': 'Chest Press',
  '인클라인 체스트 프레스': 'Incline Chest Press',
  '디클라인 체스트 프레스': 'Decline Chest Press',
  '컨버징 체스트 프레스': 'Converging Chest Press',
  '아이소래터럴 체스트 프레스': 'Iso-Lateral Chest Press',
  '플레이트로드 체스트 프레스': 'Plate-Loaded Chest Press',
  펙덱: 'Pec Deck',
  '리어 델트 / 리버스 펙덱': 'Rear Delt / Reverse Pec Deck',
  '플라이 머신': 'Fly Machine',
  '딥 머신': 'Dip Machine',
  '어시스트 딥': 'Assisted Dip',
  '슈퍼 인클라인 프레스': 'Super Incline Press',
  랫풀다운: 'Lat Pulldown',
  '와이드 랫풀다운': 'Wide Lat Pulldown',
  '프론트 풀다운': 'Front Pulldown',
  '아이소래터럴 랫풀다운': 'Iso-Lateral Lat Pulldown',
  하이로우: 'High Row',
  '아이소래터럴 하이로우': 'Iso-Lateral High Row',
  '시티드 로우': 'Seated Row',
  '로우 머신': 'Row Machine',
  '로우 로우': 'Low Row',
  '미드 로우': 'Mid Row',
  '아이소래터럴 로우': 'Iso-Lateral Row',
  '아이소래터럴 로우 로우': 'Iso-Lateral Low Row',
  '체스트 서포티드 로우': 'Chest Supported Row',
  'T바 로우 머신': 'T-Bar Row',
  풀오버: 'Pullover',
  '어시스트 풀업 / 친업': 'Assisted Pull-up / Chin-up',
  '숄더 프레스': 'Shoulder Press',
  '아이소래터럴 숄더 프레스': 'Iso-Lateral Shoulder Press',
  '플레이트로드 숄더 프레스': 'Plate-Loaded Shoulder Press',
  '레터럴 레이즈': 'Lateral Raise',
  '머신 레터럴 레이즈': 'Machine Lateral Raise',
  '리어 델트': 'Rear Delt',
  '프론트 레이즈': 'Front Raise',
  '업라이트 로우': 'Upright Row',
  '로테이터 머신': 'Rotator Machine',
  '숄더 프레스 / 레터럴 복합 머신': 'Shoulder Press / Lateral Combo',
  '레그 프레스': 'Leg Press',
  '45도 레그 프레스': '45° Leg Press',
  '수평 레그 프레스': 'Horizontal Leg Press',
  '핵 스쿼트': 'Hack Squat',
  '스쿼트 프레스': 'Squat Press',
  '벨트 스쿼트': 'Belt Squat',
  '레그 익스텐션': 'Leg Extension',
  '시티드 레그 컬': 'Seated Leg Curl',
  '라잉 레그 컬': 'Lying Leg Curl',
  '스탠딩 레그 컬': 'Standing Leg Curl',
  '싱글 레그 컬': 'Single Leg Curl',
  '힙 쓰러스트': 'Hip Thrust',
  '글루트 드라이브': 'Glute Drive',
  '글루트 킥백': 'Glute Kickback',
  '힙 어브덕션': 'Hip Abduction',
  '힙 어덕션': 'Hip Adduction',
  '글루트 / 힙 머신': 'Glute / Hip Machine',
  '스탠딩 카프': 'Standing Calf',
  '시티드 카프': 'Seated Calf',
  '레그 프레스 카프': 'Leg Press Calf',
  '바이셉 컬': 'Biceps Curl',
  '프리처 컬': 'Preacher Curl',
  '아이소래터럴 바이셉 컬': 'Iso-Lateral Biceps Curl',
  '암 컬': 'Arm Curl',
  '트라이셉스 익스텐션': 'Triceps Extension',
  '트라이셉스 프레스': 'Triceps Press',
  '딥 / 트라이셉스 머신': 'Dip / Triceps Machine',
  '바이셉스 / 트라이셉스 복합 머신': 'Biceps / Triceps Combo',
  '앱 크런치': 'Ab Crunch',
  어브도미널: 'Abdominal',
  '로터리 토르소': 'Rotary Torso',
  '사이드 밴드': 'Side Bend',
  '백 익스텐션': 'Back Extension',
  '힙 익스텐션': 'Hip Extension',
  '복근 / 허리 복합 머신': 'Abs / Back Combo',
  '케이블 크로스오버': 'Cable Crossover',
  '듀얼 어저스터블 풀리': 'Dual Adjustable Pulley',
  '멀티 정글짐': 'Multi Jungle Gym',
  '어시스트 풀업 / 딥': 'Assisted Pull-up / Dip',
  '스미스 머신': 'Smith Machine',
  '파워 랙': 'Power Rack',
  '하프 랙': 'Half Rack',
};

const FALLBACK_CUE_KO = {
  chest: '등을 패드에 붙이고 팔꿈치로 밀어보세요',
  back: '손잡이보다 팔꿈치를 먼저 뒤로 보내세요',
  shoulders: '어깨를 으쓱하지 말고 팔꿈치를 궤적에 태우세요',
  legs: '발 전체로 밀고 골반은 시트에 고정하세요',
  glutes: '허리로 올리지 말고 엉덩이로 밀어보세요',
  calves: '발볼로만 올리고 무릎 각도는 유지하세요',
  arms: '팔꿈치 위치는 고정하고 아래팔만 움직이세요',
  core: '목으로 당기지 말고 몸통을 말아 올리세요',
  cable: '몸통을 고정한 뒤 팔꿈치 방향부터 잡으세요',
  rack: '안전바·시작 높이를 먼저 맞추세요',
  unknown: '무게보다 궤적 통제를 먼저 잡으세요',
};

const FALLBACK_CUE_EN = {
  chest: 'Stay on the pad and press through the elbows',
  back: 'Lead with the elbows, not the handles',
  shoulders: 'Keep the shoulders down and ride the elbow path',
  legs: 'Drive through the whole foot and keep the pelvis set',
  glutes: 'Drive with the glutes, not the lower back',
  calves: 'Rise through the balls of the feet and keep knee angle steady',
  arms: 'Fix the elbows and move only below them',
  core: 'Curl the torso — do not pull with the neck',
  cable: 'Brace first, then set the elbow direction',
  rack: 'Set safeties and start height before loading up',
  unknown: 'Control the path before chasing load',
};

/** Forbidden cue tokens by family (cross-contamination). */
const FORBIDDEN = {
  legs: [/팔꿈치/, /가슴\s*패드/, /견갑/, /elbow/, /chest pad/i, /scapula/i],
  glutes: [/팔꿈치/, /elbow/i, /가슴 패드에 고정하고 팔/],
  calves: [/팔꿈치/, /elbow/i, /가슴을 패드/],
  chest: [/무릎이 안쪽/, /골반을 시트에 붙이고 수평/, /발판을 밀/, /knee collapse/i],
  back: [/무릎이 안쪽/, /발판/, /무릎과 발목/],
  shoulders: [/발판/, /무릎이 안쪽/, /골반을 시트에/],
  arms: [/발판/, /무릎이 안쪽/, /골반을 시트에 붙이고 밀/],
  core: [/발판을 밀/, /팔꿈치를 뒤로 보내며 로우/],
};

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Korean topic particle 은/는 after a model name (ASCII-heavy names default to 은). */
function topic(name) {
  const s = String(name ?? '').trim();
  const lastHangul = [...s].reverse().find((ch) => /[가-힣]/.test(ch));
  if (!lastHangul) return `${s}은`;
  const hasBatchim = (lastHangul.charCodeAt(0) - 0xac00) % 28 !== 0;
  return `${s}${hasBatchim ? '은' : '는'}`;
}

function familyOf(nameKo) {
  return FAMILY_BY_NAME[nameKo] ?? 'unknown';
}

function seriesFlags(entry) {
  const blob = [
    entry.product_series,
    entry.verified_model,
    entry.verified_structure,
    entry.machine_name_ko,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return {
    iso: /iso[- ]?lateral|아이소|dual[- ]?axis|독립/.test(blob),
    plate: /plate[- ]?loaded|플레이트|signature plate/.test(blob),
    select: /\bselect\b|셀렉터|insignia|axiom/.test(blob),
    mts: /\bmts\b/.test(blob),
    converging: /converg|수렴|wide chest/.test(blob),
    chestSupported: /chest support|chest pad|가슴 패드|chest-supported|체스트 서포티드/.test(blob),
    assisted: /assist|어시스트/.test(blob),
    linear: /linear|수평|리니어|arc leg/.test(blob),
    vSquat: /v[- ]?squat|브이/.test(blob),
    insignia: /insignia/.test(blob),
    axiom: /axiom/.test(blob),
    signature: /signature/.test(blob),
    cableMotion: /cable motion|crossover|dual adjustable|multi-jungle|cmdap|cmaco/.test(blob),
  };
}

function parseAdjustments(text) {
  const raw = String(text ?? '')
    .split(/[,/·|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seat = raw.find((x) => /시트|seat|백\s*패드|back/i.test(x));
  const grip = raw.find((x) => /그립|손잡이|handle|grip|팔\s*패드|arm/i.test(x));
  const foot = raw.find((x) => /발|foot|플랫폼|platform/i.test(x));
  const other = raw.filter((x) => x !== seat && x !== grip && x !== foot);
  return { seat, grip, foot, other, raw };
}

function cleanCue(cue, family, lang) {
  const bad = !cue || /전용 모델 없음|no dedicated|no official|no hammer/i.test(cue);
  if (bad) return lang === 'ko' ? FALLBACK_CUE_KO[family] : FALLBACK_CUE_EN[family];
  return cue.replace(/^["']|["']$/g, '').trim();
}

function displayModel(entry) {
  if (entry.verification_status === 'BRAND_MODEL_NOT_FOUND' || !entry.verified_model) {
    return entry.machine_name_ko;
  }
  return entry.verified_model;
}

function introKo(entry, family, flags) {
  if (entry.verification_status === 'BRAND_MODEL_NOT_FOUND') {
    return brandMeta.noModelKo;
  }
  const bits = [];
  if (flags.iso) bits.push('좌우가 독립으로 움직이는');
  if (flags.plate) bits.push('플레이트 로딩');
  if (flags.converging) bits.push('안쪽으로 모이는');
  if (flags.chestSupported) bits.push('가슴 지지');
  if (flags.mts) bits.push('MTS 독립 스택');
  if (flags.insignia) bits.push('Insignia 셀렉터');
  else if (flags.axiom) bits.push('Axiom 셀렉터');
  else if (flags.select) bits.push('셀렉터 스택');
  if (flags.signature) bits.push('Signature');
  if (flags.cableMotion) bits.push('Cable Motion');
  if (/inspiration/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Inspiration Lock N Load');
  } else if (/impact|nitro/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Impact/Nitro');
  } else if (/eagle nx|dual axis/.test([entry.product_series, entry.verified_model, entry.verified_structure].join(' ').toLowerCase())) {
    bits.push('Eagle NX Dual Axis');
  } else if (/prestige|vr3/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Prestige/VR3');
  } else if (/roc-?it|rox/.test([entry.product_series, entry.verified_model, entry.verified_structure].join(' ').toLowerCase())) {
    bits.push('ROC-IT ROX');
  } else if (/ultra|g7-s/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Ultra G7');
  } else if (/versa|magnum|aura/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Versa/Magnum/Aura');
  } else if (/discovery selectorized|dsl\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Discovery DSL');
  } else if (/resolute|rsl\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Resolute RSL');
  } else if (/discovery plate|dpl\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Discovery Plate Loaded');
  } else if (/vitality|vsl/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Vitality');
  } else if (/fts\s*glide|queenax/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('FTS/Queenax');
  } else if (/evolution|e-\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Evolution SmartCam');
  } else if (/hybrid|h-\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Hybrid SmartCam');
  } else if (/plate loaded|p-\d+|xp-\d+|3-peg|smartstrength/i.test([entry.product_series, entry.verified_model, entry.verified_structure].join(' '))) {
    bits.push('Plate Loaded 3-peg');
  } else if (/prodigy|functional trainer|ft-123|chin\s*\|\s*dip|l-130|assist/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('PRODIGY/FT/Assist');
  }
  const flavor = bits.length ? `${bits.join(' · ')} 구조입니다.` : brandMeta.rideKo;
  const structure = String(entry.verified_structure ?? '')
    .replace(/입니다\.?$/, '')
    .replace(/입니다$/, '');
  return `${structure}. ${flavor} 처음부터 무게 올리지 말고, 세팅부터 잡으세요.`.replace(/\.\./g, '.');
}

function introEn(entry, family, flags) {
  if (entry.verification_status === 'BRAND_MODEL_NOT_FOUND') {
    return brandMeta.noModelEn;
  }
  const bits = [];
  if (flags.iso) bits.push('independent arms');
  if (flags.plate) bits.push('plate-loaded');
  if (flags.converging) bits.push('converging path');
  if (flags.chestSupported) bits.push('chest-supported');
  if (flags.mts) bits.push('MTS independent stacks');
  if (flags.insignia) bits.push('Insignia selectorized');
  else if (flags.axiom) bits.push('Axiom selectorized');
  else if (flags.select) bits.push('selectorized stack');
  if (flags.signature) bits.push('Signature');
  if (flags.cableMotion) bits.push('Cable Motion');
  if (/inspiration/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Inspiration Lock N Load');
  } else if (/impact|nitro/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Impact/Nitro');
  } else if (/eagle nx|dual axis/.test([entry.product_series, entry.verified_model, entry.verified_structure].join(' ').toLowerCase())) {
    bits.push('Eagle NX Dual Axis');
  } else if (/prestige|vr3/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Prestige/VR3');
  } else if (/roc-?it|rox/.test([entry.product_series, entry.verified_model, entry.verified_structure].join(' ').toLowerCase())) {
    bits.push('ROC-IT ROX');
  } else if (/ultra|g7-s/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Ultra G7');
  } else if (/versa|magnum|aura/.test([entry.product_series, entry.verified_model].join(' ').toLowerCase())) {
    bits.push('Versa/Magnum/Aura');
  } else if (/discovery selectorized|dsl\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Discovery DSL');
  } else if (/resolute|rsl\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Resolute RSL');
  } else if (/discovery plate|dpl\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Discovery Plate Loaded');
  } else if (/vitality|vsl/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Vitality');
  } else if (/fts\s*glide|queenax/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('FTS/Queenax');
  } else if (/evolution|e-\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Evolution SmartCam');
  } else if (/hybrid|h-\d+/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('Hybrid SmartCam');
  } else if (/plate loaded|p-\d+|xp-\d+|3-peg|smartstrength/i.test([entry.product_series, entry.verified_model, entry.verified_structure].join(' '))) {
    bits.push('Plate Loaded 3-peg');
  } else if (/prodigy|functional trainer|ft-123|chin\s*\|\s*dip|l-130|assist/i.test([entry.product_series, entry.verified_model].join(' '))) {
    bits.push('PRODIGY/FT/Assist');
  }
  const flavor = bits.length
    ? `Lean into the ${bits.join(' / ')} design.`
    : brandMeta.rideEn;
  return `${entry.verified_structure} ${flavor} Do not chase load until the setup feels locked in.`;
}

function setupKo(entry, family, flags, adj) {
  const lines = ['⚙️ ① 기구 세팅'];
  if (adj.seat || /시트|패드|seat|pad/i.test(entry.verified_adjustments ?? '')) {
    lines.push('🪑 좌석 / 패드');
    if (family === 'legs' || family === 'glutes') {
      lines.push(
        adj.seat
          ? `${adj.seat}부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.`
          : '시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.'
      );
    } else if (flags.chestSupported || family === 'back') {
      lines.push(
        '가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.'
      );
    } else {
      lines.push(
        adj.seat
          ? `${adj.seat}를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.`
          : '시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.'
      );
    }
  }
  if (adj.grip || family === 'chest' || family === 'back' || family === 'shoulders' || family === 'arms') {
    lines.push('🤲 그립 / 손 위치');
    if (flags.iso) {
      lines.push('양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.');
    } else if (family === 'legs' || family === 'glutes' || family === 'calves') {
      lines.push('손잡이는 안정용입니다. 힘으로 당기지 말고 몸통만 잡아 주세요.');
    } else {
      lines.push(
        adj.grip
          ? `${adj.grip}를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.`
          : '손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.'
      );
    }
  }
  if (adj.foot || family === 'legs' || family === 'glutes' || family === 'calves' || flags.vSquat) {
    lines.push('🦶 발 위치');
    if (family === 'calves') {
      lines.push('발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.');
    } else if (flags.linear) {
      lines.push('수평 궤적에 맞춰 발판 중앙에 발을 안정적으로 두세요. 무릎·발끝 방향을 맞춥니다.');
    } else if (family === 'legs') {
      lines.push('발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.');
    } else {
      lines.push('지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.');
    }
  }
  lines.push('⚙️ 조절 포인트');
  const adjustText =
    entry.verified_adjustments?.trim() ||
    (family === 'rack' ? '안전바, J컵, 바 높이' : '시트, 패드, 시작 위치, 중량');
  const last = [...adjustText].reverse().find((ch) => /[가-힣]/.test(ch));
  const hasBatchim = last ? (last.charCodeAt(0) - 0xac00) % 28 !== 0 : true;
  const obj = hasBatchim ? '을' : '를';
  lines.push(
    `${adjustText}${obj} 확인하세요.${flags.plate ? ' 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.' : ''}${
      flags.iso ? ' 좌우 시작 위치가 같은지도 같이 봅니다.' : ''
    }`
  );
  if (entry.verification_status === 'PARTIALLY_VERIFIED') {
    lines.push('이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.');
  }
  return lines;
}

function setupEn(entry, family, flags, adj) {
  const lines = ['⚙️ ① Setup'];
  if (adj.seat || /seat|pad|시트|패드/i.test(entry.verified_adjustments ?? '')) {
    lines.push('🪑 Seat / pads');
    if (family === 'legs' || family === 'glutes') {
      lines.push(
        'Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.'
      );
    } else if (flags.chestSupported || family === 'back') {
      lines.push('Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.');
    } else {
      lines.push('Fit the seat to your body so the start position sits naturally on the working joint.');
    }
  }
  if (adj.grip || ['chest', 'back', 'shoulders', 'arms'].includes(family)) {
    lines.push('🤲 Grip / hands');
    if (flags.iso) {
      lines.push('Match left and right handle height first — independent arms expose any mismatch immediately.');
    } else if (['legs', 'glutes', 'calves'].includes(family)) {
      lines.push('Handles are for bracing only. Do not yank them to move the load.');
    } else {
      lines.push('Take a comfortable grip width and keep the wrists stacked, not bent.');
    }
  }
  if (adj.foot || ['legs', 'glutes', 'calves'].includes(family) || flags.vSquat) {
    lines.push('🦶 Feet');
    if (family === 'calves') {
      lines.push('Balls of the feet on the platform; leave room for the heels to drop.');
    } else if (flags.linear) {
      lines.push('Center the feet on the horizontal path and keep knees tracking with toes.');
    } else if (family === 'legs') {
      lines.push('Center the feet. If placement is too high or low, the pelvis lifts first.');
    } else {
      lines.push('Lock in the support foot before you move. Reduce load if you wobble.');
    }
  }
  lines.push('⚙️ Adjustments');
  const adjustText = entry.verified_adjustments?.trim() || 'seat, pads, start position, load';
  lines.push(
    `Check ${adjustText}.${flags.plate ? ' Match plates on both sides — do not load one arm first.' : ''}${
      flags.iso ? ' Confirm both sides start from the same position.' : ''
    }`
  );
  if (entry.verification_status === 'PARTIALLY_VERIFIED') {
    lines.push('Naming can overlap in this category — trust the levers and pads on the unit in front of you.');
  }
  return lines;
}

function startKo(family, flags) {
  const lines = ['💪 ② 시작 자세'];
  const map = {
    chest: '등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.',
    back: '가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.',
    shoulders: '갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.',
    legs: '골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.',
    glutes: '골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.',
    calves: '무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.',
    arms: '팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.',
    core: '골반을 안정시키고 목으로 당길 생각을 지웁니다.',
    cable: '발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.',
    rack: '바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.',
    unknown: '몸이 흔들리지 않는 시작 위치를 먼저 만듭니다.',
  };
  lines.push(map[family]);
  if (flags.iso) lines.push('좌우가 같은 높이에서 시작하는지 한 번 더 보세요.');
  lines.push('이 자세에서 이것만 확인하세요.');
  const check = {
    chest: '👉 등이 패드에서 뜨지 않는지',
    back: '👉 어깨가 귀 쪽으로 올라가지 않는지',
    shoulders: '👉 허리가 과하게 꺾이지 않는지',
    legs: '👉 골반이 말리지 않는 깊이인지',
    glutes: '👉 허리가 아니라 엉덩이가 일을 받을 준비인지',
    calves: '👉 무릎이 같이 굽혀지지 않는지',
    arms: '👉 팔꿈치가 앞으로 흘러가지 않는지',
    core: '👉 골반이 고정돼 있는지',
    cable: '👉 몸이 케이블에 끌려가지 않는지',
    rack: '👉 안전바가 내 가동범위에 맞는지',
    unknown: '👉 시작 자세가 편안한지',
  };
  lines.push(check[family]);
  return lines;
}

function startEn(family, flags) {
  const lines = ['💪 ② Start position'];
  const map = {
    chest: 'Pin back and pelvis to the pad with the handles at chest height.',
    back: 'Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.',
    shoulders: 'Drop the ribs — do not over-arch. Set the elbows on the press path.',
    legs: 'Plant the pelvis and feel the whole foot on the platform. Align knees with toes.',
    glutes: 'Set the pelvis first. Do not plan to create height with the lower back.',
    calves: 'Lock the knee angle and prepare to move only through the ankles.',
    arms: 'Fix the elbows on the pad or at your sides. Kill torso swing.',
    core: 'Stabilize the pelvis and stop thinking about pulling with the neck.',
    cable: 'Set the stance, brace, then confirm cable height.',
    rack: 'Set bar and safety height, then center yourself in the rack.',
    unknown: 'Build a start position that does not wobble.',
  };
  lines.push(map[family]);
  if (flags.iso) lines.push('Double-check both sides start at the same height.');
  lines.push('Check only this:');
  const check = {
    chest: '👉 Back still on the pad',
    back: '👉 Shoulders not shrugged',
    shoulders: '👉 Low back not over-arched',
    legs: '👉 Pelvis not curling under',
    glutes: '👉 Glutes ready to drive, not the lumbar spine',
    calves: '👉 Knees not bending with the calves',
    arms: '👉 Elbows not drifting forward',
    core: '👉 Pelvis locked',
    cable: '👉 Cable is not towing your torso',
    rack: '👉 Safeties match your range',
    unknown: '👉 Start feels honest',
  };
  lines.push(check[family]);
  return lines;
}

function execKo(entry, family, flags) {
  const lines = ['🔥 ③ 운동 방법'];
  const pathHint = entry.exercise_path_ko?.trim();
  if (pathHint) lines.push(`${pathHint}.`);
  if (flags.converging) {
    lines.push('손잡이가 직선으로만 가는 게 아닙니다. 기구가 만들어 주는 안쪽 궤적을 그대로 타세요. 억지로 모으지 마세요.');
  } else if (flags.iso) {
    lines.push('양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.');
  } else if (family === 'legs') {
    lines.push('발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.');
  } else if (family === 'back') {
    lines.push('손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.');
  } else if (family === 'chest') {
    lines.push('손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.');
  } else if (family === 'shoulders') {
    lines.push('반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.');
  } else if (family === 'arms') {
    lines.push('몸통은 고정, 팔꿈치 아래만 움직입니다.');
  } else if (family === 'glutes') {
    lines.push('허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.');
  } else if (family === 'calves') {
    lines.push('무릎으로 밀지 말고 발목 가동범위로만 위아래를 만듭니다.');
  } else if (family === 'core') {
    lines.push('갈비뼈를 골반 쪽으로 말아 올리는 느낌으로 수축하세요.');
  } else {
    lines.push('반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.');
  }
  return lines;
}

function execEn(entry, family, flags) {
  const lines = ['🔥 ③ Execution'];
  if (flags.converging) {
    lines.push('The handles are not a straight line — ride the converging path. Do not force them together.');
  } else if (flags.iso) {
    lines.push('Match left-right speed. If one side finishes early, fix balance before adding load.');
  } else if (family === 'legs') {
    lines.push('Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.');
  } else if (family === 'back') {
    lines.push('Do not think “pull the handle.” Drive the elbows to the target.');
  } else if (family === 'chest') {
    lines.push('Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.');
  } else if (family === 'shoulders') {
    lines.push('No bounce. Let the elbows own the path.');
  } else if (family === 'arms') {
    lines.push('Torso stays quiet. Move only below the elbows.');
  } else if (family === 'glutes') {
    lines.push('Finish with the hips/glutes — do not manufacture height with the lumbar spine.');
  } else if (family === 'calves') {
    lines.push('Do not press with the knees. Use ankle range only.');
  } else if (family === 'core') {
    lines.push('Curl the ribcage toward the pelvis.');
  } else {
    lines.push('Repeat the same path without momentum. Reduce load if you wobble.');
  }
  if (entry.exercise_path_ko) {
    // Keep a short English path paraphrase via family rather than mangled KO.
    lines.push(pathEn(family, flags));
  }
  return lines;
}

function pathEn(family, flags) {
  const map = {
    chest: 'Press out on the machine path, then return under control.',
    back: 'Drive the elbows back/down on the row or pulldown path, then lengthen slowly.',
    shoulders: 'Press or raise on the guided path, then lower without dumping the shoulders.',
    legs: 'Bend, press through the mid-foot, and return without bouncing the knees.',
    glutes: 'Drive the hips, squeeze, then lower without lumbar snap.',
    calves: 'Lower the heels, rise through the balls of the feet, pause, then lower.',
    arms: 'Curl or extend only at the elbow, then reverse slowly.',
    core: 'Curl or rotate through the torso, then return without momentum.',
    cable: 'Set the line of pull, move through the elbows, return without letting the stack yank you.',
    rack: 'Stay centered on the bar path and control every rep into the safeties.',
    unknown: 'Own the concentric, then own the eccentric.',
  };
  return flags.iso ? `${map[family]} Keep both sides honest.` : map[family];
}

function peakKo(family) {
  return [
    '💥 ④ 최고 수축',
    family === 'legs'
      ? '무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.'
      : family === 'back'
        ? '팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.'
        : family === 'chest'
          ? '팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.'
          : family === 'calves'
            ? '발볼로 최대한 올린 꼭대기에서 멈춥니다.'
            : '목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.',
    '⏱️ 1초 STOP',
    '튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.',
  ];
}

function peakEn(family) {
  return [
    '💥 ④ Peak contraction',
    family === 'legs'
      ? 'Stop just short of hard lockout where quads/glutes still own the load.'
      : family === 'back'
        ? 'Stop where the elbows arrive and the back is squeezed.'
        : family === 'chest'
          ? 'Stop where the chest is contracted — do not dump the shoulders farther forward.'
          : family === 'calves'
            ? 'Stop at the top of the rise through the balls of the feet.'
            : 'Stop where the target muscle is most shortened.',
    '⏱️ 1-second STOP',
    'Own that position for one second. This is not where you dump the weight.',
  ];
}

function returnKo(family) {
  return [
    '🐌 ⑤ 천천히 돌아오기',
    '중량을 그냥 놓지 마세요.',
    '2~3초 동안 통제하면서 복귀합니다.',
    family === 'legs'
      ? '내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.'
      : family === 'back'
        ? '팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.'
        : '시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.',
  ];
}

function returnEn(family) {
  return [
    '🐌 ⑤ Controlled return',
    'Do not dump the load.',
    'Take 2–3 seconds on the way back.',
    family === 'legs'
      ? 'Reverse before the pelvis curls under.'
      : family === 'back'
        ? 'Keep the back set as the arms lengthen — do not let the shoulders dump forward.'
        : 'Return on the same path you pressed or pulled.',
  ];
}

function mistakesKo(entry, family, flags) {
  const specific = entry.common_mistake_ko
    ? entry.common_mistake_ko.replace(/것$/, '').trim()
    : null;
  const bank = {
    chest: [
      '어깨를 앞으로 말며 반동으로 미는 것',
      '허리를 과하게 아치해 가슴 대신 요추로 미는 것',
      '끝에서 어깨를 더 밀어 넣는 것',
    ],
    back: [
      '몸을 뒤로 젖혀 반동으로 당기는 것',
      '어깨를 으쓱하며 승모근만 쓰는 것',
      '손잡이만 당기고 팔꿈치는 안 움직이는 것',
    ],
    shoulders: [
      '허리를 꺾어 프레스하는 것',
      '어깨를 귀 쪽으로 으쓱하는 것',
      '반동으로 들어 올리는 것',
    ],
    legs: [
      '무릎이 안쪽으로 무너지는 것',
      '하부 범위에서 요추가 뜨거나 골반이 말리는 것',
      '무릎을 강하게 잠그며 튕기는 것',
    ],
    glutes: [
      '허리로 높이 만드는 것',
      '골반이 돌아가며 한쪽만 미는 것',
      '반동으로 올리는 것',
    ],
    calves: [
      '무릎을 같이 굽혀 카프가 아닌 다리로 미는 것',
      '발뒤꿈치를 튕기는 것',
      '가동범위를 너무 짧게 가져가는 것',
    ],
    arms: [
      '팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것',
      '몸통 반동으로 올리는 것',
      '손목을 과하게 꺾는 것',
    ],
    core: [
      '목으로 당겨 몸통을 접는 것',
      '골반이 뜨며 반동을 쓰는 것',
      '너무 큰 범위로 과하게 꺾는 것',
    ],
    cable: [
      '케이블에 몸이 끌려가는 것',
      '높이 설정을 대충 하고 시작하는 것',
      '스택을 놓듯 되돌리는 것',
    ],
    rack: [
      '안전바 높이를 안 맞추고 올리는 것',
      '좌우 원판 불균형',
      '바 경로와 발 위치가 어긋나는 것',
    ],
    unknown: [
      '세팅 없이 바로 무게를 올리는 것',
      '반동으로 반복하는 것',
      '통증이 있는데도 억지로 가동범위를 키우는 것',
    ],
  };
  const list = [...bank[family]];
  if (specific && !list.some((x) => x.includes(specific.slice(0, 8)))) {
    list.unshift(specific);
  }
  if (flags.iso) list.push('한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것');
  if (flags.plate) list.push('양쪽 플레이트 무게를 다르게 올리는 것');
  const unique = [...new Set(list)].slice(0, 5);
  const lines = ['❌ 흔한 실수'];
  for (const m of unique.slice(0, Math.max(3, Math.min(5, unique.length)))) {
    lines.push(`❌ ${m}`);
    lines.push(explainMistakeKo(m, family));
  }
  return lines;
}

function explainMistakeKo(m, family) {
  if (/무릎이 안쪽/.test(m)) return '발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.';
  if (/요추|골반이 말/.test(m)) return '깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.';
  if (/반동/.test(m)) return '템포를 늦추고 같은 궤적만 반복하세요.';
  if (/으쓱|승모/.test(m)) return '어깨를 귀에서 멀리 두고 다시 시작하세요.';
  if (/플레이트/.test(m)) return '양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.';
  if (/한쪽만/.test(m)) return '약한 쪽 속도에 강한 쪽을 맞추세요.';
  if (/목으로/.test(m)) return '갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.';
  if (/안전바/.test(m)) return '세트 전에 안전 위치부터 다시 맞추세요.';
  return family === 'legs' ? '자세가 무너지면 깊이·무게를 줄이세요.' : '자세가 무너지면 무게를 낮추세요.';
}

function mistakesEn(entry, family, flags) {
  const bank = {
    chest: [
      'Dumping the shoulders forward and bouncing the press',
      'Over-arching so the low back takes over',
      'Shoving the shoulders farther at lockout',
    ],
    back: [
      'Leaning back for momentum',
      'Shrugging and turning it into an upper-trap pull',
      'Yank the handles without moving the elbows',
    ],
    shoulders: [
      'Pressing with an over-arched low back',
      'Shrugging the shoulders into the ears',
      'Bouncing the weight up',
    ],
    legs: [
      'Knees collapsing inward',
      'Pelvis curling / low back peeling at the bottom',
      'Snapping into a hard knee lockout',
    ],
    glutes: [
      'Creating height with the lumbar spine',
      'Rotating the pelvis and favoring one side',
      'Bouncing the lockout',
    ],
    calves: [
      'Bending the knees and turning it into a leg press',
      'Bouncing the heels',
      'Cutting the range too short',
    ],
    arms: [
      'Letting the elbows drift so the shoulders take over',
      'Swinging the torso',
      'Over-bending the wrists',
    ],
    core: [
      'Pulling with the neck',
      'Lifting the pelvis and using momentum',
      'Forcing an excessive range',
    ],
    cable: [
      'Letting the cable tow the torso',
      'Skipping height setup',
      'Dumping the stack on the return',
    ],
    rack: [
      'Loading before setting safeties',
      'Uneven plates',
      'Feet fighting the bar path',
    ],
    unknown: [
      'Jumping load before setup',
      'Using momentum',
      'Forcing range into pain',
    ],
  };
  const list = [...bank[family]];
  if (flags.iso) list.push('Letting one side finish early');
  if (flags.plate) list.push('Loading unequal plates');
  const unique = [...new Set(list)].slice(0, 5);
  const lines = ['❌ Common mistakes'];
  for (const m of unique.slice(0, Math.max(3, Math.min(5, unique.length)))) {
    lines.push(`❌ ${m}`);
    lines.push(explainMistakeEn(m));
  }
  return lines;
}

function explainMistakeEn(m) {
  if (/Knees collapsing/i.test(m)) return 'Drive knees with the toes. Reduce load immediately if they cave.';
  if (/Pelvis curling|low back peeling/i.test(m)) return 'Own pelvis position before depth.';
  if (/momentum|Bouncing|bounce/i.test(m)) return 'Slow the tempo and repeat one clean path.';
  if (/Shrugging/i.test(m)) return 'Keep the shoulders away from the ears and restart.';
  if (/unequal plates|Uneven plates/i.test(m)) return 'Match both sides, then confirm with a light set.';
  if (/one side finish/i.test(m)) return 'Match the stronger side to the weaker side’s speed.';
  if (/neck/i.test(m)) return 'Curl ribs toward the pelvis instead.';
  if (/safeties/i.test(m)) return 'Reset safety height before the set.';
  return 'If position breaks, cut the load.';
}

function proTipKo(entry, family, flags) {
  const lines = ['💡 MACHINE FIT PRO TIP'];
  if (entry.verification_status === 'BRAND_MODEL_NOT_FOUND') {
    lines.push(
      `🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "${entry.machine_name_ko}"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.`
    );
    return lines;
  }
  if (flags.iso) {
    lines.push(
      '🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.'
    );
  } else if (flags.converging) {
    lines.push(
      '🔥 손잡이가 가운데로 모이는 궤적이 설계입니다. 평행으로만 밀려고 버티지 말고, 기구가 안내하는 수렴 경로를 그대로 타세요.'
    );
  } else if (flags.chestSupported) {
    lines.push(
      '🔥 가슴 패드가 있는 이유가 반동을 끊기 위해서입니다. 패드를 밀고 일어서지 말고, 가슴을 붙인 채 팔꿈치만 움직이세요.'
    );
  } else if (flags.plate && family === 'legs') {
    lines.push(
      `🔥 ${topic(entry.verified_model)} 플레이트 로딩 레그 프레스입니다. 양쪽 원판을 맞춘 뒤, 안전 스톱을 내 가동범위에 먼저 걸고 시작하세요. 첫 2세트는 템포를 늦춰 골반이 뜨는지 확인합니다.`
    );
  } else if (flags.plate) {
    lines.push(
      `🔥 ${topic(entry.verified_model)} 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.`
    );
  } else if (flags.mts) {
    lines.push(
      '🔥 MTS 독립 스택은 좌우 무게를 다르게 둘 수도 있지만, 기본은 동일 핀입니다. 약한 쪽이 무너지면 강한 쪽 핀을 먼저 내리세요.'
    );
  } else if (flags.select) {
    lines.push(
      `🔥 Select 라인(${entry.verified_model})은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.`
    );
  } else if (flags.linear) {
    lines.push(
      '🔥 수평(리니어) 궤적은 45° 레그 프레스와 골반 느낌이 다릅니다. 시트에 골반을 붙인 채 수평으로 민다는 감각을 먼저 만드세요.'
    );
  } else if (family === 'rack') {
    lines.push(
      '🔥 해머 스트렝스 랙/스미스는 “바 경로에 몸을 맞추는” 장비입니다. 중량보다 안전바·시작 높이·발 위치를 먼저 고정하세요.'
    );
  } else {
    lines.push(
      `🔥 ${entry.verified_model}의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.`
    );
  }
  return lines;
}

function proTipEn(entry, family, flags) {
  const lines = ['💡 MACHINE FIT PRO TIP'];
  if (entry.verification_status === 'BRAND_MODEL_NOT_FOUND') {
    lines.push(
      `🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "${NAME_EN[entry.machine_name_ko] ?? entry.machine_name_ko}", rehearse five light reps, then start working sets.`
    );
    return lines;
  }
  if (flags.iso) {
    lines.push(
      '🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.'
    );
  } else if (flags.converging) {
    lines.push(
      '🔥 The machine is built to converge. Stop forcing a parallel press — ride the path it gives you.'
    );
  } else if (flags.chestSupported) {
    lines.push(
      '🔥 The chest pad exists to kill momentum. Stay glued to it and move only through the elbows.'
    );
  } else if (flags.plate && family === 'legs') {
    lines.push(
      `🔥 ${entry.verified_model} is plate-loaded. Match both sides, set the safety stops to your range first, and use the first two sets to confirm the pelvis stays down.`
    );
  } else if (flags.plate) {
    lines.push(
      `🔥 ${entry.verified_model} is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.`
    );
  } else if (flags.mts) {
    lines.push(
      '🔥 MTS independent stacks can be asymmetric, but start matched. If the weak side folds, drop the strong-side pin first.'
    );
  } else if (flags.select) {
    lines.push(
      `🔥 On Select (${entry.verified_model}), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.`
    );
  } else if (flags.linear) {
    lines.push(
      '🔥 Linear/horizontal paths feel different from a 45° sled. Keep the pelvis glued and press on the horizontal line.'
    );
  } else if (family === 'rack') {
    lines.push(
      '🔥 Hammer Strength racks/Smith units reward lining your body up to the bar path. Safeties and foot placement beat ego loading.'
    );
  } else {
    lines.push(
      `🔥 Use the guided path on ${entry.verified_model}. Slow the first two sets, confirm symmetry, then add load.`
    );
  }
  return lines;
}

function checkKo(family, flags, adj) {
  const lines = ['🎯 MACHINE FIT CHECK'];
  const items = [];
  if (adj.seat || ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'].includes(family)) {
    items.push(family === 'legs' ? '🟢 시트/패드 → 골반 고정' : '🟢 시트/패드 → 몸에 맞춤');
  }
  if (['legs', 'glutes', 'calves'].includes(family)) {
    items.push('🟢 발 → 발판 중앙·방향 정렬');
  } else if (flags.chestSupported) {
    items.push('🟢 가슴 → 패드에 고정');
  } else if (['chest', 'back', 'shoulders', 'arms'].includes(family)) {
    items.push(family === 'back' ? '🟢 팔꿈치 → 당김 방향' : '🟢 팔꿈치 → 미는/드는 방향');
  } else if (family === 'rack') {
    items.push('🟢 안전바 → 가동범위에 맞춤');
  } else {
    items.push('🟢 몸통 → 브레스·고정');
  }
  if (flags.iso) items.push('🟢 좌우 → 같은 속도');
  else if (flags.plate) items.push('🟢 원판 → 좌우 동일');
  else items.push(family === 'legs' ? '🟢 무릎 → 발끝 방향' : '🟢 어깨 → 으쓱하지 않기');
  items.push('🟢 복귀 → 2~3초 통제');
  lines.push(...items.slice(0, 4));
  return lines;
}

function checkEn(family, flags, adj) {
  const lines = ['🎯 MACHINE FIT CHECK'];
  const items = [];
  if (adj.seat || ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'].includes(family)) {
    items.push(family === 'legs' ? '🟢 Seat/pad → pelvis planted' : '🟢 Seat/pad → fitted');
  }
  if (['legs', 'glutes', 'calves'].includes(family)) {
    items.push('🟢 Feet → centered and aligned');
  } else if (flags.chestSupported) {
    items.push('🟢 Chest → glued to pad');
  } else if (['chest', 'back', 'shoulders', 'arms'].includes(family)) {
    items.push(family === 'back' ? '🟢 Elbows → pull direction' : '🟢 Elbows → press/raise direction');
  } else if (family === 'rack') {
    items.push('🟢 Safeties → match your range');
  } else {
    items.push('🟢 Torso → braced');
  }
  if (flags.iso) items.push('🟢 Left/right → same speed');
  else if (flags.plate) items.push('🟢 Plates → matched');
  else items.push(family === 'legs' ? '🟢 Knees → track toes' : '🟢 Shoulders → not shrugged');
  items.push('🟢 Return → 2–3 sec control');
  lines.push(...items.slice(0, 4));
  return lines;
}

function finalKo(entry, family, flags) {
  const cue = cleanCue(entry.one_key_cue_ko, family, 'ko');
  if (family === 'legs') {
    return flags.linear
      ? '골반은 시트에, 발 전체로 수평으로 밀고, 복귀는 2~3초.'
      : '발 전체로 밀고, 골반은 끝까지 안정적으로.';
  }
  if (flags.chestSupported) return '가슴은 패드에, 팔꿈치는 뒤로, 끝에서 1초.';
  if (flags.iso) return '좌우 같은 속도, 끝에서 1초, 복귀는 통제.';
  if (family === 'calves') return '발볼로만, 꼭대기 1초, 튕기지 않기.';
  if (family === 'core') return '목 말고 몸통으로, 끝에서 조이고 천천히.';
  // shorten cue into final line
  return `${cue}. 끝에서 1초, 복귀는 통제.`;
}

function finalEn(entry, family, flags) {
  const cue = cleanCue(entry.one_key_cue_en, family, 'en');
  if (family === 'legs') {
    return flags.linear
      ? 'Pelvis glued, whole-foot horizontal drive, 2–3 sec return.'
      : 'Whole-foot drive, pelvis stays honest.';
  }
  if (flags.chestSupported) return 'Chest on the pad, elbows back, one-second squeeze.';
  if (flags.iso) return 'Match sides, one-second peak, controlled return.';
  if (family === 'calves') return 'Balls of the feet only, pause on top, no bounce.';
  if (family === 'core') return 'Torso curl, squeeze, slow return — not the neck.';
  return `${cue}. One-second peak, controlled return.`;
}

function buildTipKo(entry) {
  const family = familyOf(entry.machine_name_ko);
  const flags = seriesFlags(entry);
  const adj = parseAdjustments(entry.verified_adjustments);
  const cue = cleanCue(entry.one_key_cue_ko, family, 'ko');
  const model = displayModel(entry);
  const series = entry.product_series ? ` · ${entry.product_series}` : '';

  const parts = [
    `🏋️ ${brandMeta.displayEn} — ${model}${series}`,
    '',
    '🎯 ONE KEY CUE',
    `🔥 "${cue}"`,
    '',
    introKo(entry, family, flags),
    '',
    '---',
    '',
    ...setupKo(entry, family, flags, adj),
    '',
    '---',
    '',
    ...startKo(family, flags),
    '',
    '---',
    '',
    ...execKo(entry, family, flags),
    '',
    '---',
    '',
    ...peakKo(family),
    '',
    '---',
    '',
    ...returnKo(family),
    '',
    '---',
    '',
    ...mistakesKo(entry, family, flags),
    '',
    '---',
    '',
    ...proTipKo(entry, family, flags),
    '',
    '---',
    '',
    ...checkKo(family, flags, adj),
    '',
    '### 🔥 이것만 기억하세요',
    '',
    `"${finalKo(entry, family, flags)}"`,
  ];
  return parts.join('\n');
}

function buildTipEn(entry) {
  const family = familyOf(entry.machine_name_ko);
  const flags = seriesFlags(entry);
  const adj = parseAdjustments(entry.verified_adjustments);
  const cue = cleanCue(entry.one_key_cue_en, family, 'en');
  const model = entry.verification_status === 'BRAND_MODEL_NOT_FOUND' || !entry.verified_model
    ? NAME_EN[entry.machine_name_ko] ?? entry.machine_name_ko
    : entry.verified_model;
  const series = entry.product_series ? ` · ${entry.product_series}` : '';

  const parts = [
    `🏋️ ${brandMeta.displayEn} — ${model}${series}`,
    '',
    '🎯 ONE KEY CUE',
    `🔥 "${cue}"`,
    '',
    introEn(entry, family, flags),
    '',
    '---',
    '',
    ...setupEn(entry, family, flags, adj),
    '',
    '---',
    '',
    ...startEn(family, flags),
    '',
    '---',
    '',
    ...execEn(entry, family, flags),
    '',
    '---',
    '',
    ...peakEn(family),
    '',
    '---',
    '',
    ...returnEn(family),
    '',
    '---',
    '',
    ...mistakesEn(entry, family, flags),
    '',
    '---',
    '',
    ...proTipEn(entry, family, flags),
    '',
    '---',
    '',
    ...checkEn(family, flags, adj),
    '',
    '### 🔥 Remember this',
    '',
    `"${finalEn(entry, family, flags)}"`,
  ];
  return parts.join('\n');
}

function auditCrossContamination(entries, tips) {
  const issues = [];
  for (let i = 0; i < entries.length; i++) {
    const family = familyOf(entries[i].machine_name_ko);
    const rules = FORBIDDEN[family] ?? [];
    const tip = tips[i];
    for (const re of rules) {
      if (re.test(tip.ko) || re.test(tip.en)) {
        issues.push({
          machine: entries[i].machine_name_ko,
          family,
          pattern: String(re),
        });
      }
    }
    // ONE KEY CUE must not be "no model"
    if (/전용 모델 없음|No dedicated|No official/i.test(tip.ko) && /ONE KEY CUE[\s\S]{0,80}전용 모델/.test(tip.ko)) {
      issues.push({ machine: entries[i].machine_name_ko, family, pattern: 'bad-one-key-cue' });
    }
    if (/verification_status|VERIFIED|BRAND_MODEL_NOT_FOUND|📋 검증/.test(tip.ko)) {
      issues.push({ machine: entries[i].machine_name_ko, family, pattern: 'verification-dump' });
    }
  }
  return issues;
}

function main() {
  const outArg = process.argv.find((a) => a.startsWith('--out='));
  const outPath = outArg
    ? path.resolve(ROOT, outArg.slice('--out='.length))
    : path.join(ROOT, 'database/catalog/pro-tips', brandMeta.csvFile);

  const entries = JSON.parse(fs.readFileSync(RESEARCH, 'utf8'));
  if (entries.length !== 80) {
    console.error(`Expected 80 research entries, got ${entries.length}`);
    process.exit(1);
  }

  const headers = [
    'brand_code',
    'machine_name_ko',
    'machine_name_en',
    'verified_model',
    'verification_status',
    'manufacturer',
    'product_series',
    'source_url',
    'verified_structure',
    'verified_adjustments',
    'exercise_tip',
    'exercise_tip_en',
  ];

  const rows = [headers.join(',')];
  const stats = { VERIFIED: 0, PARTIALLY_VERIFIED: 0, BRAND_MODEL_NOT_FOUND: 0 };
  let maxKo = 0;
  let maxEn = 0;
  const tipBundles = [];
  const overBytes = [];
  const missingFamily = [];

  for (const entry of entries) {
    if (!FAMILY_BY_NAME[entry.machine_name_ko]) missingFamily.push(entry.machine_name_ko);
    stats[entry.verification_status] = (stats[entry.verification_status] ?? 0) + 1;
    const tipKo = buildTipKo(entry);
    const tipEn = buildTipEn(entry);
    const koB = Buffer.byteLength(tipKo, 'utf8');
    const enB = Buffer.byteLength(tipEn, 'utf8');
    maxKo = Math.max(maxKo, koB);
    maxEn = Math.max(maxEn, enB);
    if (koB > MAX_BYTES || enB > MAX_BYTES) {
      overBytes.push({ machine: entry.machine_name_ko, koB, enB });
    }
    tipBundles.push({ ko: tipKo, en: tipEn });

    const cells = [
      BRAND,
      entry.machine_name_ko,
      NAME_EN[entry.machine_name_ko] ?? entry.machine_name_ko,
      entry.verified_model ?? '',
      entry.verification_status,
      entry.manufacturer ?? brandMeta.manufacturerDefault,
      entry.product_series ?? '',
      entry.source_url ?? '',
      entry.verified_structure ?? '',
      entry.verified_adjustments ?? '',
      tipKo,
      tipEn,
    ].map(csvEscape);
    rows.push(cells.join(','));
  }

  const contamination = auditCrossContamination(entries, tipBundles);
  if (missingFamily.length || overBytes.length || contamination.length) {
    console.error(
      JSON.stringify({ missingFamily, overBytes, contamination: contamination.slice(0, 30) }, null, 2)
    );
    process.exit(1);
  }

  // uniqueness: fingerprints of PRO TIP section should not all be identical
  const proFingerprints = new Set(
    tipBundles.map((t) => {
      const m = t.ko.split('💡 MACHINE FIT PRO TIP')[1]?.split('🎯 MACHINE FIT CHECK')[0] ?? t.ko;
      return m.replace(/\s+/g, ' ').trim().slice(0, 180);
    })
  );
  if (proFingerprints.size < 25) {
    console.error(`PRO tip diversity too low: ${proFingerprints.size} unique fingerprints`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, rows.join('\n') + '\n', 'utf8');

  const report = {
    brand: BRAND,
    generatedAt: new Date().toISOString(),
    outPath,
    rowCount: entries.length,
    stats,
    maxKoBytes: maxKo,
    maxEnBytes: maxEn,
    proTipUniqueFingerprints: proFingerprints.size,
    contaminationIssues: 0,
    overBytes: 0,
    style: 'trainer-coaching-v2',
  };
  const reportPath = path.join(ROOT, `.cursor/handoff/${BRAND.toLowerCase()}-pro-tips-gen.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main();
