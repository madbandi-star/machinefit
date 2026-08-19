#!/usr/bin/env node
/**
 * Generate HAMMER_STRENGTH PRO tips CSV from verified model research.
 *
 * Usage:
 *   node database/scripts/generate-hammer-strength-pro-tips.mjs [--out path.csv]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RESEARCH = path.join(
  ROOT,
  'database/catalog/pro-tips/research/hammer_strength_models.json'
);
const BRAND = 'HAMMER_STRENGTH';

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildTipKo(entry) {
  const status = entry.verification_status;
  const series = entry.product_series ? ` · ${entry.product_series}` : '';
  const header =
    status === 'BRAND_MODEL_NOT_FOUND'
      ? '🏋️ HAMMER STRENGTH — 운동 가이드 (공식 전용 모델 미확인)'
      : `🏋️ HAMMER STRENGTH — ${entry.verified_model}${series}`;

  const modelBlock =
    status === 'BRAND_MODEL_NOT_FOUND'
      ? [
          '📋 검증 상태: BRAND_MODEL_NOT_FOUND',
          '해머 스트렝스 공식 카탈로그에서 이 운동 유형에 1:1 대응되는 전용 모델을 확인하지 못했습니다.',
          '아래 팁은 해당 운동 패턴에 대한 안전한 일반 가이드이며, 실제 설치된 기구의 레버·패드·핀을 먼저 확인하세요.',
        ]
      : [
          `📋 검증 상태: ${status}`,
          `🏷️ 확인 모델: ${entry.verified_model}`,
          entry.verified_structure,
          `⚙️ 조절 포인트: ${entry.verified_adjustments}`,
        ];

  return [
    header,
    '',
    '🎯 ONE KEY CUE',
    `🔥 "${entry.one_key_cue_ko}"`,
    '',
    '⚙️ ① 기구 세팅',
    ...modelBlock,
    '',
    '🛤️ ② 운동 경로',
    entry.exercise_path_ko,
    '',
    '⚠️ ③ 흔한 실수',
    entry.common_mistake_ko,
    '',
    '💡 MACHINE FIT PRO TIP',
    status === 'BRAND_MODEL_NOT_FOUND'
      ? '무게보다 궤적 통제를 우선하세요. 시트·패드·손잡이 높이를 맞춘 뒤 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.'
      : `${entry.product_series ?? 'Hammer Strength'} 라인 특성(가이드 궤적·좌우 독립·플레이트 로딩)에 맞춰 첫 2세트는 템포를 늦추고, 좌우/전후 대칭을 확인한 다음 무게를 올리세요.`,
  ].join('\n');
}

function buildTipEn(entry) {
  const status = entry.verification_status;
  const series = entry.product_series ? ` · ${entry.product_series}` : '';
  const header =
    status === 'BRAND_MODEL_NOT_FOUND'
      ? '🏋️ HAMMER STRENGTH — Exercise guide (no dedicated official model)'
      : `🏋️ HAMMER STRENGTH — ${entry.verified_model}${series}`;

  const modelBlock =
    status === 'BRAND_MODEL_NOT_FOUND'
      ? [
          '📋 Status: BRAND_MODEL_NOT_FOUND',
          'No dedicated Hammer Strength catalog model maps 1:1 to this exercise category.',
          'Tips below are safe general guidance—confirm levers, pads, and pins on the unit in your gym first.',
        ]
      : [
          `📋 Status: ${status}`,
          `🏷️ Verified model: ${entry.verified_model}`,
          entry.verified_structure.replace(/입니다\.?$/, '.'),
          `⚙️ Adjustments: ${entry.verified_adjustments}`,
        ];

  return [
    header,
    '',
    '🎯 ONE KEY CUE',
    `🔥 "${entry.one_key_cue_en}"`,
    '',
    '⚙️ ① Setup',
    ...modelBlock,
    '',
    '🛤️ ② Movement path',
    entry.exercise_path_ko.includes('복귀')
      ? entry.exercise_path_ko
          .replace(/복귀/g, 'return')
          .replace(/밀/g, 'press')
          .replace(/당기/g, 'pull')
      : entry.exercise_path_ko,
    '',
    '⚠️ ③ Common mistake',
    entry.common_mistake_ko.includes('것')
      ? entry.common_mistake_ko.replace(/것$/, '')
      : entry.common_mistake_ko,
    '',
    '💡 MACHINE FIT PRO TIP',
    status === 'BRAND_MODEL_NOT_FOUND'
      ? 'Prioritize path control over load. Match seat and pad height, rehearse five light reps, then start working sets.'
      : `Use the ${entry.product_series ?? 'Hammer Strength'} guided path: slow the first two sets, check left-right symmetry, then add load.`,
  ].join('\n');
}

function machineNameEn(ko) {
  const map = {
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
  return map[ko] ?? ko;
}

function main() {
  const outArg = process.argv.find((a) => a.startsWith('--out='));
  const outPath = outArg
    ? outArg.slice('--out='.length)
    : path.join(ROOT, 'database/catalog/pro-tips/hammer_strength_pro_tips.csv');

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

  for (const entry of entries) {
    stats[entry.verification_status] = (stats[entry.verification_status] ?? 0) + 1;
    const tipKo = buildTipKo(entry);
    const tipEn = buildTipEn(entry);
    maxKo = Math.max(maxKo, Buffer.byteLength(tipKo, 'utf8'));
    maxEn = Math.max(maxEn, Buffer.byteLength(tipEn, 'utf8'));

    const cells = [
      BRAND,
      entry.machine_name_ko,
      machineNameEn(entry.machine_name_ko),
      entry.verified_model ?? '',
      entry.verification_status,
      entry.manufacturer ?? 'Life Fitness (Hammer Strength)',
      entry.product_series ?? '',
      entry.source_url ?? '',
      entry.verified_structure ?? '',
      entry.verified_adjustments ?? '',
      tipKo,
      tipEn,
    ].map(csvEscape);
    rows.push(cells.join(','));
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
  };
  const reportPath = path.join(ROOT, '.cursor/handoff/hammer-strength-pro-tips-gen.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(JSON.stringify(report, null, 2));
}

main();
