-- Import DRAX MachineFit PRO tips (trainer coaching style).
-- Source: database/catalog/pro-tips/drax_pro_tips.csv
-- Backup previous pro_tips / pro_tips_meta before UPDATE.

CREATE TABLE IF NOT EXISTS _backup_drax_pro_tips_20260820 (
  machine_id UUID PRIMARY KEY,
  code TEXT,
  machine_name_ko TEXT,
  pro_tips JSONB,
  pro_tips_meta JSONB,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO _backup_drax_pro_tips_20260820 (machine_id, code, machine_name_ko, pro_tips, pro_tips_meta)
SELECT m.id,
       m.code,
       COALESCE(st.name->>'ko', m.name->>'ko'),
       m.pro_tips,
       m.pro_tips_meta
FROM machines m
JOIN brands b ON b.id = m.brand_id
LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
WHERE b.code = 'DRAX'
  AND m.is_active = TRUE
ON CONFLICT (machine_id) DO NOTHING;


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Chest Press (TWMA-301) · Welliv Pro

🎯 ONE KEY CUE
🔥 "등을 시트에 붙이고 손잡이를 가슴 중앙으로 밀기"

Welliv Pro 셀렉터라이즈드 체스트 프레스(TWMA-301)로 시트·암 궤적이 고정됩니다. 셀렉터 스택 · Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트 높이를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트 높이, 시작 위치, 스택 핀, 풋 지지를 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
가슴 높이에서 손잡이를 앞·안쪽으로 밀었다 천천히 복귀.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Select 라인(Welliv Pro Chest Press (TWMA-301))은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"등을 시트에 붙이고 손잡이를 가슴 중앙으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Chest Press (TWMA-301) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Keep the back on the seat and press handles through center chest"

Welliv Pro 셀렉터라이즈드 체스트 프레스(TWMA-301)로 시트·암 궤적이 고정됩니다. Lean into the selectorized stack / Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트 높이, 시작 위치, 스택 핀, 풋 지지.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 On Select (Welliv Pro Chest Press (TWMA-301)), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the back on the seat and press handles through center chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Chest Press (TWMA-301)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro 셀렉터라이즈드 체스트 프레스(TWMA-301)로 시트·암 궤적이 고정됩니다.","verifiedAdjustments":"시트 높이, 시작 위치, 스택 핀, 풋 지지","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '체스트 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Incline Chest Press (TWMA-312) / Pure Plate Incline Chest Press (PPICP-113) · Welliv Pro

🎯 ONE KEY CUE
🔥 "견갑을 고정하고 대각선 위로 밀기"

Welliv Pro·Pure Plate 인클라인 체스트 프레스로 상부 흉근 궤적. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트 높이를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트 높이, 시작 위치, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
인클라인 각도에서 손잡이를 위·앞으로 밀었다 복귀.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Incline Chest Press (TWMA-312) / Pure Plate Incline Chest Press (PPICP-113)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"견갑을 고정하고 대각선 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Incline Chest Press (TWMA-312) / Pure Plate Incline Chest Press (PPICP-113) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Set the scapulae and press upward on a diagonal"

Welliv Pro·Pure Plate 인클라인 체스트 프레스로 상부 흉근 궤적입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트 높이, 시작 위치, 손잡이, 중량.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Incline Chest Press (TWMA-312) / Pure Plate Incline Chest Press (PPICP-113). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set the scapulae and press upward on a diagonal. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Incline Chest Press (TWMA-312) / Pure Plate Incline Chest Press (PPICP-113)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro·Pure Plate 인클라인 체스트 프레스로 상부 흉근 궤적입니다.","verifiedAdjustments":"시트 높이, 시작 위치, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '인클라인 체스트 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Decline Bench (PPDB-130) · Pure Plate

🎯 ONE KEY CUE
🔥 "하부 가슴을 향해 아래·앞으로 밀기"

Pure Plate Decline Bench(PPDB-130)로 하부 흉근용 디클라인 암 궤적. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 시작 위치를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 레그록 롤러, 손잡이 시작 위치, 양쪽 플레이트를 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
디클라인 각도에서 손잡이를 아래·앞으로 밀었다 복귀.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 팔꿈치를 과하게 벌리며 어깨에 부하를 주는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Decline Bench (PPDB-130)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"하부 가슴을 향해 아래·앞으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Decline Bench (PPDB-130) · Pure Plate

🎯 ONE KEY CUE
🔥 "Press down and forward toward the lower chest"

Pure Plate Decline Bench(PPDB-130)로 하부 흉근용 디클라인 암 궤적입니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 레그록 롤러, 손잡이 시작 위치, 양쪽 플레이트.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Decline Bench (PPDB-130). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Press down and forward toward the lower chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Decline Bench (PPDB-130)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate Decline Bench(PPDB-130)로 하부 흉근용 디클라인 암 궤적입니다.","verifiedAdjustments":"시트, 레그록 롤러, 손잡이 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '디클라인 체스트 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Chest Press (PPCP-105) / Leverage Chest Press (PPLCP-127) · Pure Plate

🎯 ONE KEY CUE
🔥 "넓은 시작에서 가슴 중앙으로 수렴하며 밀기"

별도 Converging SKU명보다 Pure Plate 체스트 프레스의 측방–내측·전방 수렴 궤적이 해당합니다. 안쪽으로 모이는 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이(Parallel를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이(Parallel/Standard), 플레이트를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
양팔이 바깥에서 안쪽으로 모이며 앞쪽으로 프레스.
손잡이가 직선으로만 가는 게 아닙니다. 기구가 만들어 주는 안쪽 궤적을 그대로 타세요. 억지로 모으지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 수렴 궤적을 무시하고 평행으로만 밀어내는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 손잡이가 가운데로 모이는 궤적이 설계입니다. 평행으로만 밀려고 버티지 말고, 기구가 안내하는 수렴 경로를 그대로 타세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"넓은 시작에서 가슴 중앙으로 수렴하며 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Chest Press (PPCP-105) / Leverage Chest Press (PPLCP-127) · Pure Plate

🎯 ONE KEY CUE
🔥 "Start wide and converge toward center chest"

별도 Converging SKU명보다 Pure Plate 체스트 프레스의 측방–내측·전방 수렴 궤적이 해당합니다. Lean into the converging path / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이(Parallel/Standard), 플레이트.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
The handles are not a straight line — ride the converging path. Do not force them together.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 The machine is built to converge. Stop forcing a parallel press — ride the path it gives you.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Start wide and converge toward center chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Chest Press (PPCP-105) / Leverage Chest Press (PPLCP-127)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/ppcp-105-chest-press","verifiedStructure":"별도 Converging SKU명보다 Pure Plate 체스트 프레스의 측방–내측·전방 수렴 궤적이 해당합니다.","verifiedAdjustments":"시트, 손잡이(Parallel/Standard), 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '컨버징 체스트 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Super Horizontal Bench Press (PPSHP-116) · Pure Plate

🎯 ONE KEY CUE
🔥 "좌우를 같은 속도로 밀며 불균형 확인"

공식 Iso-Lateral 명칭보다 Super Horizontal의 독립 암·수렴 링크가 해당 패턴. 좌우가 독립으로 움직이는 · 안쪽으로 모이는 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 시작 위치, 세이프티 스톱, 양쪽 플레이트를 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
각 팔이 독립적으로 앞으로 밀었다 천천히 복귀.
손잡이가 직선으로만 가는 게 아닙니다. 기구가 만들어 주는 안쪽 궤적을 그대로 타세요. 억지로 모으지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 한쪽 팔만 먼저 밀어 비대칭을 키우는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Super Horizontal Bench Press (PPSHP-116) · Pure Plate

🎯 ONE KEY CUE
🔥 "Press both sides at the same speed and watch for imbalances"

공식 Iso-Lateral 명칭보다 Super Horizontal의 독립 암·수렴 링크가 해당 패턴입니다. Lean into the independent arms / converging path / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 시작 위치, 세이프티 스톱, 양쪽 플레이트. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Double-check both sides start at the same height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
The handles are not a straight line — ride the converging path. Do not force them together.
Press out on the machine path, then return under control. Keep both sides honest.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Super Horizontal Bench Press (PPSHP-116)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/ppshp-116-super-horizontal-bench-press","verifiedStructure":"공식 Iso-Lateral 명칭보다 Super Horizontal의 독립 암·수렴 링크가 해당 패턴입니다.","verifiedAdjustments":"시트, 시작 위치, 세이프티 스톱, 양쪽 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '아이소래터럴 체스트 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Chest Press (PPCP-105) · Pure Plate

🎯 ONE KEY CUE
🔥 "레버리지 궤적에서 흉근으로 밀어 수렴하기"

Pure Plate 플레이트로드 체스트 프레스(PPCP-105)로 레버리지 로딩. 플레이트 로딩 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 양쪽 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 측방에서 전·내측으로 밀었다 복귀.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 팔꿈치가 뒤로 과신전되며 어깨가 뜨는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.
❌ 양쪽 플레이트 무게를 다르게 올리는 것
양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Chest Press (PPCP-105)은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"레버리지 궤적에서 흉근으로 밀어 수렴하기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Chest Press (PPCP-105) · Pure Plate

🎯 ONE KEY CUE
🔥 "Drive through the pecs and converge on the leverage path"

Pure Plate 플레이트로드 체스트 프레스(PPCP-105)로 레버리지 로딩입니다. Lean into the plate-loaded / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 양쪽 플레이트. Match plates on both sides — do not load one arm first.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.
❌ Loading unequal plates
Match both sides, then confirm with a light set.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Chest Press (PPCP-105) is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Drive through the pecs and converge on the leverage path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Chest Press (PPCP-105)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.com/ko/strength/plate-loaded-chest-press","verifiedStructure":"Pure Plate 플레이트로드 체스트 프레스(PPCP-105)로 레버리지 로딩입니다.","verifiedAdjustments":"시트, 손잡이, 양쪽 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '플레이트로드 체스트 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Pec Deck Fly (PPPDF-115) / Welliv Pro Pec Fly (TWMA-306) · Pure Plate

🎯 ONE KEY CUE
🔥 "팔꿈치를 살짝 굽힌 채 가슴 앞에서 모으기"

Pure Plate Pec Deck Fly·Welliv Pro Pec Fly로 내측 흉근 격리 궤적. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트 높이를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트 높이, 암/패드 시작 위치, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
양팔을 옆에서 가슴 앞으로 호를 그리며 모았다 벌리기.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Pec Deck Fly (PPPDF-115) / Welliv Pro Pec Fly (TWMA-306)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 살짝 굽힌 채 가슴 앞에서 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Pec Deck Fly (PPPDF-115) / Welliv Pro Pec Fly (TWMA-306) · Pure Plate

🎯 ONE KEY CUE
🔥 "Keep a soft elbow bend and bring the arms together in front of the chest"

Pure Plate Pec Deck Fly·Welliv Pro Pec Fly로 내측 흉근 격리 궤적입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트 높이, 암/패드 시작 위치, 중량.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Pec Deck Fly (PPPDF-115) / Welliv Pro Pec Fly (TWMA-306). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep a soft elbow bend and bring the arms together in front of the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Pec Deck Fly (PPPDF-115) / Welliv Pro Pec Fly (TWMA-306)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate Pec Deck Fly·Welliv Pro Pec Fly로 내측 흉근 격리 궤적입니다.","verifiedAdjustments":"시트 높이, 암/패드 시작 위치, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '펙덱';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Dual Pec Fly & Rear Delt (TWMA-310) · Welliv Dual

🎯 ONE KEY CUE
🔥 "가슴을 고정하고 팔꿈치를 뒤로 벌리며 리어 델트 수축"

Welliv Dual Pec Fly & Rear Deltoids(TWMA-310)로 펙 플라이·리어 델트 겸용. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 방향를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, ROM/시작 위치, 손잡이 방향, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
리버스 펙덱 자세에서 팔을 바깥·뒤로 벌렸다 모으기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 승모로 으쓱하며 팔을 들어 올리는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Dual Pec Fly & Rear Delt (TWMA-310)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 고정하고 팔꿈치를 뒤로 벌리며 리어 델트 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Dual Pec Fly & Rear Delt (TWMA-310) · Welliv Dual

🎯 ONE KEY CUE
🔥 "Brace the chest and open the elbows back to contract the rear delts"

Welliv Dual Pec Fly & Rear Deltoids(TWMA-310)로 펙 플라이·리어 델트 겸용입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, ROM/시작 위치, 손잡이 방향, 스택 핀.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Dual Pec Fly & Rear Delt (TWMA-310). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the chest and open the elbows back to contract the rear delts. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Dual Pec Fly & Rear Delt (TWMA-310)","manufacturer":"DRAX","productSeries":"Welliv Dual","sourceUrl":"https://draxfitness.com.au/products/drax-dual-pec-dec-fly","verifiedStructure":"Welliv Dual Pec Fly & Rear Deltoids(TWMA-310)로 펙 플라이·리어 델트 겸용입니다.","verifiedAdjustments":"시트, ROM/시작 위치, 손잡이 방향, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '리어 델트 / 리버스 펙덱';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Pec Fly (TWMA-306) / Pure Plate Pectoral Fly (PPPF-118) · Welliv Pro

🎯 ONE KEY CUE
🔥 "견갑을 붙인 채 호를 그리며 모으기"

Welliv Pro Pec Fly·Pure Plate Pectoral Fly로 흉근 플라이 궤적. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
양팔을 넓은 위치에서 가슴 앞으로 모았다 벌리기.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 팔꿈치를 과도하게 펴 어깨에 부하를 주는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Pec Fly (TWMA-306) / Pure Plate Pectoral Fly (PPPF-118)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"견갑을 붙인 채 호를 그리며 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Pec Fly (TWMA-306) / Pure Plate Pectoral Fly (PPPF-118) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Keep the scapulae set and arc the arms together"

Welliv Pro Pec Fly·Pure Plate Pectoral Fly로 흉근 플라이 궤적입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 손잡이, 중량.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Pec Fly (TWMA-306) / Pure Plate Pectoral Fly (PPPF-118). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the scapulae set and arc the arms together. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Pec Fly (TWMA-306) / Pure Plate Pectoral Fly (PPPF-118)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Pec Fly·Pure Plate Pectoral Fly로 흉근 플라이 궤적입니다.","verifiedAdjustments":"시트, 시작 위치, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '플라이 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Dip (TWMA-313) · Welliv Pro

🎯 ONE KEY CUE
🔥 "상체를 살짝 숙이고 팔꿈치로 몸통 옆을 스치며 밀기"

Welliv Pro Seated Dip(TWMA-313)로 앉아서 수행하는 딥 프레스. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트 높이를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 너비를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트 높이, 시작 위치, 손잡이 너비, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 아래로 눌렀다 팔꿈치를 굽혀 복귀.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨를 귀 쪽으로 으쓱하며 파는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Seated Dip (TWMA-313)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 살짝 숙이고 팔꿈치로 몸통 옆을 스치며 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Dip (TWMA-313) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Lean slightly forward and press with elbows brushing the torso"

Welliv Pro Seated Dip(TWMA-313)로 앉아서 수행하는 딥 프레스입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트 높이, 시작 위치, 손잡이 너비, 스택 핀.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Seated Dip (TWMA-313). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lean slightly forward and press with elbows brushing the torso. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Seated Dip (TWMA-313)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Seated Dip(TWMA-313)로 앉아서 수행하는 딥 프레스입니다.","verifiedAdjustments":"시트 높이, 시작 위치, 손잡이 너비, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '딥 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Dual Assist Chin/Dip (TWMA-308) · Welliv Dual

🎯 ONE KEY CUE
🔥 "무릎 패드 보조에 맡기고 팔꿈치로 밀어 올리기"

전용 어시스트 딥 SKU보다 Assist Chin/Dip의 딥 바·무릎 패드 지원이 해당합니다. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 딥 바 너비, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
딥 바에서 몸을 내렸다가 팔로 밀어 올리기.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 보조 무게에 기대 반동으로 튀는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Dual Assist Chin/Dip (TWMA-308)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"무릎 패드 보조에 맡기고 팔꿈치로 밀어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Dual Assist Chin/Dip (TWMA-308) · Welliv Dual

🎯 ONE KEY CUE
🔥 "Let the knee pad assist and press up through the elbows"

전용 어시스트 딥 SKU보다 Assist Chin/Dip의 딥 바·무릎 패드 지원이 해당합니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 딥 바 너비, 스택 핀.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Dual Assist Chin/Dip (TWMA-308). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Let the knee pad assist and press up through the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Welliv Dual Assist Chin/Dip (TWMA-308)","manufacturer":"DRAX","productSeries":"Welliv Dual","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro-dual-assist-chin-dip","verifiedStructure":"전용 어시스트 딥 SKU보다 Assist Chin/Dip의 딥 바·무릎 패드 지원이 해당합니다.","verifiedAdjustments":"무릎 패드, 딥 바 너비, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '어시스트 딥';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 슈퍼 인클라인 프레스

🎯 ONE KEY CUE
🔥 "높은 인클라인에서 견갑을 고정하고 위·앞으로 밀기"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 등판 각도, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
높은 인클라인 궤적으로 밀었다 복귀.
손보다 팔꿈치를 앞(또는 위)으로 보내는 느낌으로 미세요. 끝에서 어깨를 앞으로 밀어 넣지 마세요.

---

💥 ④ 최고 수축
팔꿈치가 앞으로 나가 가슴이 수축되는 지점에서 멈춥니다. 어깨를 더 밀지 마세요.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 각도가 너무 높아 숄더 프레스로 바뀌는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "슈퍼 인클라인 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"높은 인클라인에서 견갑을 고정하고 위·앞으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Super Incline Press

🎯 ONE KEY CUE
🔥 "On a steep incline, set the scapulae and press up and forward"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 등판 각도, 손잡이, 중량.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Press by driving the elbows forward/up. Do not dump the shoulders forward at lockout.
Press out on the machine path, then return under control.

---

💥 ④ Peak contraction
Stop where the chest is contracted — do not dump the shoulders farther forward.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Dumping the shoulders forward and bouncing the press
Slow the tempo and repeat one clean path.
❌ Over-arching so the low back takes over
If position breaks, cut the load.
❌ Shoving the shoulders farther at lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Super Incline Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On a steep incline, set the scapulae and press up and forward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"DRAX 공개 카탈로그에서 Super Incline Press 전용 SKU를 확인하지 못했습니다.","verifiedAdjustments":"시트, 등판 각도, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '슈퍼 인클라인 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Lat Pulldown (TWMA-305) · Welliv Pro

🎯 ONE KEY CUE
🔥 "가슴을 들어 바에 끌어내리며 광배로 당기기"

Welliv Pro Lat Pull Down(TWMA-305)으로 허벅지 패드 고정형 풀다운. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
바 그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
허벅지 패드, 시트, 바 그립, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 쇄골 앞까지 내렸다가 천천히 올리기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 반동으로 몸을 흔들며 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Lat Pulldown (TWMA-305)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 들어 바에 끌어내리며 광배로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Lat Pulldown (TWMA-305) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Lift the chest and pull the bar down with the lats"

Welliv Pro Lat Pull Down(TWMA-305)으로 허벅지 패드 고정형 풀다운입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 허벅지 패드, 시트, 바 그립, 스택 핀.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Lat Pulldown (TWMA-305). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lift the chest and pull the bar down with the lats. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Lat Pulldown (TWMA-305)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://draxfitness.com.au/products/drax-welliv-pro-lat-pull-down","verifiedStructure":"Welliv Pro Lat Pull Down(TWMA-305)으로 허벅지 패드 고정형 풀다운입니다.","verifiedAdjustments":"허벅지 패드, 시트, 바 그립, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '랫풀다운';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Lat Pulldown (TWMA-305) · Welliv Pro

🎯 ONE KEY CUE
🔥 "손을 넓게 잡고 팔꿈치를 아래로 꺾어 당기기"

와이드 전용 SKU는 없고 Lat Pulldown의 와이드 그립 사용이 해당 패턴. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
와이드 그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
허벅지 패드, 와이드 그립, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
와이드 그립으로 바를 가슴 위까지 내렸다 복귀.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 목을 앞으로 숙이며 바를 뒤통수로 내리는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Lat Pulldown (TWMA-305)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"손을 넓게 잡고 팔꿈치를 아래로 꺾어 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Lat Pulldown (TWMA-305) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Take a wide grip and drive the elbows down"

와이드 전용 SKU는 없고 Lat Pulldown의 와이드 그립 사용이 해당 패턴입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 허벅지 패드, 와이드 그립, 스택 핀.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Lat Pulldown (TWMA-305). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Take a wide grip and drive the elbows down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Welliv Pro Lat Pulldown (TWMA-305)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"와이드 전용 SKU는 없고 Lat Pulldown의 와이드 그립 사용이 해당 패턴입니다.","verifiedAdjustments":"허벅지 패드, 와이드 그립, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '와이드 랫풀다운';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Rotary Pulldown (PPRP-101) · Pure Plate

🎯 ONE KEY CUE
🔥 "가슴 앞으로 바를 내리며 광배 수축"

프론트 전용명보다 Rotary Pulldown·Lat Pulldown의 전면 풀다운 궤적이 해당합니다. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 무릎 패드, 손잡이, 플레이트를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
머리 앞에서 손잡이를 가슴 앞으로 당겼다 올리기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 상체를 과하게 젖히며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Rotary Pulldown (PPRP-101)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴 앞으로 바를 내리며 광배 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Rotary Pulldown (PPRP-101) · Pure Plate

🎯 ONE KEY CUE
🔥 "Pull the bar to the front of the chest and squeeze the lats"

프론트 전용명보다 Rotary Pulldown·Lat Pulldown의 전면 풀다운 궤적이 해당합니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 무릎 패드, 손잡이, 플레이트.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Rotary Pulldown (PPRP-101). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pull the bar to the front of the chest and squeeze the lats. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Rotary Pulldown (PPRP-101)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"프론트 전용명보다 Rotary Pulldown·Lat Pulldown의 전면 풀다운 궤적이 해당합니다.","verifiedAdjustments":"시트, 무릎 패드, 손잡이, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '프론트 풀다운';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Rotary Pulldown (PPRP-101) / Infinity Omni Unilateral Cable Pulldown · Pure Plate

🎯 ONE KEY CUE
🔥 "좌우를 번갈아 같은 궤적으로 당기기"

공식 Iso-Lateral Lat SKU보다 Rotary·Omni Unilateral Pulldown의 편측 암이 해당합니다. 좌우가 독립으로 움직이는 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 무릎 패드, 좌·우 손잡이, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔이 독립적으로 위에서 아래로 당겼다 복귀.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 강한 쪽만 먼저 당겨 비대칭을 키우는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Rotary Pulldown (PPRP-101) / Infinity Omni Unilateral Cable Pulldown · Pure Plate

🎯 ONE KEY CUE
🔥 "Pull each side through the same path alternately"

공식 Iso-Lateral Lat SKU보다 Rotary·Omni Unilateral Pulldown의 편측 암이 해당합니다. Lean into the independent arms / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 무릎 패드, 좌·우 손잡이, 중량. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Double-check both sides start at the same height.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly. Keep both sides honest.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Rotary Pulldown (PPRP-101) / Infinity Omni Unilateral Cable Pulldown","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"공식 Iso-Lateral Lat SKU보다 Rotary·Omni Unilateral Pulldown의 편측 암이 해당합니다.","verifiedAdjustments":"시트, 무릎 패드, 좌·우 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '아이소래터럴 랫풀다운';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate High Row (PPLR-102) · Pure Plate

🎯 ONE KEY CUE
🔥 "가슴을 들고 팔꿈치를 옆구리 쪽으로 끌어당기기"

Pure Plate High Row(PPLR-102)로 고위치 로우 궤적. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
회전 그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트 높이, 무릎 패드, 회전 그립, 플레이트를 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
고위치에서 손잡이를 몸통 쪽으로 당겼다 천천히 뻗기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 어깨만 으쓱하며 손잡이를 당기는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate High Row (PPLR-102)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 들고 팔꿈치를 옆구리 쪽으로 끌어당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate High Row (PPLR-102) · Pure Plate

🎯 ONE KEY CUE
🔥 "Lift the chest and draw the elbows toward the ribs"

Pure Plate High Row(PPLR-102)로 고위치 로우 궤적입니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트 높이, 무릎 패드, 회전 그립, 플레이트.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate High Row (PPLR-102). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lift the chest and draw the elbows toward the ribs. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate High Row (PPLR-102)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.com/en/strength/plate-loaded-high-row","verifiedStructure":"Pure Plate High Row(PPLR-102)로 고위치 로우 궤적입니다.","verifiedAdjustments":"시트 높이, 무릎 패드, 회전 그립, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '하이로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate High Row (PPLR-102) · Pure Plate

🎯 ONE KEY CUE
🔥 "한쪽씩 같은 높이로 당겨 균형 확인"

별도 Iso High Row SKU는 없고 High Row의 편측 운용이 해당 패턴. 좌우가 독립으로 움직이는 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 무릎 패드, 좌·우 손잡이, 플레이트를 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔이 독립적으로 고위치에서 몸통으로 당기기.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 몸통을 회전하며 당기는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate High Row (PPLR-102) · Pure Plate

🎯 ONE KEY CUE
🔥 "Pull each side to the same height and check balance"

별도 Iso High Row SKU는 없고 High Row의 편측 운용이 해당 패턴입니다. Lean into the independent arms / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 무릎 패드, 좌·우 손잡이, 플레이트. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Double-check both sides start at the same height.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly. Keep both sides honest.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate High Row (PPLR-102)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.com/en/strength/plate-loaded-high-row","verifiedStructure":"별도 Iso High Row SKU는 없고 High Row의 편측 운용이 해당 패턴입니다.","verifiedAdjustments":"시트, 무릎 패드, 좌·우 손잡이, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '아이소래터럴 하이로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Row (TWMA-311) · Welliv Pro

🎯 ONE KEY CUE
🔥 "가슴을 고정하고 견갑을 모으며 당기기"

Welliv Pro Seated Row(TWMA-311)로 다양한 손잡이 위치의 시티드 로우. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이 위치를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴/등 지지, 손잡이 위치, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 몸통으로 당겼다 팔을 펴며 복귀.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 허리를 둥글게 말고 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Seated Row (TWMA-311)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 고정하고 견갑을 모으며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Row (TWMA-311) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Brace the chest and retract the scapulae as you pull"

Welliv Pro Seated Row(TWMA-311)로 다양한 손잡이 위치의 시티드 로우입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴/등 지지, 손잡이 위치, 스택 핀.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Seated Row (TWMA-311). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the chest and retract the scapulae as you pull. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Seated Row (TWMA-311)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Seated Row(TWMA-311)로 다양한 손잡이 위치의 시티드 로우입니다.","verifiedAdjustments":"시트, 가슴/등 지지, 손잡이 위치, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '시티드 로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Row (TWMA-311) / Low Row (TWMA-303) · Welliv Pro

🎯 ONE KEY CUE
🔥 "팔꿈치로 당기며 등 중앙을 수축"

로우 머신 총칭으로 Seated Row·Low Row 라인업이 대응합니다. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
앉은 자세에서 손잡이를 몸통으로 당겼다 뻗기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 손목만으로 잡아채는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Seated Row (TWMA-311) / Low Row (TWMA-303)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치로 당기며 등 중앙을 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Row (TWMA-311) / Low Row (TWMA-303) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Pull with the elbows and squeeze mid-back"

로우 머신 총칭으로 Seated Row·Low Row 라인업이 대응합니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 중량.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Seated Row (TWMA-311) / Low Row (TWMA-303). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pull with the elbows and squeeze mid-back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Welliv Pro Seated Row (TWMA-311) / Low Row (TWMA-303)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"로우 머신 총칭으로 Seated Row·Low Row 라인업이 대응합니다.","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '로우 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Low Row (PPLR-104) / Welliv Pro Low Row (TWMA-303) · Pure Plate

🎯 ONE KEY CUE
🔥 "가슴 패드를 밀착하고 팔꿈치를 뒤로 당기기"

Pure Plate Low Row·Welliv Pro Low Row로 저위치 로우. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
저위치 손잡이를 복부 쪽으로 당겼다 뻗기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 상체를 과도하게 뒤로 젖히는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Low Row (PPLR-104) / Welliv Pro Low Row (TWMA-303)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴 패드를 밀착하고 팔꿈치를 뒤로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Low Row (PPLR-104) / Welliv Pro Low Row (TWMA-303) · Pure Plate

🎯 ONE KEY CUE
🔥 "Stay tight to the chest pad and drive the elbows back"

Pure Plate Low Row·Welliv Pro Low Row로 저위치 로우입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 손잡이, 중량.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Low Row (PPLR-104) / Welliv Pro Low Row (TWMA-303). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Stay tight to the chest pad and drive the elbows back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Low Row (PPLR-104) / Welliv Pro Low Row (TWMA-303)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate Low Row·Welliv Pro Low Row로 저위치 로우입니다.","verifiedAdjustments":"시트, 가슴 패드, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '로우 로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Alpha Beta Unilateral Seated Mid Row (SAB-1-R) · Alpha Beta

🎯 ONE KEY CUE
🔥 "팔꿈치를 몸통 옆 높이로 당겨 중부 등 자극"

Alpha Beta Unilateral Seated Mid Row(SAB-1-R)로 중위치 로우. Alpha racks 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
중위치에서 손잡이를 몸통으로 당겼다 복귀.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 손잡이를 너무 아래로 끌어 광배만 쓰는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Alpha Beta Unilateral Seated Mid Row (SAB-1-R)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 몸통 옆 높이로 당겨 중부 등 자극. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Alpha Beta Unilateral Seated Mid Row (SAB-1-R) · Alpha Beta

🎯 ONE KEY CUE
🔥 "Pull the elbows to mid-torso height to hit mid-back"

Alpha Beta Unilateral Seated Mid Row(SAB-1-R)로 중위치 로우입니다. Lean into the Alpha racks design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 스택 핀.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Alpha Beta Unilateral Seated Mid Row (SAB-1-R). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pull the elbows to mid-torso height to hit mid-back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Alpha Beta Unilateral Seated Mid Row (SAB-1-R)","manufacturer":"DRAX","productSeries":"Alpha Beta","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Alpha Beta Unilateral Seated Mid Row(SAB-1-R)로 중위치 로우입니다.","verifiedAdjustments":"시트, 손잡이, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '미드 로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Extreme Row (PPER-125) / Front Row (PPFR-103) · Pure Plate

🎯 ONE KEY CUE
🔥 "좌우 독립 암을 같은 속도로 당기기"

공식 Iso Row 명칭보다 Extreme·Front Row의 독립 암이 해당 패턴. 좌우가 독립으로 움직이는 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작 위치, 양쪽 플레이트를 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔이 독립적으로 몸통으로 당겼다 뻗기.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 강한 쪽으로만 체중을 싣는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Extreme Row (PPER-125) / Front Row (PPFR-103) · Pure Plate

🎯 ONE KEY CUE
🔥 "Pull both independent arms at the same speed"

공식 Iso Row 명칭보다 Extreme·Front Row의 독립 암이 해당 패턴입니다. Lean into the independent arms / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작 위치, 양쪽 플레이트. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Double-check both sides start at the same height.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly. Keep both sides honest.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Extreme Row (PPER-125) / Front Row (PPFR-103)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"공식 Iso Row 명칭보다 Extreme·Front Row의 독립 암이 해당 패턴입니다.","verifiedAdjustments":"시트, 좌·우 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '아이소래터럴 로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Low Row (PPLR-104) · Pure Plate

🎯 ONE KEY CUE
🔥 "한쪽씩 저위치에서 동일 궤적으로 당기기"

Iso Low Row 전용명보다 Low Row의 편측 운용이 해당합니다. 좌우가 독립으로 움직이는 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 가슴 패드, 좌·우 손잡이, 플레이트를 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔이 저위치에서 복부 쪽으로 당겼다 복귀.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 몸통을 옆으로 틀며 당기는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Low Row (PPLR-104) · Pure Plate

🎯 ONE KEY CUE
🔥 "Pull each side from the low path through the same arc"

Iso Low Row 전용명보다 Low Row의 편측 운용이 해당합니다. Lean into the independent arms / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 가슴 패드, 좌·우 손잡이, 플레이트. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Double-check both sides start at the same height.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly. Keep both sides honest.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Low Row (PPLR-104)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.com/en/strength/plate-loaded/products","verifiedStructure":"Iso Low Row 전용명보다 Low Row의 편측 운용이 해당합니다.","verifiedAdjustments":"시트, 가슴 패드, 좌·우 손잡이, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '아이소래터럴 로우 로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Front Row (PPFR-103) / Infinity Supported Row (SI-1-SR) · Pure Plate

🎯 ONE KEY CUE
🔥 "가슴을 패드에 붙이고 견갑만 모아 당기기"

Pure Plate Front Row·Infinity Supported Row로 가슴 지지형 로우. 가슴 지지 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
가슴 지지 상태에서 손잡이를 몸통으로 당겼다 뻗기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 패드를 밀어내며 상체를 드는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 가슴 패드가 있는 이유가 반동을 끊기 위해서입니다. 패드를 밀고 일어서지 말고, 가슴을 붙인 채 팔꿈치만 움직이세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 가슴 → 패드에 고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴은 패드에, 팔꿈치는 뒤로, 끝에서 1초."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Front Row (PPFR-103) / Infinity Supported Row (SI-1-SR) · Pure Plate

🎯 ONE KEY CUE
🔥 "Keep the chest on the pad and pull by retracting the scapulae"

Pure Plate Front Row·Infinity Supported Row로 가슴 지지형 로우입니다. Lean into the chest-supported / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 손잡이, 중량.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 The chest pad exists to kill momentum. Stay glued to it and move only through the elbows.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Chest → glued to pad
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Chest on the pad, elbows back, one-second squeeze."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Front Row (PPFR-103) / Infinity Supported Row (SI-1-SR)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate Front Row·Infinity Supported Row로 가슴 지지형 로우입니다.","verifiedAdjustments":"시트, 가슴 패드, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '체스트 서포티드 로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate T-Bar Row (PPTBR-114) · Pure Plate

🎯 ONE KEY CUE
🔥 "가슴을 붙이고 팔꿈치로 바를 몸통으로 당기기"

Pure Plate T-Bar Row(PPTBR-114)로 가슴 패드·2단 풋 지지형 T바 로우. 가슴 지지 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
멀티 그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
가슴 패드, 풋 지지(2단), 멀티 그립, 플레이트를 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
T바를 복부 쪽으로 당겼다 천천히 내리기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 허리를 과신전하며 바를 들어 올리는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 가슴 패드가 있는 이유가 반동을 끊기 위해서입니다. 패드를 밀고 일어서지 말고, 가슴을 붙인 채 팔꿈치만 움직이세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 가슴 → 패드에 고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴은 패드에, 팔꿈치는 뒤로, 끝에서 1초."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate T-Bar Row (PPTBR-114) · Pure Plate

🎯 ONE KEY CUE
🔥 "Keep the chest braced and pull the bar to the torso with the elbows"

Pure Plate T-Bar Row(PPTBR-114)로 가슴 패드·2단 풋 지지형 T바 로우입니다. Lean into the chest-supported / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 가슴 패드, 풋 지지(2단), 멀티 그립, 플레이트.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 The chest pad exists to kill momentum. Stay glued to it and move only through the elbows.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Chest → glued to pad
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Chest on the pad, elbows back, one-second squeeze."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate T-Bar Row (PPTBR-114)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate T-Bar Row(PPTBR-114)로 가슴 패드·2단 풋 지지형 T바 로우입니다.","verifiedAdjustments":"가슴 패드, 풋 지지(2단), 멀티 그립, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = 'T바 로우 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 풀오버

🎯 ONE KEY CUE
🔥 "갈비뼈를 내린 채 광배로 호를 그리며 당기기"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이/패드, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
머리 위에서 손잡이를 엉덩이 쪽으로 호를 그리며 당기기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 허리를 과하게 젖히며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "풀오버"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"갈비뼈를 내린 채 광배로 호를 그리며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pullover

🎯 ONE KEY CUE
🔥 "Keep the ribs down and arc the load with the lats"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이/패드, 중량.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Pullover", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the ribs down and arc the load with the lats. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"DRAX 공개 카탈로그에서 풀오버 전용 머신을 확인하지 못했습니다.","verifiedAdjustments":"시트, 손잡이/패드, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '풀오버';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Assist Chin/Dip / Dual Assist Chin Dip (TWMA-308) · Welliv Dual

🎯 ONE KEY CUE
🔥 "가슴을 들어 바에 턱을 끌어올리기"

Welliv Assist Chin/Dip·Dual Assist Chin Dip로 무릎 패드 보조 친업. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
멀티 그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 멀티 그립, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
보조 패드에 무릎을 얹고 몸을 올려 당겼다 내리기.
손잡이를 당긴다고 생각하지 말고, 팔꿈치를 목표 지점으로 보내세요.

---

💥 ④ 최고 수축
팔꿈치가 목표에 도착해 등이 조여지는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
팔이 펴질 때까지 등을 놓지 말고, 어깨가 앞으로 말리지 않게 버팁니다.

---

❌ 흔한 실수
❌ 반동으로 무릎을 차며 올라가는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Assist Chin/Dip / Dual Assist Chin Dip (TWMA-308)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 들어 바에 턱을 끌어올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Assist Chin/Dip / Dual Assist Chin Dip (TWMA-308) · Welliv Dual

🎯 ONE KEY CUE
🔥 "Lift the chest and pull the chin toward the bar"

Welliv Assist Chin/Dip·Dual Assist Chin Dip로 무릎 패드 보조 친업입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 멀티 그립, 스택 핀.

---

💪 ② Start position
Lift the chest and keep the shoulders away from the ears. Prepare the back before the arms.
Check only this:
👉 Shoulders not shrugged

---

🔥 ③ Execution
Do not think “pull the handle.” Drive the elbows to the target.
Drive the elbows back/down on the row or pulldown path, then lengthen slowly.

---

💥 ④ Peak contraction
Stop where the elbows arrive and the back is squeezed.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Keep the back set as the arms lengthen — do not let the shoulders dump forward.

---

❌ Common mistakes
❌ Leaning back for momentum
Slow the tempo and repeat one clean path.
❌ Shrugging and turning it into an upper-trap pull
Keep the shoulders away from the ears and restart.
❌ Yank the handles without moving the elbows
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Assist Chin/Dip / Dual Assist Chin Dip (TWMA-308). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lift the chest and pull the chin toward the bar. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Assist Chin/Dip / Dual Assist Chin Dip (TWMA-308)","manufacturer":"DRAX","productSeries":"Welliv Dual","sourceUrl":"https://www.draxfit.com/strength/assist-chin-dip","verifiedStructure":"Welliv Assist Chin/Dip·Dual Assist Chin Dip로 무릎 패드 보조 친업입니다.","verifiedAdjustments":"무릎 패드, 멀티 그립, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '어시스트 풀업 / 친업';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Shoulder Press (TWMA-302) · Welliv Pro

🎯 ONE KEY CUE
🔥 "귀를 덮지 않게 손잡이를 머리 위로 밀기"

Welliv Pro Shoulder Press(TWMA-302)로 카운터밸런스 숄더 프레스. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트 높이를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이(중립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트 높이, 등판, 손잡이(중립/스탠다드), 스택 핀을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
어깨 높이에서 손잡이를 위로 밀었다 천천히 내리기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 허리를 과아치하며 밀어 올리는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Shoulder Press (TWMA-302)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"귀를 덮지 않게 손잡이를 머리 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Shoulder Press (TWMA-302) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Press the handles overhead without covering the ears"

Welliv Pro Shoulder Press(TWMA-302)로 카운터밸런스 숄더 프레스입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트 높이, 등판, 손잡이(중립/스탠다드), 스택 핀.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Shoulder Press (TWMA-302). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Press the handles overhead without covering the ears. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Shoulder Press (TWMA-302)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://draxfitness.com.au/products/drax-welliv-pro-shoulder-press","verifiedStructure":"Welliv Pro Shoulder Press(TWMA-302)로 카운터밸런스 숄더 프레스입니다.","verifiedAdjustments":"시트 높이, 등판, 손잡이(중립/스탠다드), 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '숄더 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Dual Power Smith Shoulder (PPDPS-119) / Alpha Beta Unilateral Shoulder Press (SAB-1-SP) · Pure Plate

🎯 ONE KEY CUE
🔥 "좌우를 같은 높이로 밀어 균형 확인"

공식 Iso Shoulder SKU보다 Dual Power Smith Shoulder·Alpha Beta Unilateral SP가 해당합니다. 좌우가 독립으로 움직이는 · Alpha racks 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 암, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
각 팔이 독립적으로 위로 밀었다 복귀.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 한쪽만 먼저 밀어 기울어지는
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Dual Power Smith Shoulder (PPDPS-119) / Alpha Beta Unilateral Shoulder Press (SAB-1-SP) · Pure Plate

🎯 ONE KEY CUE
🔥 "Press both sides to the same height and check balance"

공식 Iso Shoulder SKU보다 Dual Power Smith Shoulder·Alpha Beta Unilateral SP가 해당합니다. Lean into the independent arms / Alpha racks design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 암, 중량. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Double-check both sides start at the same height.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
Press or raise on the guided path, then lower without dumping the shoulders. Keep both sides honest.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Dual Power Smith Shoulder (PPDPS-119) / Alpha Beta Unilateral Shoulder Press (SAB-1-SP)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"공식 Iso Shoulder SKU보다 Dual Power Smith Shoulder·Alpha Beta Unilateral SP가 해당합니다.","verifiedAdjustments":"시트, 좌·우 암, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '아이소래터럴 숄더 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Shoulder Press (PPSP-106) · Pure Plate

🎯 ONE KEY CUE
🔥 "등판에 붙어 측방–내측·상방 궤적으로 밀기"

Pure Plate Shoulder Press(PPSP-106)로 플레이트로드 숄더 프레스. 플레이트 로딩 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 등판, 손잡이, 양쪽 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
손잡이를 머리 위로 밀었다 천천히 내리기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 팔꿈치를 너무 뒤로 빼 어깨를 앞쪽으로 내미는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 양쪽 플레이트 무게를 다르게 올리는 것
양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Shoulder Press (PPSP-106)은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"등판에 붙어 측방–내측·상방 궤적으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Shoulder Press (PPSP-106) · Pure Plate

🎯 ONE KEY CUE
🔥 "Stay on the back pad and press on the lateral–medial upward path"

Pure Plate Shoulder Press(PPSP-106)로 플레이트로드 숄더 프레스입니다. Lean into the plate-loaded / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 등판, 손잡이, 양쪽 플레이트. Match plates on both sides — do not load one arm first.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.
❌ Loading unequal plates
Match both sides, then confirm with a light set.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Shoulder Press (PPSP-106) is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Stay on the back pad and press on the lateral–medial upward path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Shoulder Press (PPSP-106)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.com/en/strength/plate-loaded-shoulder-press","verifiedStructure":"Pure Plate Shoulder Press(PPSP-106)로 플레이트로드 숄더 프레스입니다.","verifiedAdjustments":"시트, 등판, 손잡이, 양쪽 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '플레이트로드 숄더 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Lateral Raise (PPLR-110) · Pure Plate

🎯 ONE KEY CUE
🔥 "팔꿈치를 살짝 굽힌 채 측면으로만 들어 올리기"

Pure Plate Lateral Raise(PPLR-110)로 측면 삼각근 레이즈. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 롤러/패드, 시작 위치, 플레이트를 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔을 옆구리에서 어깨 높이까지 올렸다 내리기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 승모로 으쓱하며 무게를 들어 올리는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Lateral Raise (PPLR-110)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 살짝 굽힌 채 측면으로만 들어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Lateral Raise (PPLR-110) · Pure Plate

🎯 ONE KEY CUE
🔥 "Keep a soft elbow bend and raise only out to the sides"

Pure Plate Lateral Raise(PPLR-110)로 측면 삼각근 레이즈입니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 롤러/패드, 시작 위치, 플레이트.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Lateral Raise (PPLR-110). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep a soft elbow bend and raise only out to the sides. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Lateral Raise (PPLR-110)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate Lateral Raise(PPLR-110)로 측면 삼각근 레이즈입니다.","verifiedAdjustments":"시트, 롤러/패드, 시작 위치, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '레터럴 레이즈';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Lateral Raise (PPLR-110) / Alpha Beta Lateral Raise (SAB-1-LR) · Pure Plate

🎯 ONE KEY CUE
🔥 "어깨 높이까지만 올리고 승모 개입 줄이기"

Pure Plate·Alpha Beta Lateral Raise로 머신형 사이드 레이즈. Alpha racks 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 패드, 스택/플레이트를 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
측면으로 팔을 올렸다 천천히 내리기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 팔꿈치를 펴고 던지듯 올리는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Lateral Raise (PPLR-110) / Alpha Beta Lateral Raise (SAB-1-LR)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"어깨 높이까지만 올리고 승모 개입 줄이기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Lateral Raise (PPLR-110) / Alpha Beta Lateral Raise (SAB-1-LR) · Pure Plate

🎯 ONE KEY CUE
🔥 "Raise only to shoulder height and limit trap shrug"

Pure Plate·Alpha Beta Lateral Raise로 머신형 사이드 레이즈입니다. Lean into the Alpha racks design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 패드, 스택/플레이트.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Lateral Raise (PPLR-110) / Alpha Beta Lateral Raise (SAB-1-LR). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Raise only to shoulder height and limit trap shrug. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Lateral Raise (PPLR-110) / Alpha Beta Lateral Raise (SAB-1-LR)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Pure Plate·Alpha Beta Lateral Raise로 머신형 사이드 레이즈입니다.","verifiedAdjustments":"시트, 패드, 스택/플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '머신 레터럴 레이즈';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Bent Over Lateral Raise (PPBLR-126) / Welliv Dual Pec Fly & Rear Delt · Pure Plate

🎯 ONE KEY CUE
🔥 "상체를 고정하고 팔꿈치를 바깥·뒤로 벌리기"

Pure Plate Bent Over Lateral Raise·Dual Rear Delt로 후면 삼각근 자극. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트/패드, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
리어 델트 궤적으로 팔을 벌렸다 모으기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 허리 반동으로 무게를 들어 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Bent Over Lateral Raise (PPBLR-126) / Welliv Dual Pec Fly & Rear Delt의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 고정하고 팔꿈치를 바깥·뒤로 벌리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Bent Over Lateral Raise (PPBLR-126) / Welliv Dual Pec Fly & Rear Delt · Pure Plate

🎯 ONE KEY CUE
🔥 "Brace the torso and open the elbows out and back"

Pure Plate Bent Over Lateral Raise·Dual Rear Delt로 후면 삼각근 자극입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트/패드, 손잡이, 중량.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Bent Over Lateral Raise (PPBLR-126) / Welliv Dual Pec Fly & Rear Delt. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the torso and open the elbows out and back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Bent Over Lateral Raise (PPBLR-126) / Welliv Dual Pec Fly & Rear Delt","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate Bent Over Lateral Raise·Dual Rear Delt로 후면 삼각근 자극입니다.","verifiedAdjustments":"시트/패드, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '리어 델트';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 프론트 레이즈

🎯 ONE KEY CUE
🔥 "팔꿈치를 살짝 굽힌 채 전면으로만 들어 올리기"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
허벅지 앞에서 어깨 높이까지 올렸다 내리기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 반동으로 바벨을 던지듯 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "프론트 레이즈"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 살짝 굽힌 채 전면으로만 들어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Front Raise

🎯 ONE KEY CUE
🔥 "Keep a soft elbow bend and raise only to the front"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 중량.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Front Raise", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep a soft elbow bend and raise only to the front. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"DRAX 공개 카탈로그에서 프론트 레이즈 전용 머신을 확인하지 못했습니다.","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '프론트 레이즈';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 업라이트 로우

🎯 ONE KEY CUE
🔥 "팔꿈치를 옆으로 들어 손잡이를 쇄골 높이로 당기기"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이 높이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
손잡이 높이, 스탠스, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
손잡이를 몸 가까이 수직으로 올렸다 내리기.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 손목만 위로 꺾으며 어깨를 으쓱하는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "업라이트 로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 옆으로 들어 손잡이를 쇄골 높이로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Upright Row

🎯 ONE KEY CUE
🔥 "Lead with the elbows and pull the handles to collarbone height"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 손잡이 높이, 스탠스, 중량.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Upright Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lead with the elbows and pull the handles to collarbone height. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"DRAX 공개 카탈로그에서 업라이트 로우 전용 머신을 확인하지 못했습니다.","verifiedAdjustments":"손잡이 높이, 스탠스, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '업라이트 로우';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 로테이터 머신

🎯 ONE KEY CUE
🔥 "팔꿈치를 옆에 고정한 채 천천히 외·내회전"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
팔꿈치 패드, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
전완을 호를 그리며 회전했다 복귀.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 무게를 키워 반동으로 돌리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "로테이터 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 옆에 고정한 채 천천히 외·내회전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Rotator Machine

🎯 ONE KEY CUE
🔥 "Keep the elbow pinned at the side and rotate slowly"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 팔꿈치 패드, 가동 범위, 중량.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Rotator Machine", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the elbow pinned at the side and rotate slowly. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"DRAX 공개 카탈로그에서 로테이터 커프 전용 머신을 확인하지 못했습니다.","verifiedAdjustments":"팔꿈치 패드, 가동 범위, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '로테이터 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 숄더 프레스 / 레터럴 복합 머신

🎯 ONE KEY CUE
🔥 "선택한 패턴에서 견갑을 고정하고 목표 근육으로 움직이기"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 각도, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
설정 각도에서 프레스 또는 레이즈 궤적으로 반복.
반동으로 올리지 마세요. 팔꿈치가 궤적을 주도하게 둡니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 모드를 자주 바꿔 자세가 흔들리는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "숄더 프레스 / 레터럴 복합 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"선택한 패턴에서 견갑을 고정하고 목표 근육으로 움직이기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Shoulder Press / Lateral Combo

🎯 ONE KEY CUE
🔥 "At the chosen pattern, set the scapulae and move for the target muscle"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 각도, 손잡이, 중량.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
No bounce. Let the elbows own the path.
Press or raise on the guided path, then lower without dumping the shoulders.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pressing with an over-arched low back
If position breaks, cut the load.
❌ Shrugging the shoulders into the ears
Keep the shoulders away from the ears and restart.
❌ Bouncing the weight up
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Shoulder Press / Lateral Combo", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"At the chosen pattern, set the scapulae and move for the target muscle. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Multi Press는 체스트 각도 복합이며 숄더·레터럴 복합 전용 SKU는 확인되지 않았습니다.","verifiedAdjustments":"시트, 암 각도, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '숄더 프레스 / 레터럴 복합 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Leg Press (TWMA-101) / Pure Plate Power Leg Press (PPLP-108) · Welliv Pro

🎯 ONE KEY CUE
🔥 "발바닥 전체로 밀며 무릎을 안쪽으로 모으지 않기"

Welliv Pro Seated Leg Press·Pure Plate Power Leg Press로 레그 프레스. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 등판, 발판 위치, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발판을 밀어 다리를 펴었다가 천천히 접기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 엉덩이가 들리고 허리가 둥글어지는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Seated Leg Press (TWMA-101) / Pure Plate Power Leg Press (PPLP-108)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Leg Press (TWMA-101) / Pure Plate Power Leg Press (PPLP-108) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Drive through the whole foot and keep knees from caving in"

Welliv Pro Seated Leg Press·Pure Plate Power Leg Press로 레그 프레스입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 등판, 발판 위치, 중량.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Seated Leg Press (TWMA-101) / Pure Plate Power Leg Press (PPLP-108). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Seated Leg Press (TWMA-101) / Pure Plate Power Leg Press (PPLP-108)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Seated Leg Press·Pure Plate Power Leg Press로 레그 프레스입니다.","verifiedAdjustments":"시트, 등판, 발판 위치, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '레그 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Power Leg Press (PPLP-108) · Pure Plate

🎯 ONE KEY CUE
🔥 "경사 궤적에서 발판 중앙에 힘을 모아 밀기"

45도 전용명 SKU보다 Power Leg Press의 경사 레그 프레스 패턴이 가깝습니다. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
등판, 발판, 세이프티, 플레이트를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발판을 대각선으로 밀어 올렸다 내리기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Power Leg Press (PPLP-108)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Power Leg Press (PPLP-108) · Pure Plate

🎯 ONE KEY CUE
🔥 "On the angled path, drive through mid-foot on the platform"

45도 전용명 SKU보다 Power Leg Press의 경사 레그 프레스 패턴이 가깝습니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 등판, 발판, 세이프티, 플레이트.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Power Leg Press (PPLP-108). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Power Leg Press (PPLP-108)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"45도 전용명 SKU보다 Power Leg Press의 경사 레그 프레스 패턴이 가깝습니다.","verifiedAdjustments":"등판, 발판, 세이프티, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '45도 레그 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Leg Press (TWMA-101) · Welliv Pro

🎯 ONE KEY CUE
🔥 "허리를 등판에 붙이고 수평으로 밀기"

Welliv Pro Seated Leg Press로 좌식·수평에 가까운 레그 프레스. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트 슬라이드부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
수평 궤적에 맞춰 발판 중앙에 발을 안정적으로 두세요. 무릎·발끝 방향을 맞춥니다.
⚙️ 조절 포인트
시트 슬라이드, 등판, 발판, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발판을 앞으로 밀었다가 천천히 되돌리기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 발판을 너무 높이 두어 엉덩이가 뜨는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 수평(리니어) 궤적은 45° 레그 프레스와 골반 느낌이 다릅니다. 시트에 골반을 붙인 채 수평으로 민다는 감각을 먼저 만드세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반은 시트에, 발 전체로 수평으로 밀고, 복귀는 2~3초."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Leg Press (TWMA-101) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Keep the low back on the pad and press horizontally"

Welliv Pro Seated Leg Press로 좌식·수평에 가까운 레그 프레스입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet on the horizontal path and keep knees tracking with toes.
⚙️ Adjustments
Check 시트 슬라이드, 등판, 발판, 스택 핀.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Linear/horizontal paths feel different from a 45° sled. Keep the pelvis glued and press on the horizontal line.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pelvis glued, whole-foot horizontal drive, 2–3 sec return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Seated Leg Press (TWMA-101)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Seated Leg Press로 좌식·수평에 가까운 레그 프레스입니다.","verifiedAdjustments":"시트 슬라이드, 등판, 발판, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '수평 레그 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Hack Squat (PPHS-109) / Hack Press (PPHP-131) · Pure Plate

🎯 ONE KEY CUE
🔥 "등판에 붙어 발바닥 전체로 일어서기"

Pure Plate Hack Squat·Hack Press로 등판 지지형 핵 스쿼트. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨 패드, 등판, 발판, 세이프티, 플레이트를 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
가이드를 따라 앉았다가 밀어 올리기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 무릎만 앞으로 보내 뒤꿈치를 드는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Hack Squat (PPHS-109) / Hack Press (PPHP-131)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Hack Squat (PPHS-109) / Hack Press (PPHP-131) · Pure Plate

🎯 ONE KEY CUE
🔥 "Stay on the back pad and stand through the whole foot"

Pure Plate Hack Squat·Hack Press로 등판 지지형 핵 스쿼트입니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨 패드, 등판, 발판, 세이프티, 플레이트.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Hack Squat (PPHS-109) / Hack Press (PPHP-131). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Hack Squat (PPHS-109) / Hack Press (PPHP-131)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate Hack Squat·Hack Press로 등판 지지형 핵 스쿼트입니다.","verifiedAdjustments":"어깨 패드, 등판, 발판, 세이프티, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '핵 스쿼트';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate V-Squat (PPVS-107) · Pure Plate

🎯 ONE KEY CUE
🔥 "발판 위치에 맞춰 대퇴·둔근으로 일어서기"

스쿼트 프레스 전용명보다 V-Squat·Hack Press의 가이드 스쿼트 패턴이 해당합니다. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨 패드, 발판 높이, 세이프티, 플레이트를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
가이드 스쿼트 궤적으로 내려앉았다 밀어 올리기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate V-Squat (PPVS-107)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate V-Squat (PPVS-107) · Pure Plate

🎯 ONE KEY CUE
🔥 "Match foot placement and stand through quads and glutes"

스쿼트 프레스 전용명보다 V-Squat·Hack Press의 가이드 스쿼트 패턴이 해당합니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨 패드, 발판 높이, 세이프티, 플레이트.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate V-Squat (PPVS-107). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate V-Squat (PPVS-107)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.com/en/strength/plate-loaded-v-squat","verifiedStructure":"스쿼트 프레스 전용명보다 V-Squat·Hack Press의 가이드 스쿼트 패턴이 해당합니다.","verifiedAdjustments":"어깨 패드, 발판 높이, 세이프티, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '스쿼트 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Forge Plate Loaded Belt Squat (S2-2-BS) · Forge

🎯 ONE KEY CUE
🔥 "상체를 세운 채 벨트로 하중을 받고 앉았다 일어서기"

Forge Plate Loaded Belt Squat(S2-2-BS)로 벨트 하중 스쿼트. 플레이트 로딩 · Forge 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
벨트, 발판 위치, 가동 범위, 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
벨트가 당기는 궤적으로 앉았다 일어서기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 허리를 과굴곡하며 앞으로 숙이는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.
❌ 양쪽 플레이트 무게를 다르게 올리는 것
양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Forge Plate Loaded Belt Squat (S2-2-BS)은 플레이트 로딩 레그 프레스입니다. 양쪽 원판을 맞춘 뒤, 안전 스톱을 내 가동범위에 먼저 걸고 시작하세요. 첫 2세트는 템포를 늦춰 골반이 뜨는지 확인합니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Forge Plate Loaded Belt Squat (S2-2-BS) · Forge

🎯 ONE KEY CUE
🔥 "Keep the torso upright, load through the belt, and squat"

Forge Plate Loaded Belt Squat(S2-2-BS)로 벨트 하중 스쿼트입니다. Lean into the plate-loaded / Forge design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 벨트, 발판 위치, 가동 범위, 플레이트. Match plates on both sides — do not load one arm first.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.
❌ Loading unequal plates
Match both sides, then confirm with a light set.

---

💡 MACHINE FIT PRO TIP
🔥 Forge Plate Loaded Belt Squat (S2-2-BS) is plate-loaded. Match both sides, set the safety stops to your range first, and use the first two sets to confirm the pelvis stays down.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Forge Plate Loaded Belt Squat (S2-2-BS)","manufacturer":"DRAX","productSeries":"Forge","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Forge Plate Loaded Belt Squat(S2-2-BS)로 벨트 하중 스쿼트입니다.","verifiedAdjustments":"벨트, 발판 위치, 가동 범위, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '벨트 스쿼트';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Leg Extension (TWMA-102) · Welliv Pro

🎯 ONE KEY CUE
🔥 "패드를 정강이에 맞추고 무릎만 펴기"

Welliv Pro Leg Extension(TWMA-102)으로 대퇴사두 격리. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 등판, 발목 패드, 시작 위치, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
무릎을 펴 패드를 올렸다 천천히 내리기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 엉덩이가 들리고 상체로 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Leg Extension (TWMA-102)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Leg Extension (TWMA-102) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Align the pad on the shin and extend only at the knee"

Welliv Pro Leg Extension(TWMA-102)으로 대퇴사두 격리입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 등판, 발목 패드, 시작 위치, 스택 핀.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Leg Extension (TWMA-102). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Leg Extension (TWMA-102)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://draxfitness.com.au/products/drax-welliv-pro-leg-extension","verifiedStructure":"Welliv Pro Leg Extension(TWMA-102)으로 대퇴사두 격리입니다.","verifiedAdjustments":"시트, 등판, 발목 패드, 시작 위치, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '레그 익스텐션';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Leg Curl (TWMA-103-2) · Welliv Pro

🎯 ONE KEY CUE
🔥 "허벅지를 패드에 고정하고 발뒤꿈치로 당기기"

Welliv Pro Seated Leg Curl(TWMA-103-2)로 좌식 햄스트링 컬. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 발목 패드, 등판, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
앉은 채 패드를 아래로 당겼다 천천히 펴기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 엉덩이를 들며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Seated Leg Curl (TWMA-103-2)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Leg Curl (TWMA-103-2) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Lock the thighs under the pad and curl with the heels"

Welliv Pro Seated Leg Curl(TWMA-103-2)로 좌식 햄스트링 컬입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 허벅지 패드, 발목 패드, 등판, 스택 핀.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Seated Leg Curl (TWMA-103-2). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Seated Leg Curl (TWMA-103-2)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Seated Leg Curl(TWMA-103-2)로 좌식 햄스트링 컬입니다.","verifiedAdjustments":"시트, 허벅지 패드, 발목 패드, 등판, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '시티드 레그 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Lying Leg Curl (TWMA-103-1) · Welliv Pro

🎯 ONE KEY CUE
🔥 "골반을 패드에 붙이고 발뒤꿈치로 엉덩이 쪽으로 당기기"

Welliv Pro Lying Leg Curl(TWMA-103-1)로 엎드린 자세 햄스트링 컬. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🤲 그립 / 손 위치
손잡이는 안정용입니다. 힘으로 당기지 말고 몸통만 잡아 주세요.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
발목/종아리 패드, 손잡이, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
엎드린 채 패드를 엉덩이 쪽으로 당겼다 펴기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 허리를 과신전하며 패드를 들어 올리는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Lying Leg Curl (TWMA-103-1)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Lying Leg Curl (TWMA-103-1) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Keep the hips on the pad and curl the heels toward the glutes"

Welliv Pro Lying Leg Curl(TWMA-103-1)로 엎드린 자세 햄스트링 컬입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🤲 Grip / hands
Handles are for bracing only. Do not yank them to move the load.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 발목/종아리 패드, 손잡이, 스택 핀.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Lying Leg Curl (TWMA-103-1). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Lying Leg Curl (TWMA-103-1)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Lying Leg Curl(TWMA-103-1)로 엎드린 자세 햄스트링 컬입니다.","verifiedAdjustments":"발목/종아리 패드, 손잡이, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '라잉 레그 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 스탠딩 레그 컬

🎯 ONE KEY CUE
🔥 "지지한 다리로 균형을 잡고 작업 다리를 뒤로 굴곡"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🤲 그립 / 손 위치
손잡이는 안정용입니다. 힘으로 당기지 말고 몸통만 잡아 주세요.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
패드, 지지 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
한쪽 무릎을 뒤로 굴곡했다 천천히 펴기.
발판을 “발로 차듯” 밀지 말고, 발 전체로 멀리 보낸다는 느낌으로 밀어요. 무릎은 발끝 방향을 따라갑니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 상체를 과하게 숙이며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "스탠딩 레그 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Standing Leg Curl

🎯 ONE KEY CUE
🔥 "Brace on the support leg and curl the working leg back"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🤲 Grip / hands
Handles are for bracing only. Do not yank them to move the load.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 패드, 지지 손잡이, 중량.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Do not kick the platform. Drive it away through the whole foot and let the knees track the toes.
Bend, press through the mid-foot, and return without bouncing the knees.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Standing Leg Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Kneeling Leg Curl(PPKLC-121)은 있으나 스탠딩 레그 컬 전용 SKU는 확인되지 않았습니다.","verifiedAdjustments":"패드, 지지 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '스탠딩 레그 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Kneeling Leg Curl (PPKLC-121) · Pure Plate

🎯 ONE KEY CUE
🔥 "한쪽씩 같은 가동 범위로 컬하기"

싱글 전용명보다 Kneeling Leg Curl의 독립 다리 운용이 해당합니다. 좌우가 독립으로 움직이는 · Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
무릎·좌·우 암, 플레이트를 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
각 다리가 독립적으로 굴곡했다 펴기.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

---

💥 ④ 최고 수축
무릎을 완전히 잠그기 직전, 허벅지·둔근이 일을 받는 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
내려올 때 골반이 말리는 깊이 직전에서 방향을 바꾸세요.

---

❌ 흔한 실수
❌ 강한 쪽에만 무게를 몰아주는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Kneeling Leg Curl (PPKLC-121) · Pure Plate

🎯 ONE KEY CUE
🔥 "Curl each side through the same range of motion"

싱글 전용명보다 Kneeling Leg Curl의 독립 다리 운용이 해당합니다. Lean into the independent arms / Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 무릎·좌·우 암, 플레이트. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Plant the pelvis and feel the whole foot on the platform. Align knees with toes.
Double-check both sides start at the same height.
Check only this:
👉 Pelvis not curling under

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
Bend, press through the mid-foot, and return without bouncing the knees. Keep both sides honest.

---

💥 ④ Peak contraction
Stop just short of hard lockout where quads/glutes still own the load.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Reverse before the pelvis curls under.

---

❌ Common mistakes
❌ Knees collapsing inward
Drive knees with the toes. Reduce load immediately if they cave.
❌ Pelvis curling / low back peeling at the bottom
Own pelvis position before depth.
❌ Snapping into a hard knee lockout
If position breaks, cut the load.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 Independent arms are the point. Before you load up, confirm both sides move at the same speed. If one side finishes early, fix balance before adding plates or pins.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Kneeling Leg Curl (PPKLC-121)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"싱글 전용명보다 Kneeling Leg Curl의 독립 다리 운용이 해당합니다.","verifiedAdjustments":"무릎·좌·우 암, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '싱글 레그 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Hip Thrust (PPHT-111) / Forge Hip Thrust (S2-2-HIP) · Pure Plate

🎯 ONE KEY CUE
🔥 "턱을 당기고 엉덩이로 패드를 밀어 올리기"

Pure Plate·Forge Hip Thrust로 둔근 힙 쓰러스트. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
등 패드, 풋 지지, 힙 패드/벨트, 플레이트를 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
골반을 위로 밀어 올렸다 천천히 내리기.
허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 허리를 과신전하며 반동으로 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Hip Thrust (PPHT-111) / Forge Hip Thrust (S2-2-HIP)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"턱을 당기고 엉덩이로 패드를 밀어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Hip Thrust (PPHT-111) / Forge Hip Thrust (S2-2-HIP) · Pure Plate

🎯 ONE KEY CUE
🔥 "Tuck the chin and drive the pad up with the glutes"

Pure Plate·Forge Hip Thrust로 둔근 힙 쓰러스트입니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 등 패드, 풋 지지, 힙 패드/벨트, 플레이트.

---

💪 ② Start position
Set the pelvis first. Do not plan to create height with the lower back.
Check only this:
👉 Glutes ready to drive, not the lumbar spine

---

🔥 ③ Execution
Finish with the hips/glutes — do not manufacture height with the lumbar spine.
Drive the hips, squeeze, then lower without lumbar snap.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Creating height with the lumbar spine
If position breaks, cut the load.
❌ Rotating the pelvis and favoring one side
If position breaks, cut the load.
❌ Bouncing the lockout
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Hip Thrust (PPHT-111) / Forge Hip Thrust (S2-2-HIP). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Tuck the chin and drive the pad up with the glutes. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Pure Plate Hip Thrust (PPHT-111) / Forge Hip Thrust (S2-2-HIP)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Pure Plate·Forge Hip Thrust로 둔근 힙 쓰러스트입니다.","verifiedAdjustments":"등 패드, 풋 지지, 힙 패드/벨트, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '힙 쓰러스트';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Pure Plate Standing Hip Thrust (PPSHT-124) · Pure Plate

🎯 ONE KEY CUE
🔥 "골반을 앞으로 밀어 둔근으로 드라이브"

글루트 드라이브 전용명보다 Standing Hip Thrust의 둔근 드라이브 패턴이 가깝습니다. Pure Plate 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
롤러 패드, 풋 지지, 플레이트를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
스탠딩 힙 쓰러스트 궤적으로 밀어 올렸다 복귀.
허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 무릎만 펴며 허벅지 앞쪽에 힘을 주는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Pure Plate Standing Hip Thrust (PPSHT-124)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반을 앞으로 밀어 둔근으로 드라이브. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Pure Plate Standing Hip Thrust (PPSHT-124) · Pure Plate

🎯 ONE KEY CUE
🔥 "Drive the hips forward with the glutes"

글루트 드라이브 전용명보다 Standing Hip Thrust의 둔근 드라이브 패턴이 가깝습니다. Lean into the Pure Plate design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 롤러 패드, 풋 지지, 플레이트.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Set the pelvis first. Do not plan to create height with the lower back.
Check only this:
👉 Glutes ready to drive, not the lumbar spine

---

🔥 ③ Execution
Finish with the hips/glutes — do not manufacture height with the lumbar spine.
Drive the hips, squeeze, then lower without lumbar snap.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Creating height with the lumbar spine
If position breaks, cut the load.
❌ Rotating the pelvis and favoring one side
If position breaks, cut the load.
❌ Bouncing the lockout
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Pure Plate Standing Hip Thrust (PPSHT-124). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Drive the hips forward with the glutes. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Pure Plate Standing Hip Thrust (PPSHT-124)","manufacturer":"DRAX","productSeries":"Pure Plate","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"글루트 드라이브 전용명보다 Standing Hip Thrust의 둔근 드라이브 패턴이 가깝습니다.","verifiedAdjustments":"롤러 패드, 풋 지지, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '글루트 드라이브';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105) · Welliv Pro

🎯 ONE KEY CUE
🔥 "골반을 고정한 채 엉덩이로 뒤로 차기"

킥백 전용 SKU보다 Total Hip·Rotary Hip & Glute의 후방 신전 패턴이 해당합니다. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 가동 범위, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
무릎을 약간 굽힌 채 다리를 뒤로 뻗었다 천천히 복귀.
허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 허리를 과신전하며 반동으로 차는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반을 고정한 채 엉덩이로 뒤로 차기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Brace the pelvis and kick back with the glute"

킥백 전용 SKU보다 Total Hip·Rotary Hip & Glute의 후방 신전 패턴이 해당합니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 가동 범위, 스택 핀.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Set the pelvis first. Do not plan to create height with the lower back.
Check only this:
👉 Glutes ready to drive, not the lumbar spine

---

🔥 ③ Execution
Finish with the hips/glutes — do not manufacture height with the lumbar spine.
Drive the hips, squeeze, then lower without lumbar snap.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Creating height with the lumbar spine
If position breaks, cut the load.
❌ Rotating the pelvis and favoring one side
If position breaks, cut the load.
❌ Bouncing the lockout
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the pelvis and kick back with the glute. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"킥백 전용 SKU보다 Total Hip·Rotary Hip & Glute의 후방 신전 패턴이 해당합니다.","verifiedAdjustments":"패드, 가동 범위, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '글루트 킥백';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Hip Abductor (TWMA-107) / Pure Plate Standing Abductor (PPSAB-122) · Welliv Pro

🎯 ONE KEY CUE
🔥 "상체를 세운 채 무릎을 바깥으로 벌리기"

Welliv Pro Outer Thigh·Pure Plate Standing Abductor로 외전. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트/무릎 패드, 시작 위치, 풋 지지, 스택/플레이트를 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
무릎을 바깥으로 벌렸다 천천히 모으기.
허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 상체를 뒤로 젖히며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Hip Abductor (TWMA-107) / Pure Plate Standing Abductor (PPSAB-122)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 세운 채 무릎을 바깥으로 벌리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Hip Abductor (TWMA-107) / Pure Plate Standing Abductor (PPSAB-122) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Keep the torso upright and open the knees outward"

Welliv Pro Outer Thigh·Pure Plate Standing Abductor로 외전입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트/무릎 패드, 시작 위치, 풋 지지, 스택/플레이트.

---

💪 ② Start position
Set the pelvis first. Do not plan to create height with the lower back.
Check only this:
👉 Glutes ready to drive, not the lumbar spine

---

🔥 ③ Execution
Finish with the hips/glutes — do not manufacture height with the lumbar spine.
Drive the hips, squeeze, then lower without lumbar snap.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Creating height with the lumbar spine
If position breaks, cut the load.
❌ Rotating the pelvis and favoring one side
If position breaks, cut the load.
❌ Bouncing the lockout
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Hip Abductor (TWMA-107) / Pure Plate Standing Abductor (PPSAB-122). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the torso upright and open the knees outward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Hip Abductor (TWMA-107) / Pure Plate Standing Abductor (PPSAB-122)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Outer Thigh·Pure Plate Standing Abductor로 외전입니다.","verifiedAdjustments":"시트/무릎 패드, 시작 위치, 풋 지지, 스택/플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '힙 어브덕션';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Hip Adductor (TWMA-104) · Welliv Pro

🎯 ONE KEY CUE
🔥 "무릎을 안쪽으로 모으며 내전근 수축"

Welliv Pro Hip Adductor(Inner Thigh, TWMA-104)로 내전. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 무릎 패드, 시작 위치(다단), 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
벌린 무릎을 가운데로 모았다 천천히 벌리기.
허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 발끝만으로 모으며 무릎이 흔들리는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Hip Adductor (TWMA-104)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"무릎을 안쪽으로 모으며 내전근 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Hip Adductor (TWMA-104) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Squeeze the knees inward and contract the adductors"

Welliv Pro Hip Adductor(Inner Thigh, TWMA-104)로 내전입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 무릎 패드, 시작 위치(다단), 스택 핀.

---

💪 ② Start position
Set the pelvis first. Do not plan to create height with the lower back.
Check only this:
👉 Glutes ready to drive, not the lumbar spine

---

🔥 ③ Execution
Finish with the hips/glutes — do not manufacture height with the lumbar spine.
Drive the hips, squeeze, then lower without lumbar snap.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Creating height with the lumbar spine
If position breaks, cut the load.
❌ Rotating the pelvis and favoring one side
If position breaks, cut the load.
❌ Bouncing the lockout
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Hip Adductor (TWMA-104). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Squeeze the knees inward and contract the adductors. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Hip Adductor (TWMA-104)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Hip Adductor(Inner Thigh, TWMA-104)로 내전입니다.","verifiedAdjustments":"시트, 무릎 패드, 시작 위치(다단), 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '힙 어덕션';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105) · Welliv Pro

🎯 ONE KEY CUE
🔥 "선택한 방향에서 골반을 고정하고 둔근으로 밀기"

Welliv Pro Total Hip·Rotary Hip & Glute로 다방향 힙·둔근 머신. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드 각도, 가동 범위, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
설정 궤적으로 다리를 밀었다 천천히 복귀.
허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 허리를 과하게 틀며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"선택한 방향에서 골반을 고정하고 둔근으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105) · Welliv Pro

🎯 ONE KEY CUE
🔥 "In the chosen direction, brace the pelvis and drive with the glute"

Welliv Pro Total Hip·Rotary Hip & Glute로 다방향 힙·둔근 머신입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드 각도, 가동 범위, 스택 핀.

---

💪 ② Start position
Set the pelvis first. Do not plan to create height with the lower back.
Check only this:
👉 Glutes ready to drive, not the lumbar spine

---

🔥 ③ Execution
Finish with the hips/glutes — do not manufacture height with the lumbar spine.
Drive the hips, squeeze, then lower without lumbar snap.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Creating height with the lumbar spine
If position breaks, cut the load.
❌ Rotating the pelvis and favoring one side
If position breaks, cut the load.
❌ Bouncing the lockout
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"In the chosen direction, brace the pelvis and drive with the glute. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Total Hip / Rotary Hip & Glute (TWMA-105)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Welliv Pro Total Hip·Rotary Hip & Glute로 다방향 힙·둔근 머신입니다.","verifiedAdjustments":"패드 각도, 가동 범위, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '글루트 / 힙 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Dual Standing Calf & Squat (TWMA-108) / Forge Standing Squat/Calf (S2-2-SQC) · Welliv Dual

🎯 ONE KEY CUE
🔥 "무릎을 잠그지 말고 발볼로 밀어 올리기"

Welliv Dual Standing Calf & Squat·Forge Standing Squat/Calf로 스탠딩 카프. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
어깨 패드, 발판, 스택/플레이트를 확인하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발뒤꿈치를 올렸다 천천히 내리기.
무릎으로 밀지 말고 발목 가동범위로만 위아래를 만듭니다.

---

💥 ④ 최고 수축
발볼로 최대한 올린 꼭대기에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 반동으로 뛰듯이 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Dual Standing Calf & Squat (TWMA-108) / Forge Standing Squat/Calf (S2-2-SQC)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Dual Standing Calf & Squat (TWMA-108) / Forge Standing Squat/Calf (S2-2-SQC) · Welliv Dual

🎯 ONE KEY CUE
🔥 "Keep a soft knee and drive up through the balls of the feet"

Welliv Dual Standing Calf & Squat·Forge Standing Squat/Calf로 스탠딩 카프입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 어깨 패드, 발판, 스택/플레이트.

---

💪 ② Start position
Lock the knee angle and prepare to move only through the ankles.
Check only this:
👉 Knees not bending with the calves

---

🔥 ③ Execution
Do not press with the knees. Use ankle range only.
Lower the heels, rise through the balls of the feet, pause, then lower.

---

💥 ④ Peak contraction
Stop at the top of the rise through the balls of the feet.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Bending the knees and turning it into a leg press
If position breaks, cut the load.
❌ Bouncing the heels
Slow the tempo and repeat one clean path.
❌ Cutting the range too short
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Dual Standing Calf & Squat (TWMA-108) / Forge Standing Squat/Calf (S2-2-SQC). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Dual Standing Calf & Squat (TWMA-108) / Forge Standing Squat/Calf (S2-2-SQC)","manufacturer":"DRAX","productSeries":"Welliv Dual","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Welliv Dual Standing Calf & Squat·Forge Standing Squat/Calf로 스탠딩 카프입니다.","verifiedAdjustments":"어깨 패드, 발판, 스택/플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '스탠딩 카프';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Forge Plate Seated Calf (S2-2-SC) · Forge

🎯 ONE KEY CUE
🔥 "무릎 패드 아래에서 발볼로 밀어 올리기"

Forge Plate Seated Calf(S2-2-SC)로 좌식 카프 레이즈. Forge 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
무릎 패드, 발판, 플레이트를 확인하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
앉아서 발뒤꿈치를 올렸다 천천히 내리기.
무릎으로 밀지 말고 발목 가동범위로만 위아래를 만듭니다.

---

💥 ④ 최고 수축
발볼로 최대한 올린 꼭대기에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 무릎으로 패드를 튕기며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Forge Plate Seated Calf (S2-2-SC)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Forge Plate Seated Calf (S2-2-SC) · Forge

🎯 ONE KEY CUE
🔥 "Under the knee pad, drive up through the balls of the feet"

Forge Plate Seated Calf(S2-2-SC)로 좌식 카프 레이즈입니다. Lean into the Forge design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 무릎 패드, 발판, 플레이트.

---

💪 ② Start position
Lock the knee angle and prepare to move only through the ankles.
Check only this:
👉 Knees not bending with the calves

---

🔥 ③ Execution
Do not press with the knees. Use ankle range only.
Lower the heels, rise through the balls of the feet, pause, then lower.

---

💥 ④ Peak contraction
Stop at the top of the rise through the balls of the feet.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Bending the knees and turning it into a leg press
If position breaks, cut the load.
❌ Bouncing the heels
Slow the tempo and repeat one clean path.
❌ Cutting the range too short
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Forge Plate Seated Calf (S2-2-SC). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Forge Plate Seated Calf (S2-2-SC)","manufacturer":"DRAX","productSeries":"Forge","sourceUrl":"https://www.draxfit.co.uk/drax--s2-2-sql-forge-plate-squat/drax--s2-2-sc-forge-plate-seated-calf","verifiedStructure":"Forge Plate Seated Calf(S2-2-SC)로 좌식 카프 레이즈입니다.","verifiedAdjustments":"무릎 패드, 발판, 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '시티드 카프';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Alpha Dual Leg Press/Calf (SA-1-LP) · Alpha

🎯 ONE KEY CUE
🔥 "무릎을 살짝 고정하고 발볼로만 밀기"

전용 레그프레스 카프 SKU보다 Alpha Dual Leg Press/Calf의 카프 모드가 해당합니다. Alpha racks 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
발판 위치, 등판, 중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
레그프레스 발판에서 카프 레이즈로 뒤꿈치를 올렸다 내리기.
무릎으로 밀지 말고 발목 가동범위로만 위아래를 만듭니다.

---

💥 ④ 최고 수축
발볼로 최대한 올린 꼭대기에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 무릎을 굽혔다 펴며 레그프레스로 바꾸는
자세가 무너지면 무게를 낮추세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Alpha Dual Leg Press/Calf (SA-1-LP)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Alpha Dual Leg Press/Calf (SA-1-LP) · Alpha

🎯 ONE KEY CUE
🔥 "Soft-lock the knees and press only through the balls of the feet"

전용 레그프레스 카프 SKU보다 Alpha Dual Leg Press/Calf의 카프 모드가 해당합니다. Lean into the Alpha racks design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 발판 위치, 등판, 중량.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Lock the knee angle and prepare to move only through the ankles.
Check only this:
👉 Knees not bending with the calves

---

🔥 ③ Execution
Do not press with the knees. Use ankle range only.
Lower the heels, rise through the balls of the feet, pause, then lower.

---

💥 ④ Peak contraction
Stop at the top of the rise through the balls of the feet.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Bending the knees and turning it into a leg press
If position breaks, cut the load.
❌ Bouncing the heels
Slow the tempo and repeat one clean path.
❌ Cutting the range too short
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Alpha Dual Leg Press/Calf (SA-1-LP). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Alpha Dual Leg Press/Calf (SA-1-LP)","manufacturer":"DRAX","productSeries":"Alpha","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"전용 레그프레스 카프 SKU보다 Alpha Dual Leg Press/Calf의 카프 모드가 해당합니다.","verifiedAdjustments":"발판 위치, 등판, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '레그 프레스 카프';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Arm Curl (TWMA-309) · Welliv Pro

🎯 ONE KEY CUE
🔥 "상완을 패드에 붙이고 반동 없이 굴곡"

Welliv Pro Arm Curl(TWMA-309)로 카운터밸런스 바이셉 컬. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 각도를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 손잡이 각도, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 어깨 쪽으로 굴곡했다 천천히 펴기.
몸통은 고정, 팔꿈치 아래만 움직입니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨를 들어 올리며 바를 던지듯 올리는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Arm Curl (TWMA-309)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상완을 패드에 붙이고 반동 없이 굴곡. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Arm Curl (TWMA-309) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Keep the upper arms on the pad and curl without momentum"

Welliv Pro Arm Curl(TWMA-309)로 카운터밸런스 바이셉 컬입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 손잡이 각도, 스택 핀.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Torso stays quiet. Move only below the elbows.
Curl or extend only at the elbow, then reverse slowly.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Arm Curl (TWMA-309). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the upper arms on the pad and curl without momentum. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Arm Curl (TWMA-309)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Arm Curl(TWMA-309)로 카운터밸런스 바이셉 컬입니다.","verifiedAdjustments":"시트, 팔꿈치 패드, 손잡이 각도, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '바이셉 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Forge Preacher Curl Bench (S2-4-PCB) / Standing Preacher Curl (TWF-211) · Forge

🎯 ONE KEY CUE
🔥 "상완을 프리처 패드에 밀착하고 천천히 굴곡"

Forge Preacher Curl Bench·Standing Preacher Curl로 프리처 컬. Forge 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트/패드 높이, 바 위치, 중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
프리처 패드에서 전완을 올려 굴곡했다 펴기.
몸통은 고정, 팔꿈치 아래만 움직입니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 패드에서 팔꿈치를 떼며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Forge Preacher Curl Bench (S2-4-PCB) / Standing Preacher Curl (TWF-211)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상완을 프리처 패드에 밀착하고 천천히 굴곡. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Forge Preacher Curl Bench (S2-4-PCB) / Standing Preacher Curl (TWF-211) · Forge

🎯 ONE KEY CUE
🔥 "Keep the upper arms glued to the preacher pad and curl slowly"

Forge Preacher Curl Bench·Standing Preacher Curl로 프리처 컬입니다. Lean into the Forge design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트/패드 높이, 바 위치, 중량.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Torso stays quiet. Move only below the elbows.
Curl or extend only at the elbow, then reverse slowly.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Forge Preacher Curl Bench (S2-4-PCB) / Standing Preacher Curl (TWF-211). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the upper arms glued to the preacher pad and curl slowly. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Forge Preacher Curl Bench (S2-4-PCB) / Standing Preacher Curl (TWF-211)","manufacturer":"DRAX","productSeries":"Forge","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"Forge Preacher Curl Bench·Standing Preacher Curl로 프리처 컬입니다.","verifiedAdjustments":"시트/패드 높이, 바 위치, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '프리처 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 아이소래터럴 바이셉 컬

🎯 ONE KEY CUE
🔥 "좌우를 같은 속도로 굴곡하며 균형 확인"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 손잡이, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
각 팔이 독립적으로 굴곡했다 펴기.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 강한 팔만 먼저 올리는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.
❌ 한쪽만 먼저 끝내고 반대쪽을 따라가게 하는 것
약한 쪽 속도에 강한 쪽을 맞추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "아이소래터럴 바이셉 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Iso-Lateral Biceps Curl

🎯 ONE KEY CUE
🔥 "Curl both sides at the same speed and check balance"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 손잡이, 중량. Confirm both sides start from the same position.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Double-check both sides start at the same height.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
Curl or extend only at the elbow, then reverse slowly. Keep both sides honest.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.
❌ Letting one side finish early
Match the stronger side to the weaker side’s speed.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Iso-Lateral Biceps Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"DRAX 공개 카탈로그에서 아이소래터럴 바이셉 컬 전용 SKU를 확인하지 못했습니다.","verifiedAdjustments":"시트, 좌·우 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '아이소래터럴 바이셉 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Arm Curl (TWMA-309) / Infinity Arm Curl (SI-1-AC) · Welliv Pro

🎯 ONE KEY CUE
🔥 "팔꿈치를 고정한 채 전완만 들어 올리기"

Welliv Pro·Infinity Arm Curl로 암 컬 머신. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 손잡이, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 올려 굴곡했다 천천히 신전.
몸통은 고정, 팔꿈치 아래만 움직입니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 상체를 흔들어 반동 컬하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Arm Curl (TWMA-309) / Infinity Arm Curl (SI-1-AC)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 고정한 채 전완만 들어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Arm Curl (TWMA-309) / Infinity Arm Curl (SI-1-AC) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Fix the elbows and lift only the forearms"

Welliv Pro·Infinity Arm Curl로 암 컬 머신입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 손잡이, 스택 핀.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Torso stays quiet. Move only below the elbows.
Curl or extend only at the elbow, then reverse slowly.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Arm Curl (TWMA-309) / Infinity Arm Curl (SI-1-AC). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Fix the elbows and lift only the forearms. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Arm Curl (TWMA-309) / Infinity Arm Curl (SI-1-AC)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro·Infinity Arm Curl로 암 컬 머신입니다.","verifiedAdjustments":"시트, 팔꿈치 패드, 손잡이, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '암 컬';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 트라이셉스 익스텐션

🎯 ONE KEY CUE
🔥 "상완을 고정하고 팔꿈치만 펴기"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
머리 위·앞에서 전완을 펴며 신전했다 굴곡.
몸통은 고정, 팔꿈치 아래만 움직입니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨로 무게를 밀어 내리는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "트라이셉스 익스텐션"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상완을 고정하고 팔꿈치만 펴기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Triceps Extension

🎯 ONE KEY CUE
🔥 "Lock the upper arms and extend only at the elbows"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 손잡이, 중량.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Torso stays quiet. Move only below the elbows.
Curl or extend only at the elbow, then reverse slowly.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Triceps Extension", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lock the upper arms and extend only at the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Alpha Bicep/Tricep 복합은 있으나 트라이셉스 익스텐션 전용 머신은 확인되지 않았습니다.","verifiedAdjustments":"시트, 팔꿈치 패드, 손잡이, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '트라이셉스 익스텐션';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Dip (TWMA-313) · Welliv Pro

🎯 ONE KEY CUE
🔥 "팔꿈치를 몸통에 붙이고 아래로 밀기"

트라이셉스 프레스 전용명보다 Seated Dip의 하방 프레스 패턴이 가깝습니다. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 손잡이, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 아래로 눌렀다 팔꿈치를 굽혀 복귀.
몸통은 고정, 팔꿈치 아래만 움직입니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨를 앞·위로 들어 올리는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Seated Dip (TWMA-313)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 몸통에 붙이고 아래로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Dip (TWMA-313) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Keep the elbows close to the torso and press down"

트라이셉스 프레스 전용명보다 Seated Dip의 하방 프레스 패턴이 가깝습니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 손잡이, 스택 핀.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Torso stays quiet. Move only below the elbows.
Curl or extend only at the elbow, then reverse slowly.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Seated Dip (TWMA-313). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the elbows close to the torso and press down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Welliv Pro Seated Dip (TWMA-313)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"트라이셉스 프레스 전용명보다 Seated Dip의 하방 프레스 패턴이 가깝습니다.","verifiedAdjustments":"시트, 시작 위치, 손잡이, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '트라이셉스 프레스';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Seated Dip (TWMA-313) / Infinity Seated Dip (SI-1-SD) · Welliv Pro

🎯 ONE KEY CUE
🔥 "상체를 안정시키고 삼두로 밀어 올리기"

Welliv Pro·Infinity Seated Dip로 딥/트라이셉스 머신. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 너비를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 손잡이 너비, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
딥 궤적으로 내렸다가 팔꿈치를 펴며 밀기.
몸통은 고정, 팔꿈치 아래만 움직입니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 가동 범위를 과도하게 깊게 파 어깨를 다치게 하는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Seated Dip (TWMA-313) / Infinity Seated Dip (SI-1-SD)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 안정시키고 삼두로 밀어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Seated Dip (TWMA-313) / Infinity Seated Dip (SI-1-SD) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Stabilize the torso and press up with the triceps"

Welliv Pro·Infinity Seated Dip로 딥/트라이셉스 머신입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 손잡이 너비, 스택 핀.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Torso stays quiet. Move only below the elbows.
Curl or extend only at the elbow, then reverse slowly.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Seated Dip (TWMA-313) / Infinity Seated Dip (SI-1-SD). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Stabilize the torso and press up with the triceps. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Seated Dip (TWMA-313) / Infinity Seated Dip (SI-1-SD)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro·Infinity Seated Dip로 딥/트라이셉스 머신입니다.","verifiedAdjustments":"시트, 시작 위치, 손잡이 너비, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '딥 / 트라이셉스 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Alpha Bicep/Tricep/Low Row (SA-1-BT) · Alpha

🎯 ONE KEY CUE
🔥 "선택한 스테이션에서 팔꿈치 축만 사용해 고립"

Alpha Bicep/Tricep/Low Row(SA-1-BT)로 이두·삼두·로우 복합. Alpha racks 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이/스테이션 선택, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
컬 또는 프레스다운 궤적으로 굴곡·신전 반복.
몸통은 고정, 팔꿈치 아래만 움직입니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 스테이션을 혼동해 반동으로 무게를 치는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Alpha Bicep/Tricep/Low Row (SA-1-BT)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"선택한 스테이션에서 팔꿈치 축만 사용해 고립. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Alpha Bicep/Tricep/Low Row (SA-1-BT) · Alpha

🎯 ONE KEY CUE
🔥 "On the chosen station, isolate by moving only at the elbow"

Alpha Bicep/Tricep/Low Row(SA-1-BT)로 이두·삼두·로우 복합입니다. Lean into the Alpha racks design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이/스테이션 선택, 스택 핀.

---

💪 ② Start position
Fix the elbows on the pad or at your sides. Kill torso swing.
Check only this:
👉 Elbows not drifting forward

---

🔥 ③ Execution
Torso stays quiet. Move only below the elbows.
Curl or extend only at the elbow, then reverse slowly.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the elbows drift so the shoulders take over
If position breaks, cut the load.
❌ Swinging the torso
If position breaks, cut the load.
❌ Over-bending the wrists
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Alpha Bicep/Tricep/Low Row (SA-1-BT). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the chosen station, isolate by moving only at the elbow. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Alpha Bicep/Tricep/Low Row (SA-1-BT)","manufacturer":"DRAX","productSeries":"Alpha","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Alpha Bicep/Tricep/Low Row(SA-1-BT)로 이두·삼두·로우 복합입니다.","verifiedAdjustments":"시트, 손잡이/스테이션 선택, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '바이셉스 / 트라이셉스 복합 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Abdominal Crunch (TWMA-201) · Welliv Pro

🎯 ONE KEY CUE
🔥 "갈비뼈를 골반 쪽으로 짧게 접기"

Welliv Pro Abdominal Crunch(TWMA-201)로 회전축 조절형 앱 크런치. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 회전축/ROM, 가슴 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 앞으로 말아 크런치했다 천천히 펴기.
갈비뼈를 골반 쪽으로 말아 올리는 느낌으로 수축하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 목만 굽히며 당기는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Abdominal Crunch (TWMA-201)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Abdominal Crunch (TWMA-201) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Shorten the ribs toward the pelvis"

Welliv Pro Abdominal Crunch(TWMA-201)로 회전축 조절형 앱 크런치입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 회전축/ROM, 가슴 패드, 스택 핀.

---

💪 ② Start position
Stabilize the pelvis and stop thinking about pulling with the neck.
Check only this:
👉 Pelvis locked

---

🔥 ③ Execution
Curl the ribcage toward the pelvis.
Curl or rotate through the torso, then return without momentum.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pulling with the neck
Curl ribs toward the pelvis instead.
❌ Lifting the pelvis and using momentum
Slow the tempo and repeat one clean path.
❌ Forcing an excessive range
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Abdominal Crunch (TWMA-201). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Abdominal Crunch (TWMA-201)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Abdominal Crunch(TWMA-201)로 회전축 조절형 앱 크런치입니다.","verifiedAdjustments":"시트, 회전축/ROM, 가슴 패드, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '앱 크런치';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Abdominal Crunch (TWMA-201) / Welliv Abdominal · Welliv Pro

🎯 ONE KEY CUE
🔥 "복부로만 상체를 말아 올리기"

Welliv Pro Abdominal Crunch로 복부 머신. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, ROM, 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
복부 궤적으로 상체를 굴곡했다 신전.
갈비뼈를 골반 쪽으로 말아 올리는 느낌으로 수축하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 팔 힘으로 패드를 당기는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Abdominal Crunch (TWMA-201) / Welliv Abdominal의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Abdominal Crunch (TWMA-201) / Welliv Abdominal · Welliv Pro

🎯 ONE KEY CUE
🔥 "Curl the torso up using the abs only"

Welliv Pro Abdominal Crunch로 복부 머신입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, ROM, 패드, 스택 핀.

---

💪 ② Start position
Stabilize the pelvis and stop thinking about pulling with the neck.
Check only this:
👉 Pelvis locked

---

🔥 ③ Execution
Curl the ribcage toward the pelvis.
Curl or rotate through the torso, then return without momentum.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pulling with the neck
Curl ribs toward the pelvis instead.
❌ Lifting the pelvis and using momentum
Slow the tempo and repeat one clean path.
❌ Forcing an excessive range
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Abdominal Crunch (TWMA-201) / Welliv Abdominal. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Abdominal Crunch (TWMA-201) / Welliv Abdominal","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Abdominal Crunch로 복부 머신입니다.","verifiedAdjustments":"시트, ROM, 패드, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '어브도미널';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Rotary Torso (TWMA-204) · Welliv Pro

🎯 ONE KEY CUE
🔥 "골반을 고정하고 상체만 회전"

Welliv Pro Rotary Torso(TWMA-204)로 복사근 회전 머신. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 무릎/풋 지지, 회전 시작 위치, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 좌우로 돌려 복사근을 수축했다 복귀.
갈비뼈를 골반 쪽으로 말아 올리는 느낌으로 수축하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 무릎이 함께 돌아가며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Rotary Torso (TWMA-204)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Rotary Torso (TWMA-204) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Lock the pelvis and rotate only the torso"

Welliv Pro Rotary Torso(TWMA-204)로 복사근 회전 머신입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 무릎/풋 지지, 회전 시작 위치, 스택 핀.

---

💪 ② Start position
Stabilize the pelvis and stop thinking about pulling with the neck.
Check only this:
👉 Pelvis locked

---

🔥 ③ Execution
Curl the ribcage toward the pelvis.
Curl or rotate through the torso, then return without momentum.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pulling with the neck
Curl ribs toward the pelvis instead.
❌ Lifting the pelvis and using momentum
Slow the tempo and repeat one clean path.
❌ Forcing an excessive range
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Rotary Torso (TWMA-204). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Rotary Torso (TWMA-204)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Rotary Torso(TWMA-204)로 복사근 회전 머신입니다.","verifiedAdjustments":"시트, 무릎/풋 지지, 회전 시작 위치, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '로터리 토르소';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — 사이드 밴드

🎯 ONE KEY CUE
🔥 "골반을 고정하고 옆구리를 짧게 접기"

디랙스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이 높이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
손잡이 높이, 스탠스, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
측굴 후 천천히 세워 복귀.
갈비뼈를 골반 쪽으로 말아 올리는 느낌으로 수축하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 앞으로 숙이며 회전이 섞이는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "사이드 밴드"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Side Bend

🎯 ONE KEY CUE
🔥 "Lock the pelvis and shorten the side body"

There is no dedicated DRAX SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 손잡이 높이, 스탠스, 중량.

---

💪 ② Start position
Stabilize the pelvis and stop thinking about pulling with the neck.
Check only this:
👉 Pelvis locked

---

🔥 ③ Execution
Curl the ribcage toward the pelvis.
Curl or rotate through the torso, then return without momentum.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pulling with the neck
Curl ribs toward the pelvis instead.
❌ Lifting the pelvis and using momentum
Slow the tempo and repeat one clean path.
❌ Forcing an excessive range
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Side Bend", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"DRAX","productSeries":null,"sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Ab Twist(TWF-406) 등은 있으나 사이드 밴드 전용 머신은 확인되지 않았습니다.","verifiedAdjustments":"손잡이 높이, 스탠스, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '사이드 밴드';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Back Extension (TWMA-202) · Welliv Pro

🎯 ONE KEY CUE
🔥 "엉덩이부터 상체를 길게 펴기"

Welliv Pro Back Extension(TWMA-202)로 척추기립근 신전. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 손잡이/패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 앞으로 숙였다가 중립으로 펴 올리기.
갈비뼈를 골반 쪽으로 말아 올리는 느낌으로 수축하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 허리를 과신전하며 튕기듯 올리는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Back Extension (TWMA-202)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Back Extension (TWMA-202) · Welliv Pro

🎯 ONE KEY CUE
🔥 "Lengthen the torso from the hips"

Welliv Pro Back Extension(TWMA-202)로 척추기립근 신전입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 손잡이/패드, 스택 핀.

---

💪 ② Start position
Stabilize the pelvis and stop thinking about pulling with the neck.
Check only this:
👉 Pelvis locked

---

🔥 ③ Execution
Curl the ribcage toward the pelvis.
Curl or rotate through the torso, then return without momentum.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pulling with the neck
Curl ribs toward the pelvis instead.
❌ Lifting the pelvis and using momentum
Slow the tempo and repeat one clean path.
❌ Forcing an excessive range
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Back Extension (TWMA-202). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Back Extension (TWMA-202)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro/products","verifiedStructure":"Welliv Pro Back Extension(TWMA-202)로 척추기립근 신전입니다.","verifiedAdjustments":"시트, 풋 지지, 손잡이/패드, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '백 익스텐션';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Forge Reverse Extension (S2-2-RHE) / Welliv Total Hip · Forge

🎯 ONE KEY CUE
🔥 "골반을 고정하고 엉덩이로 뒤로 신전"

힙 익스텐션 전용명보다 Forge Reverse Extension·Total Hip 후방 신전이 가깝습니다. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 풋 지지, 중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
다리를 뒤로 펴며 힙을 신전했다 복귀.
허리로 높이를 만들지 말고 골반·엉덩이로 밀어 마무리하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 허리를 과신전하며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Forge Reverse Extension (S2-2-RHE) / Welliv Total Hip의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반을 고정하고 엉덩이로 뒤로 신전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Forge Reverse Extension (S2-2-RHE) / Welliv Total Hip · Forge

🎯 ONE KEY CUE
🔥 "Brace the pelvis and extend back with the hips"

힙 익스텐션 전용명보다 Forge Reverse Extension·Total Hip 후방 신전이 가깝습니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 풋 지지, 중량.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Set the pelvis first. Do not plan to create height with the lower back.
Check only this:
👉 Glutes ready to drive, not the lumbar spine

---

🔥 ③ Execution
Finish with the hips/glutes — do not manufacture height with the lumbar spine.
Drive the hips, squeeze, then lower without lumbar snap.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Creating height with the lumbar spine
If position breaks, cut the load.
❌ Rotating the pelvis and favoring one side
If position breaks, cut the load.
❌ Bouncing the lockout
Slow the tempo and repeat one clean path.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Forge Reverse Extension (S2-2-RHE) / Welliv Total Hip. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the pelvis and extend back with the hips. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Forge Reverse Extension (S2-2-RHE) / Welliv Total Hip","manufacturer":"DRAX","productSeries":"Forge","sourceUrl":"https://www.draxfit.co.uk/drax-plate-loaded-strength","verifiedStructure":"힙 익스텐션 전용명보다 Forge Reverse Extension·Total Hip 후방 신전이 가깝습니다.","verifiedAdjustments":"패드, 풋 지지, 중량","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '힙 익스텐션';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Dual Abdominal & Back Extension (TWMA-231) · Welliv Dual

🎯 ONE KEY CUE
🔥 "복근 모드와 신전 모드를 구분해 각각 고립"

Welliv Dual Abdominal & Back Extension(TWMA-231)로 복근·허리 복합. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 모드 선택, 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
크런치 또는 백 익스텐션 궤적으로 번갈아 수행.
갈비뼈를 골반 쪽으로 말아 올리는 느낌으로 수축하세요.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 모드를 섞어 반동으로 무게를 치는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Dual Abdominal & Back Extension (TWMA-231)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Dual Abdominal & Back Extension (TWMA-231) · Welliv Dual

🎯 ONE KEY CUE
🔥 "Isolate abs and extension modes separately"

Welliv Dual Abdominal & Back Extension(TWMA-231)로 복근·허리 복합입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 모드 선택, 패드, 스택 핀.

---

💪 ② Start position
Stabilize the pelvis and stop thinking about pulling with the neck.
Check only this:
👉 Pelvis locked

---

🔥 ③ Execution
Curl the ribcage toward the pelvis.
Curl or rotate through the torso, then return without momentum.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Pulling with the neck
Curl ribs toward the pelvis instead.
❌ Lifting the pelvis and using momentum
Slow the tempo and repeat one clean path.
❌ Forcing an excessive range
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Dual Abdominal & Back Extension (TWMA-231). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Dual Abdominal & Back Extension (TWMA-231)","manufacturer":"DRAX","productSeries":"Welliv Dual","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Welliv Dual Abdominal & Back Extension(TWMA-231)로 복근·허리 복합입니다.","verifiedAdjustments":"시트, 모드 선택, 패드, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '복근 / 허리 복합 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Pro Cable Cross Over (TWMA-401) · Welliv Pro

🎯 ONE KEY CUE
🔥 "가슴 높이에서 양손을 모아 교차하며 수축"

Welliv Pro Cable Cross Over(TWMA-401)·Multi-Jungle CC 옵션. Cable Motion · Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
풀리 높이, 손잡이, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
양 케이블을 앞에서 모아 교차했다 천천히 벌리기.
반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 어깨를 말며 팔꿈치로만 치는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Pro Cable Cross Over (TWMA-401)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴 높이에서 양손을 모아 교차하며 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Pro Cable Cross Over (TWMA-401) · Welliv Pro

🎯 ONE KEY CUE
🔥 "At chest height, bring the hands together and cross for a squeeze"

Welliv Pro Cable Cross Over(TWMA-401)·Multi-Jungle CC 옵션입니다. Lean into the Cable Motion / Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 풀리 높이, 손잡이, 스택 핀.

---

💪 ② Start position
Set the stance, brace, then confirm cable height.
Check only this:
👉 Cable is not towing your torso

---

🔥 ③ Execution
Repeat the same path without momentum. Reduce load if you wobble.
Set the line of pull, move through the elbows, return without letting the stack yank you.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the cable tow the torso
If position breaks, cut the load.
❌ Skipping height setup
If position breaks, cut the load.
❌ Dumping the stack on the return
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Pro Cable Cross Over (TWMA-401). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"At chest height, bring the hands together and cross for a squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Pro Cable Cross Over (TWMA-401)","manufacturer":"DRAX","productSeries":"Welliv Pro","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Welliv Pro Cable Cross Over(TWMA-401)·Multi-Jungle CC 옵션입니다.","verifiedAdjustments":"풀리 높이, 손잡이, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '케이블 크로스오버';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Dual Adjustable Pulley (TWMA-402) / Infinity DAP (S2-3-DAP) · Welliv Dual

🎯 ONE KEY CUE
🔥 "풀리 높이를 목표 각도에 맞추고 궤적을 일정하게"

Welliv Dual Adjustable Pulley·Infinity DAP로 높이 조절형 듀얼 풀리. Cable Motion · Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
풀리 높이, 손잡이/어태치먼트, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
양 풀리에서 대칭으로 당기거나 밀었다 복귀.
반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 케이블이 몸에 스치도록 너무 가까이 서는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Dual Adjustable Pulley (TWMA-402) / Infinity DAP (S2-3-DAP)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"풀리 높이를 목표 각도에 맞추고 궤적을 일정하게. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Dual Adjustable Pulley (TWMA-402) / Infinity DAP (S2-3-DAP) · Welliv Dual

🎯 ONE KEY CUE
🔥 "Set pulley height for the target angle and keep a consistent path"

Welliv Dual Adjustable Pulley·Infinity DAP로 높이 조절형 듀얼 풀리입니다. Lean into the Cable Motion / Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 풀리 높이, 손잡이/어태치먼트, 스택 핀.

---

💪 ② Start position
Set the stance, brace, then confirm cable height.
Check only this:
👉 Cable is not towing your torso

---

🔥 ③ Execution
Repeat the same path without momentum. Reduce load if you wobble.
Set the line of pull, move through the elbows, return without letting the stack yank you.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the cable tow the torso
If position breaks, cut the load.
❌ Skipping height setup
If position breaks, cut the load.
❌ Dumping the stack on the return
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Dual Adjustable Pulley (TWMA-402) / Infinity DAP (S2-3-DAP). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set pulley height for the target angle and keep a consistent path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Dual Adjustable Pulley (TWMA-402) / Infinity DAP (S2-3-DAP)","manufacturer":"DRAX","productSeries":"Welliv Dual","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"Welliv Dual Adjustable Pulley·Infinity DAP로 높이 조절형 듀얼 풀리입니다.","verifiedAdjustments":"풀리 높이, 손잡이/어태치먼트, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '듀얼 어저스터블 풀리';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Multi-Jungle (BWM113 / TWMA404-4) · Multi-Jungle

🎯 ONE KEY CUE
🔥 "한 스테이션씩 정렬을 맞춘 뒤 목표 근군으로 수행"

DRAX Multi-Jungle(BWM113 4/5/8스택·TWMA404)로 멀티 스테이션. Cable Motion · DRAX line 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
⚙️ 조절 포인트
스테이션 선택, 풀리/패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
랫풀·로우·푸시다운·크로스오버 등 스테이션별 궤적.
반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 대기열·케이블 꼬임을 무시하고 급히 쓰는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Multi-Jungle (BWM113 / TWMA404-4)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"한 스테이션씩 정렬을 맞춘 뒤 목표 근군으로 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Multi-Jungle (BWM113 / TWMA404-4) · Multi-Jungle

🎯 ONE KEY CUE
🔥 "Set up one station at a time, then train the target muscle"

DRAX Multi-Jungle(BWM113 4/5/8스택·TWMA404)로 멀티 스테이션입니다. Lean into the Cable Motion / DRAX line design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 스테이션 선택, 풀리/패드, 스택 핀.

---

💪 ② Start position
Set the stance, brace, then confirm cable height.
Check only this:
👉 Cable is not towing your torso

---

🔥 ③ Execution
Repeat the same path without momentum. Reduce load if you wobble.
Set the line of pull, move through the elbows, return without letting the stack yank you.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the cable tow the torso
If position breaks, cut the load.
❌ Skipping height setup
If position breaks, cut the load.
❌ Dumping the stack on the return
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Multi-Jungle (BWM113 / TWMA404-4). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set up one station at a time, then train the target muscle. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Multi-Jungle (BWM113 / TWMA404-4)","manufacturer":"DRAX","productSeries":"Multi-Jungle","sourceUrl":"https://www.draxfit.co.uk/drax-8-station-multi-jungle-with-cable-crossover","verifiedStructure":"DRAX Multi-Jungle(BWM113 4/5/8스택·TWMA404)로 멀티 스테이션입니다.","verifiedAdjustments":"스테이션 선택, 풀리/패드, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '멀티 정글짐';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Welliv Dual Assist Chin Dip (TWMA-308) · Welliv Dual

🎯 ONE KEY CUE
🔥 "무릎 패드로 체중을 덜고 목표 동작에 집중"

Welliv Dual Assist Chin/Dip(TWMA-308)로 풀업·딥 겸용 어시스트. Welliv Pro 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
딥 그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 친업/딥 그립, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
친업 또는 딥 궤적으로 몸을 올렸다 내리기.
반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 보조를 과하게 쓰고 가동 수축을 놓치는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Welliv Dual Assist Chin Dip (TWMA-308)의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"무릎 패드로 체중을 덜고 목표 동작에 집중. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Welliv Dual Assist Chin Dip (TWMA-308) · Welliv Dual

🎯 ONE KEY CUE
🔥 "Let the knee pad unload bodyweight and focus on the target move"

Welliv Dual Assist Chin/Dip(TWMA-308)로 풀업·딥 겸용 어시스트입니다. Lean into the Welliv Pro design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 친업/딥 그립, 스택 핀.

---

💪 ② Start position
Set the stance, brace, then confirm cable height.
Check only this:
👉 Cable is not towing your torso

---

🔥 ③ Execution
Repeat the same path without momentum. Reduce load if you wobble.
Set the line of pull, move through the elbows, return without letting the stack yank you.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Letting the cable tow the torso
If position breaks, cut the load.
❌ Skipping height setup
If position breaks, cut the load.
❌ Dumping the stack on the return
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Use the guided path on Welliv Dual Assist Chin Dip (TWMA-308). Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Let the knee pad unload bodyweight and focus on the target move. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Welliv Dual Assist Chin Dip (TWMA-308)","manufacturer":"DRAX","productSeries":"Welliv Dual","sourceUrl":"https://www.draxfit.com/en/strength/welliv-pro-dual-assist-chin-dip","verifiedStructure":"Welliv Dual Assist Chin/Dip(TWMA-308)로 풀업·딥 겸용 어시스트입니다.","verifiedAdjustments":"무릎 패드, 친업/딥 그립, 스택 핀","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '어시스트 풀업 / 딥';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Angled Smith Machine (TWF-701) / Right Angled Smith (TWF-702-1) / Multi Rack Smith · TWF Free Weight

🎯 ONE KEY CUE
🔥 "바가 가이드에 붙게 수직 궤적으로 밀거나 스쿼트"

TWF-701 Angled Smith·TWF-702-1 Right Angled·Multi Rack 내장 스미스. DRAX line 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
바 후크, 세이프티, 풋 지지(스탠스), 플레이트를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
가이드 바를 따라 올렸다 내려 후크에 걸기.
반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 세이프티 없이 한계 중량을 거는
자세가 무너지면 무게를 낮추세요.
❌ 안전바 높이를 안 맞추고 올리는 것
세트 전에 안전 위치부터 다시 맞추세요.
❌ 좌우 원판 불균형
자세가 무너지면 무게를 낮추세요.
❌ 바 경로와 발 위치가 어긋나는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 해머 스트렝스 랙/스미스는 “바 경로에 몸을 맞추는” 장비입니다. 중량보다 안전바·시작 높이·발 위치를 먼저 고정하세요.

---

🎯 MACHINE FIT CHECK
🟢 안전바 → 가동범위에 맞춤
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"바가 가이드에 붙게 수직 궤적으로 밀거나 스쿼트. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Angled Smith Machine (TWF-701) / Right Angled Smith (TWF-702-1) / Multi Rack Smith · TWF Free Weight

🎯 ONE KEY CUE
🔥 "Keep the bar on the guides for a vertical press or squat path"

TWF-701 Angled Smith·TWF-702-1 Right Angled·Multi Rack 내장 스미스입니다. Lean into the DRAX line design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
⚙️ Adjustments
Check 바 후크, 세이프티, 풋 지지(스탠스), 플레이트.

---

💪 ② Start position
Set bar and safety height, then center yourself in the rack.
Check only this:
👉 Safeties match your range

---

🔥 ③ Execution
Repeat the same path without momentum. Reduce load if you wobble.
Stay centered on the bar path and control every rep into the safeties.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Loading before setting safeties
Reset safety height before the set.
❌ Uneven plates
Match both sides, then confirm with a light set.
❌ Feet fighting the bar path
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Hammer Strength racks/Smith units reward lining your body up to the bar path. Safeties and foot placement beat ego loading.

---

🎯 MACHINE FIT CHECK
🟢 Safeties → match your range
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the bar on the guides for a vertical press or squat path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Angled Smith Machine (TWF-701) / Right Angled Smith (TWF-702-1) / Multi Rack Smith","manufacturer":"DRAX","productSeries":"TWF Free Weight","sourceUrl":"https://www.draxfit.co.uk/twf-703-all-in-one-trainer","verifiedStructure":"TWF-701 Angled Smith·TWF-702-1 Right Angled·Multi Rack 내장 스미스입니다.","verifiedAdjustments":"바 후크, 세이프티, 풋 지지(스탠스), 플레이트","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '스미스 머신';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Power Rack (TWF-302) · TWF Free Weight

🎯 ONE KEY CUE
🔥 "세이프티를 가동 범위 바로 아래에 맞추고 수행"

DRAX Power Rack(TWF-302)로 J훅·세이프티 파워 랙. DRAX line 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
J훅 높이, 세이프티, 바 위치를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
랙 안에서 스쿼트·프레스 궤적으로 바를 올리고 내리기.
반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 핀 높이를 무시하고 불안정한 스탠스로 드는
자세가 무너지면 무게를 낮추세요.
❌ 안전바 높이를 안 맞추고 올리는 것
세트 전에 안전 위치부터 다시 맞추세요.
❌ 좌우 원판 불균형
자세가 무너지면 무게를 낮추세요.
❌ 바 경로와 발 위치가 어긋나는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 해머 스트렝스 랙/스미스는 “바 경로에 몸을 맞추는” 장비입니다. 중량보다 안전바·시작 높이·발 위치를 먼저 고정하세요.

---

🎯 MACHINE FIT CHECK
🟢 안전바 → 가동범위에 맞춤
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"세이프티를 가동 범위 바로 아래에 맞추고 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Power Rack (TWF-302) · TWF Free Weight

🎯 ONE KEY CUE
🔥 "Set safeties just below the working range, then lift"

DRAX Power Rack(TWF-302)로 J훅·세이프티 파워 랙입니다. Lean into the DRAX line design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
⚙️ Adjustments
Check J훅 높이, 세이프티, 바 위치.

---

💪 ② Start position
Set bar and safety height, then center yourself in the rack.
Check only this:
👉 Safeties match your range

---

🔥 ③ Execution
Repeat the same path without momentum. Reduce load if you wobble.
Stay centered on the bar path and control every rep into the safeties.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Loading before setting safeties
Reset safety height before the set.
❌ Uneven plates
Match both sides, then confirm with a light set.
❌ Feet fighting the bar path
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Hammer Strength racks/Smith units reward lining your body up to the bar path. Safeties and foot placement beat ego loading.

---

🎯 MACHINE FIT CHECK
🟢 Safeties → match your range
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set safeties just below the working range, then lift. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Power Rack (TWF-302)","manufacturer":"DRAX","productSeries":"TWF Free Weight","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"DRAX Power Rack(TWF-302)로 J훅·세이프티 파워 랙입니다.","verifiedAdjustments":"J훅 높이, 세이프티, 바 위치","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '파워 랙';


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ DRAX — Half Rack (TWF-308) · TWF Free Weight

🎯 ONE KEY CUE
🔥 "전면 개방을 활용해 스탠스를 잡고 안정적으로 들기"

DRAX Half Rack(TWF-308)로 하프 랙·옵션 데드리프트 슬링. DRAX line 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
J훅 높이, 세이프티, 바 위치를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
하프 랙에서 바를 언랙해 올리고 다시 랙에 걸기.
반동 없이 같은 궤적을 반복하세요. 흔들리면 중량을 낮춥니다.

---

💥 ④ 최고 수축
목표 근육이 가장 조여지는 끝 지점에서 멈춥니다.
⏱️ 1초 STOP
튕기지 말고 그 지점에서 1초만 소유하세요. 무게를 놓는 순간이 아닙니다.

---

🐌 ⑤ 천천히 돌아오기
중량을 그냥 놓지 마세요.
2~3초 동안 통제하면서 복귀합니다.
시작 자세로 돌아갈 때도 같은 궤적을 유지하세요.

---

❌ 흔한 실수
❌ 바가 랙에서 멀어져 궤적이 흔들리는
자세가 무너지면 무게를 낮추세요.
❌ 안전바 높이를 안 맞추고 올리는 것
세트 전에 안전 위치부터 다시 맞추세요.
❌ 좌우 원판 불균형
자세가 무너지면 무게를 낮추세요.
❌ 바 경로와 발 위치가 어긋나는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 해머 스트렝스 랙/스미스는 “바 경로에 몸을 맞추는” 장비입니다. 중량보다 안전바·시작 높이·발 위치를 먼저 고정하세요.

---

🎯 MACHINE FIT CHECK
🟢 안전바 → 가동범위에 맞춤
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"전면 개방을 활용해 스탠스를 잡고 안정적으로 들기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ DRAX — Half Rack (TWF-308) · TWF Free Weight

🎯 ONE KEY CUE
🔥 "Use the open front for stance, then lift with control"

DRAX Half Rack(TWF-308)로 하프 랙·옵션 데드리프트 슬링입니다. Lean into the DRAX line design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
⚙️ Adjustments
Check J훅 높이, 세이프티, 바 위치.

---

💪 ② Start position
Set bar and safety height, then center yourself in the rack.
Check only this:
👉 Safeties match your range

---

🔥 ③ Execution
Repeat the same path without momentum. Reduce load if you wobble.
Stay centered on the bar path and control every rep into the safeties.

---

💥 ④ Peak contraction
Stop where the target muscle is most shortened.
⏱️ 1-second STOP
Own that position for one second. This is not where you dump the weight.

---

🐌 ⑤ Controlled return
Do not dump the load.
Take 2–3 seconds on the way back.
Return on the same path you pressed or pulled.

---

❌ Common mistakes
❌ Loading before setting safeties
Reset safety height before the set.
❌ Uneven plates
Match both sides, then confirm with a light set.
❌ Feet fighting the bar path
If position breaks, cut the load.

---

💡 MACHINE FIT PRO TIP
🔥 Hammer Strength racks/Smith units reward lining your body up to the bar path. Safeties and foot placement beat ego loading.

---

🎯 MACHINE FIT CHECK
🟢 Safeties → match your range
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Use the open front for stance, then lift with control. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Half Rack (TWF-308)","manufacturer":"DRAX","productSeries":"TWF Free Weight","sourceUrl":"https://www.draxfit.co.uk/drax-strength","verifiedStructure":"DRAX Half Rack(TWF-308)로 하프 랙·옵션 데드리프트 슬링입니다.","verifiedAdjustments":"J훅 높이, 세이프티, 바 위치","importedAt":"2026-08-20T04:44:49.246Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'DRAX'
  AND m.is_active = TRUE
  AND COALESCE(
    (
      SELECT st.name->>'ko'
      FROM standard_machine_types st
      WHERE st.id = m.standard_type_id
    ),
    m.name->>'ko'
  ) = '하프 랙';


DO $$
DECLARE
  updated_count INT;
BEGIN
  SELECT COUNT(*)::int INTO updated_count
  FROM machines m
  JOIN brands b ON b.id = m.brand_id
  WHERE b.code = 'DRAX'
    AND m.is_active = TRUE
    AND m.pro_tips IS NOT NULL
    AND m.pro_tips_meta IS NOT NULL
    AND m.pro_tips_meta->>'verificationStatus' IS NOT NULL
    AND (m.pro_tips->'ko'->>0) LIKE '%ONE KEY CUE%'
    AND (m.pro_tips->'ko'->>0) LIKE '%MACHINE FIT PRO TIP%'
    AND (m.pro_tips->'ko'->>0) NOT LIKE '%📋 검증 상태%';

  IF updated_count < 80 THEN
    RAISE EXCEPTION 'DRAX trainer PRO tips import incomplete: % / 80', updated_count;
  END IF;
END $$;
