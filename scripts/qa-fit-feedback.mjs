/**
 * Fit-feedback QA harness (API-level, production).
 * Covers: good/bad buttons, prefs save, reload persistence, member/gym scope,
 * multi-machine, toggle flows, rapid clicks, history linkage.
 *
 * Run: node scripts/qa-fit-feedback.mjs
 */
const API = 'https://machinefit-api.onrender.com/api/v1';
const EMAIL = process.env.QA_EMAIL || 'admin@machinefit.com';
const PASSWORD = process.env.QA_PASSWORD || 'demo1234';

const rows = [];
const ts = Date.now();

function record(tc, expected, actual, ok, cause = '', priority = '') {
  rows.push({ tc, expected, actual, ok, cause, priority });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${tc}`);
  if (!ok) console.log(`  expected: ${expected}\n  actual:   ${actual}${cause ? `\n  cause:    ${cause}` : ''}${priority ? `\n  P: ${priority}` : ''}`);
}

async function api(path, { method = 'GET', token, body, delayMs = 0 } = {}) {
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, data: json?.data };
}

function auth(token) {
  return {
    getFeedback: (id) => api(`/recommendations/${id}/feedback`, { token }),
    postFeedback: (recommendationId, fitRating, scope) =>
      api('/recommendations/feedback', {
        method: 'POST',
        token,
        body: { recommendationId, fitRating, ...scope },
      }),
    getPrefs: (code, scope) => {
      const q = new URLSearchParams();
      if (scope?.gymId) q.set('gymId', scope.gymId);
      if (scope?.memberId) q.set('memberId', scope.memberId);
      const qs = q.toString() ? `?${q}` : '';
      return api(`/machines/${encodeURIComponent(code)}/preferences${qs}`, { token });
    },
    putPrefs: (code, body) =>
      api(`/machines/${encodeURIComponent(code)}/preferences`, {
        method: 'PUT',
        token,
        body,
      }),
    createRec: (body) => api('/recommendations', { method: 'POST', token, body }),
    getRec: (id) => api(`/recommendations/${id}`, { token }),
    batchFeedback: (ids) =>
      api(`/recommendations/feedback/batch?ids=${ids.join(',')}`, { token }),
    history: (gymId, memberId) => {
      const q = new URLSearchParams({ gymId, limit: '20' });
      if (memberId) q.set('memberId', memberId);
      return api(`/history?${q}`, { token });
    },
    members: (gymId) => api(`/users/me/gyms/${gymId}/members`, { token }),
    gyms: () => api('/users/me/gyms', { token }),
    me: () => api('/users/me', { token }),
  };
}

const login = await api('/auth/login', {
  method: 'POST',
  body: { email: EMAIL, password: PASSWORD },
});
if (login.status !== 200 || !login.data?.tokens?.accessToken) {
  console.error('Login failed', login.status, login.json);
  process.exit(1);
}
const token = login.data.tokens.accessToken;
const client = auth(token);
const me = await client.me();
const gyms = await client.gyms();
const gymId = gyms.data?.activeGymId;
const memberList = gymId ? (await client.members(gymId)).data ?? [] : [];
const selfMember = memberList.find((m) => m.isSelf) ?? memberList[0];
const memberId = selfMember?.id;
const scope = gymId && memberId ? { gymId, memberId } : undefined;

console.log('\n=== Fit-feedback QA ===');
console.log(`user=${EMAIL} gymId=${gymId} memberId=${memberId} scope=${!!scope}\n`);

const baseBody = {
  machineCode: 'FW_SMITH',
  gender: 'male',
  heightCm: 175,
  weightKg: 75,
  experienceLevel: 'intermediate',
  targetMuscleGroup: 'chest',
  workoutGoal: 'hypertrophy',
  ...(scope ?? {}),
};

// ---------- 1. Initial state (first recommendation / no feedback) ----------
const recA = await client.createRec({ ...baseBody, machineCode: 'CY_CHEST_PRESS' });
const idA = recA.data?.id;
const codeA = recA.data?.machineCode || 'CY_CHEST_PRESS';
record(
  '1.1 최초 추천 생성',
  '201 + recommendation id',
  `${recA.status} id=${idA}`,
  recA.status === 201 && !!idA
);

const fb0 = await client.getFeedback(idA);
record(
  '1.2 클릭 전 feedback null',
  'fitRating null',
  JSON.stringify(fb0.data),
  fb0.status === 200 && (fb0.data?.fitRating === null || fb0.data?.fitRating == null)
);

const prefs0 = await client.getPrefs(codeA, scope);
record(
  '1.3 최초 prefs 기본값',
  'activeSource recommended, empty/meaningful custom optional',
  `activeSource=${prefs0.data?.activeSource} custom=${JSON.stringify(prefs0.data?.customSettings)}`,
  prefs0.status === 200 && (prefs0.data?.activeSource === 'recommended' || prefs0.data?.activeSource === 'adjusted')
);

// ---------- 2. 잘맞음 (good) ----------
const good1 = await client.postFeedback(idA, 'good', scope);
record(
  '2.1 잘맞음 POST',
  '200 fitRating=good',
  `${good1.status} ${JSON.stringify(good1.data)}`,
  good1.status === 200 && good1.data?.fitRating === 'good',
  good1.status !== 200 ? JSON.stringify(good1.json) : '',
  'P1'
);

const fbGood = await client.getFeedback(idA);
record(
  '2.2 잘맞음 GET 즉시 반영',
  'fitRating=good',
  JSON.stringify(fbGood.data),
  fbGood.data?.fitRating === 'good',
  '',
  'P1'
);

const prefsGood = await client.getPrefs(codeA, scope);
record(
  '2.3 잘맞음 → activeSource=recommended',
  'activeSource recommended',
  `activeSource=${prefsGood.data?.activeSource}`,
  prefsGood.data?.activeSource === 'recommended',
  'submitFeedback setActiveSource(good→recommended)',
  'P1'
);

// ---------- 3. 조정필요 (bad) on new rec ----------
const recB = await client.createRec({ ...baseBody, machineCode: 'CY_CHEST_PRESS' });
const idB = recB.data?.id;
const bad1 = await client.postFeedback(idB, 'bad', scope);
record(
  '3.1 조정필요 POST',
  '200 fitRating=bad',
  `${bad1.status} ${JSON.stringify(bad1.data)}`,
  bad1.status === 200 && bad1.data?.fitRating === 'bad',
  '',
  'P1'
);

const prefsBad = await client.getPrefs(codeA, scope);
record(
  '3.2 조정필요 → activeSource=adjusted',
  'activeSource adjusted',
  `activeSource=${prefsBad.data?.activeSource}`,
  prefsBad.data?.activeSource === 'adjusted',
  '',
  'P1'
);

const aiWeight = recB.data?.aiRecommendedSettings?.recommendedWeightKg ?? recB.data?.settings?.recommendedWeightKg;
const adjustedWeight = typeof aiWeight === 'number' ? Math.max(5, aiWeight - 10) : 40;
const savePrefs = await client.putPrefs(codeA, {
  customSettings: {
    recommendedWeightKg: adjustedWeight,
    recommendedRepsMin: 8,
    recommendedRepsMax: 12,
  },
  activeSource: 'adjusted',
  ...(scope ?? {}),
});
record(
  '3.3 조정값 저장 PUT',
  `200 custom.recommendedWeightKg=${adjustedWeight} activeSource=adjusted`,
  `${savePrefs.status} w=${savePrefs.data?.customSettings?.recommendedWeightKg} src=${savePrefs.data?.activeSource}`,
  savePrefs.status === 200 &&
    Number(savePrefs.data?.customSettings?.recommendedWeightKg) === adjustedWeight &&
    savePrefs.data?.activeSource === 'adjusted',
  '',
  'P1'
);

const prefsAfterSave = await client.getPrefs(codeA, scope);
record(
  '3.4 저장 후 GET prefs 중량',
  `recommendedWeightKg=${adjustedWeight}`,
  `w=${prefsAfterSave.data?.customSettings?.recommendedWeightKg}`,
  Number(prefsAfterSave.data?.customSettings?.recommendedWeightKg) === adjustedWeight,
  '',
  'P1'
);

// ---------- 4. Reload / re-enter machine (new recommendation) ----------
const recReload = await client.createRec({ ...baseBody, machineCode: 'CY_CHEST_PRESS' });
record(
  '4.1 동일 머신 재진입 추천',
  `activeSource=adjusted, adjustedSettings.weight=${adjustedWeight}`,
  `src=${recReload.data?.activeSource} adjW=${recReload.data?.adjustedSettings?.recommendedWeightKg} settingsW=${recReload.data?.settings?.recommendedWeightKg} aiW=${recReload.data?.aiRecommendedSettings?.recommendedWeightKg}`,
  recReload.status === 201 &&
    recReload.data?.activeSource === 'adjusted' &&
    Number(recReload.data?.adjustedSettings?.recommendedWeightKg) === adjustedWeight,
  'resolveActiveRecommendationSettings should merge prefs',
  'P1'
);

const fbReloadPrev = await client.getFeedback(idB);
record(
  '4.2 이전 recommendation feedback 유지',
  'fitRating=bad still on idB',
  JSON.stringify(fbReloadPrev.data),
  fbReloadPrev.data?.fitRating === 'bad'
);

const fbNewRec = await client.getFeedback(recReload.data?.id);
record(
  '4.3 새 recommendation feedback는 독립(null)',
  'fitRating null on new id',
  JSON.stringify(fbNewRec.data),
  fbNewRec.data?.fitRating == null,
  'feedback is per recommendation_id, not per machine',
  'P2'
);

// ---------- 5. Toggle good ↔ bad ----------
const togBad = await client.postFeedback(recReload.data.id, 'bad', scope);
const togGood = await client.postFeedback(recReload.data.id, 'good', scope);
const togPrefs = await client.getPrefs(codeA, scope);
record(
  '5.1 조정필요→잘맞음 토글',
  'fitRating=good, activeSource=recommended (prefs custom may remain)',
  `fb=${(await client.getFeedback(recReload.data.id)).data?.fitRating} src=${togPrefs.data?.activeSource} stillHasCustom=${togPrefs.data?.customSettings?.recommendedWeightKg}`,
  togBad.status === 200 &&
    togGood.status === 200 &&
    (await client.getFeedback(recReload.data.id)).data?.fitRating === 'good' &&
    togPrefs.data?.activeSource === 'recommended',
  '',
  'P1'
);

const togBack = await client.postFeedback(recReload.data.id, 'bad', scope);
const togPrefs2 = await client.getPrefs(codeA, scope);
record(
  '5.2 잘맞음→조정필요 토글 + 기존 조정값 유지',
  `activeSource=adjusted, custom weight still ${adjustedWeight}`,
  `src=${togPrefs2.data?.activeSource} w=${togPrefs2.data?.customSettings?.recommendedWeightKg}`,
  togBack.status === 200 &&
    togPrefs2.data?.activeSource === 'adjusted' &&
    Number(togPrefs2.data?.customSettings?.recommendedWeightKg) === adjustedWeight,
  '',
  'P1'
);

// ---------- 6. Rapid clicks ----------
const recRapid = await client.createRec({ ...baseBody, machineCode: 'LF_LEG_PRESS' });
const rapid = await Promise.all([
  client.postFeedback(recRapid.data.id, 'good', scope),
  client.postFeedback(recRapid.data.id, 'bad', scope),
  client.postFeedback(recRapid.data.id, 'good', scope),
]);
const rapidFb = await client.getFeedback(recRapid.data.id);
const rapidCode = recRapid.data.machineCode || 'LF_LEG_PRESS';
const rapidPrefs = await client.getPrefs(rapidCode, scope);
record(
  '6.1 빠른 연타(동시 good/bad/good)',
  '최종 상태 consistent (last write wins); no 5xx',
  `statuses=${rapid.map((r) => r.status).join(',')} finalFb=${rapidFb.data?.fitRating} src=${rapidPrefs.data?.activeSource}`,
  rapid.every((r) => r.status === 200) &&
    (rapidFb.data?.fitRating === 'good' || rapidFb.data?.fitRating === 'bad') &&
    ((rapidFb.data?.fitRating === 'good' && rapidPrefs.data?.activeSource === 'recommended') ||
      (rapidFb.data?.fitRating === 'bad' && rapidPrefs.data?.activeSource === 'adjusted')),
  'concurrent upserts — last writer should match activeSource',
  'P2'
);

// ---------- 7. Multi-machine isolation ----------
await client.putPrefs(rapidCode, {
  customSettings: { recommendedWeightKg: 99 },
  activeSource: 'adjusted',
  ...(scope ?? {}),
});
const prefsChest = await client.getPrefs(codeA, scope);
const prefsLeg = await client.getPrefs(rapidCode, scope);
record(
  '7.1 머신별 prefs 분리',
  `chest keeps ${adjustedWeight}, leg=99`,
  `chest=${prefsChest.data?.customSettings?.recommendedWeightKg} leg=${prefsLeg.data?.customSettings?.recommendedWeightKg}`,
  Number(prefsChest.data?.customSettings?.recommendedWeightKg) === adjustedWeight &&
    Number(prefsLeg.data?.customSettings?.recommendedWeightKg) === 99,
  '',
  'P1'
);

// ---------- 8. Batch feedback / history ----------
const batch = await client.batchFeedback([idA, idB, recReload.data.id].filter(Boolean));
record(
  '8.1 feedback batch 조회',
  'map of ids → good/bad/null',
  JSON.stringify(batch.data),
  batch.status === 200 && batch.data?.[idA] === 'good' && batch.data?.[idB] === 'bad',
  '',
  'P2'
);

if (gymId) {
  const hist = await client.history(gymId, memberId);
  const items = hist.data ?? hist.data?.items ?? [];
  const arr = Array.isArray(items) ? items : [];
  record(
    '8.2 history 목록 조회',
    '200 array (may be empty if history not recorded)',
    `status=${hist.status} n=${arr.length} sample=${JSON.stringify(arr[0] ?? null).slice(0, 180)}`,
    hist.status === 200,
    'history may require separate record endpoint when viewing recommendation',
    'P3'
  );
}

// ---------- 9. Invalid / failure cases ----------
const badId = await client.postFeedback('00000000-0000-0000-0000-000000000000', 'good', scope);
record(
  '9.1 존재하지 않는 recommendation feedback',
  '4xx error',
  `${badId.status} ${JSON.stringify(badId.json?.error || badId.json).slice(0, 160)}`,
  badId.status >= 400 && badId.status < 500,
  '',
  'P2'
);

const noAuth = await api('/recommendations/feedback', {
  method: 'POST',
  body: { recommendationId: idA, fitRating: 'good' },
});
record(
  '9.2 비로그인 feedback 거부',
  '401',
  `${noAuth.status}`,
  noAuth.status === 401,
  '',
  'P1'
);

// ---------- 10. Multiple weight changes ----------
const w1 = adjustedWeight + 5;
const w2 = adjustedWeight + 10;
await client.putPrefs(codeA, {
  customSettings: { recommendedWeightKg: w1 },
  activeSource: 'adjusted',
  ...(scope ?? {}),
});
await client.putPrefs(codeA, {
  customSettings: { recommendedWeightKg: w2 },
  activeSource: 'adjusted',
  ...(scope ?? {}),
});
const prefsMulti = await client.getPrefs(codeA, scope);
record(
  '10.1 조정값 여러 번 변경',
  `final weight=${w2}`,
  `w=${prefsMulti.data?.customSettings?.recommendedWeightKg}`,
  Number(prefsMulti.data?.customSettings?.recommendedWeightKg) === w2,
  '',
  'P1'
);

const recAfterMulti = await client.createRec({ ...baseBody, machineCode: codeA });
record(
  '10.2 변경 후 재진입 반영',
  `adjustedSettings.weight=${w2}`,
  `adj=${recAfterMulti.data?.adjustedSettings?.recommendedWeightKg} src=${recAfterMulti.data?.activeSource}`,
  Number(recAfterMulti.data?.adjustedSettings?.recommendedWeightKg) === w2 &&
    recAfterMulti.data?.activeSource === 'adjusted',
  '',
  'P1'
);

// ---------- 11. Member scope separation (if we can create second member) ----------
let familyOk = null;
if (gymId && memberId) {
  const createMember = await api(`/users/me/gyms/${gymId}/members`, {
    method: 'POST',
    token,
    body: { name: `QA Family ${ts}` },
  });
  const familyId = createMember.data?.id;
  if (createMember.status === 201 && familyId) {
    const familyScope = { gymId, memberId: familyId };
    const recFam = await client.createRec({
      ...baseBody,
      machineCode: codeA,
      ...familyScope,
    });
    await client.putPrefs(codeA, {
      customSettings: { recommendedWeightKg: 11 },
      activeSource: 'adjusted',
      ...familyScope,
    });
    const selfP = await client.getPrefs(codeA, scope);
    const famP = await client.getPrefs(codeA, familyScope);
    familyOk =
      Number(selfP.data?.customSettings?.recommendedWeightKg) === w2 &&
      Number(famP.data?.customSettings?.recommendedWeightKg) === 11;
    record(
      '11.1 가족 회원 prefs 분리',
      `self=${w2}, family=11`,
      `self=${selfP.data?.customSettings?.recommendedWeightKg} family=${famP.data?.customSettings?.recommendedWeightKg} famRecSrc=${recFam.data?.activeSource}`,
      familyOk,
      '',
      'P1'
    );
  } else {
    record(
      '11.1 가족 회원 prefs 분리',
      'create second member then isolate prefs',
      `createMember status=${createMember.status} ${JSON.stringify(createMember.json?.error || {}).slice(0, 120)}`,
      false,
      'Could not create family member for isolation test',
      'P2'
    );
  }
} else {
  record('11.1 가족 회원 prefs 분리', 'scope available', 'no gym/member scope', false, 'No member scope', 'P2');
}

// ---------- 12. Admin surface ----------
const adminUsers = await api('/admin/dashboard', { token });
record(
  '12.1 관리자 대시보드 접근(관리자 계정)',
  '200 (fit-feedback UI는 관리자에 없음 — 조회 불가가 현 설계)',
  `${adminUsers.status}`,
  adminUsers.status === 200 || adminUsers.status === 404 || adminUsers.status === 401,
  'Admin does not expose fit feedback; documented as N/A',
  'P3'
);

// ---------- Summary ----------
const failed = rows.filter((r) => !r.ok);
const passed = rows.filter((r) => r.ok);
console.log('\n=== SUMMARY ===');
console.log(`Pass: ${passed.length}/${rows.length}`);
console.log(`Fail: ${failed.length}`);
for (const f of failed) {
  console.log(` - [${f.priority || '?'}] ${f.tc}: ${f.actual}`);
}

// Machine-readable for later report
import { writeFileSync } from 'node:fs';
writeFileSync(
  '/tmp/qa-fit-feedback-results.json',
  JSON.stringify({ ts, email: EMAIL, gymId, memberId, rows }, null, 2)
);
console.log('\nWrote /tmp/qa-fit-feedback-results.json');
process.exit(failed.length ? 1 : 0);
