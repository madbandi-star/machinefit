-- Import FREEMOTION MachineFit PRO tips (trainer coaching style).
-- Source: database/catalog/pro-tips/freemotion_pro_tips.csv
-- Backup previous pro_tips / pro_tips_meta before UPDATE.

CREATE TABLE IF NOT EXISTS _backup_freemotion_pro_tips_20260820 (
  machine_id UUID PRIMARY KEY,
  code TEXT,
  machine_name_ko TEXT,
  pro_tips JSONB,
  pro_tips_meta JSONB,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO _backup_freemotion_pro_tips_20260820 (machine_id, code, machine_name_ko, pro_tips, pro_tips_meta)
SELECT m.id,
       m.code,
       COALESCE(st.name->>'ko', m.name->>'ko'),
       m.pro_tips,
       m.pro_tips_meta
FROM machines m
JOIN brands b ON b.id = m.brand_id
LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
WHERE b.code = 'FREEMOTION'
  AND m.is_active = TRUE
ON CONFLICT (machine_id) DO NOTHING;


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES800 Chest Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 궤적에서 견갑을 붙인 채 손잡이를 가슴 중앙으로 밀기"

Freemotion EPIC Selectorized ES800 Chest Press. 수렴·독립 암 셀렉터 체스트 프레스. 좌우가 독립으로 움직이는 · 안쪽으로 모이는 · 셀렉터 스택 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 손잡이, 시작 위치, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 앞·안쪽으로 밀었다 천천히 복귀.
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES800 Chest Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC path, brace scapulae and press handles through center chest"

Freemotion EPIC Selectorized ES800 Chest Press. 수렴·독립 암 셀렉터 체스트 프레스입니다 Lean into the independent arms / converging path / selectorized stack / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 손잡이, 시작 위치, 중량. Confirm both sides start from the same position.

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
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES800 Chest Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC Selectorized ES800 Chest Press. 수렴·독립 암 셀렉터 체스트 프레스입니다","verifiedAdjustments":"시트, 손잡이, 시작 위치, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — EPIC Plate Loaded Incline Chest Press · EPIC Plate Loaded

🎯 ONE KEY CUE
🔥 "EPIC 인클라인에서 견갑을 고정하고 대각선 위로 밀기"

Freemotion EPIC Plate Loaded Incline Chest Press. 플레이트 로딩 · Plate Loaded 3-peg 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 손잡이, 중량을 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

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
❌ 양쪽 플레이트 무게를 다르게 올리는 것
양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.

---

💡 MACHINE FIT PRO TIP
🔥 EPIC Plate Loaded Incline Chest Press은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 인클라인에서 견갑을 고정하고 대각선 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — EPIC Plate Loaded Incline Chest Press · EPIC Plate Loaded

🎯 ONE KEY CUE
🔥 "On the EPIC incline, set the scapula and press upward on a diagonal"

Freemotion EPIC Plate Loaded Incline Chest Press입니다 Lean into the plate-loaded / Plate Loaded 3-peg design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 손잡이, 중량. Match plates on both sides — do not load one arm first.

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
🔥 EPIC Plate Loaded Incline Chest Press is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC incline, set the scapula and press upward on a diagonal. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"EPIC Plate Loaded Incline Chest Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Plate Loaded","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC Plate Loaded Incline Chest Press입니다","verifiedAdjustments":"시트, 시작 위치, 손잡이, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 디클라인 체스트 프레스

🎯 ONE KEY CUE
🔥 "EPIC 디클라인에서 하부 가슴을 향해 아래·앞으로 밀기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 중량을 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

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
❌ 양쪽 플레이트 무게를 다르게 올리는 것
양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "디클라인 체스트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 디클라인에서 하부 가슴을 향해 아래·앞으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Decline Chest Press

🎯 ONE KEY CUE
🔥 "On the EPIC decline, press down and forward toward the lower chest"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 중량. Match plates on both sides — do not load one arm first.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Decline Chest Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC decline, press down and forward toward the lower chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC Selectorized/Plate Loaded 카탈로그에 Decline Chest Press 전용 SKU가 없습니다","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES800 Chest Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 수렴 암으로 넓은 시작에서 중앙으로 모으며 밀기"

ES800은 converging independent arms로 컨버징 체스트 프레스 패턴. 안쪽으로 모이는 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 폭, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
양팔이 바깥에서 안쪽으로 모이며 프레스.
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
❌ 평행으로만 밀어 수렴 궤적을 무시하는
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

"EPIC 수렴 암으로 넓은 시작에서 중앙으로 모으며 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES800 Chest Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "Use the EPIC converging arms: start wide and press toward center"

ES800은 converging independent arms로 컨버징 체스트 프레스 패턴입니다 Lean into the converging path / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 폭, 손잡이, 중량.

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

"Use the EPIC converging arms: start wide and press toward center. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES800 Chest Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES800은 converging independent arms로 컨버징 체스트 프레스 패턴입니다","verifiedAdjustments":"시트, 시작 폭, 손잡이, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES800 Chest Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 독립 암으로 좌우를 같은 속도로 밀며 불균형 확인"

공식 Iso-Lateral SKU명은 없고 ES800 독립 암이 아이소래터럴 패턴에 해당합니다. 좌우가 독립으로 움직이는 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 손잡이, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 밀었다 천천히 복귀.
양쪽을 같은 속도로 움직이세요. 한쪽이 먼저 끝나면 무게를 더 올리기 전에 밸런스부터 잡습니다.

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
❌ 한쪽만 먼저 밀어 비대칭을 키우는
약한 쪽 속도에 강한 쪽을 맞추세요.
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES800 Chest Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "With EPIC independent arms, press both sides at the same speed"

공식 Iso-Lateral SKU명은 없고 ES800 독립 암이 아이소래터럴 패턴에 해당합니다 Lean into the independent arms / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 손잡이, 중량. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Pin back and pelvis to the pad with the handles at chest height.
Double-check both sides start at the same height.
Check only this:
👉 Back still on the pad

---

🔥 ③ Execution
Match left-right speed. If one side finishes early, fix balance before adding load.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES800 Chest Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"공식 Iso-Lateral SKU명은 없고 ES800 독립 암이 아이소래터럴 패턴에 해당합니다","verifiedAdjustments":"시트, 좌·우 시작, 손잡이, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — EPIC Plate Loaded Chest Press · EPIC Plate Loaded

🎯 ONE KEY CUE
🔥 "EPIC 플레이트로드에서 양쪽 중량을 맞추고 가슴 중앙으로 밀기"

Freemotion EPIC Plate Loaded Chest Press. 플레이트 로딩 · Plate Loaded 3-peg 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 양쪽 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 앞으로 밀었다 통제하며 복귀.
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
❌ 한쪽만 먼저 올려 궤적이 틀어지는
약한 쪽 속도에 강한 쪽을 맞추세요.
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
🔥 EPIC Plate Loaded Chest Press은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 플레이트로드에서 양쪽 중량을 맞추고 가슴 중앙으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — EPIC Plate Loaded Chest Press · EPIC Plate Loaded

🎯 ONE KEY CUE
🔥 "On the EPIC plate-loaded press, match plates and press through center chest"

Freemotion EPIC Plate Loaded Chest Press입니다 Lean into the plate-loaded / Plate Loaded 3-peg design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 양쪽 플레이트. Match plates on both sides — do not load one arm first.

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
🔥 EPIC Plate Loaded Chest Press is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC plate-loaded press, match plates and press through center chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"EPIC Plate Loaded Chest Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Plate Loaded","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC Plate Loaded Chest Press입니다","verifiedAdjustments":"시트, 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 펙덱에서 팔꿈치 각도를 유지한 채 가슴으로 모으기"

EPIC ES806 Pec Fly/Rear Delt의 펙 플라이 모드. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
양팔을 모아 조인 뒤 천천히 벌리기.
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
❌ 팔꿈치를 펴며 어깨로 끌어당기는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES806 Pec Fly/Rear Delt의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 펙덱에서 팔꿈치 각도를 유지한 채 가슴으로 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC pec deck, keep elbow angle steady and close through the chest"

EPIC ES806 Pec Fly/Rear Delt의 펙 플라이 모드입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작, 스택/중량.

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
🔥 Use the guided path on ES806 Pec Fly/Rear Delt. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC pec deck, keep elbow angle steady and close through the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES806 Pec Fly/Rear Delt","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES806 Pec Fly/Rear Delt의 펙 플라이 모드입니다","verifiedAdjustments":"시트, 암 시작, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 리버스 모드에서 가슴을 고정하고 팔을 뒤로 벌리며 수축"

ES806 리어 델트/리버스 펙덱 모드. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 모드, 암 시작, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔을 뒤로 벌렸다 천천히 앞으로 복귀.
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
❌ 승모로만 잡아채며 팔꿈치를 과도하게 구부리는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES806 Pec Fly/Rear Delt의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 리버스 모드에서 가슴을 고정하고 팔을 뒤로 벌리며 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "In EPIC reverse mode, brace the chest and open the arms for rear-delt squeeze"

ES806 리어 델트/리버스 펙덱 모드입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 모드, 암 시작, 스택/중량.

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
🔥 Use the guided path on ES806 Pec Fly/Rear Delt. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"In EPIC reverse mode, brace the chest and open the arms for rear-delt squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES806 Pec Fly/Rear Delt","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES806 리어 델트/리버스 펙덱 모드입니다","verifiedAdjustments":"시트, 모드, 암 시작, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 플라이 호를 크게 그리며 가슴 앞에서 모으기"

별도 Fly-only SKU 없이 ES806 Pec Fly가 플라이 머신 패턴. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
팔을 호를 그리며 모아 조인 뒤 벌리기.
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
❌ 팔꿈치를 펴고 어깨로만 당기는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES806 Pec Fly/Rear Delt의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 플라이 호를 크게 그리며 가슴 앞에서 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "Trace a wide EPIC fly arc and close in front of the chest"

별도 Fly-only SKU 없이 ES806 Pec Fly가 플라이 머신 패턴입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작, 스택/중량.
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
🔥 Use the guided path on ES806 Pec Fly/Rear Delt. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Trace a wide EPIC fly arc and close in front of the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES806 Pec Fly/Rear Delt","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"별도 Fly-only SKU 없이 ES806 Pec Fly가 플라이 머신 패턴입니다","verifiedAdjustments":"시트, 암 시작, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 딥 머신

🎯 ONE KEY CUE
🔥 "EPIC 딥에서 팔꿈치를 몸통 옆으로 붙인 채 아래로 누르기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 아래로 눌러 펴고 천천히 굴곡.
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
❌ 어깨를 으쓱하며 깊게만 내려가는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "딥 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 딥에서 팔꿈치를 몸통 옆으로 붙인 채 아래로 누르기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Dip Machine

🎯 ONE KEY CUE
🔥 "On the EPIC dip, keep elbows close to the torso and press down"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Dip Machine", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC dip, keep elbows close to the torso and press down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Seated Dip 전용 SKU가 없고 Dip-Chin Assist(ES812)만 있습니다","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 어시스트를 고정한 뒤 팔꿈치로 깊게 내려가기"

ES812 Dip-Chin Assist의 딥 모드입니다. 전용 Assist Dip 명칭 SKU는 없습니다. PRODIGY/FT/Assist 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
어시스트 중량, 무릎/발 패드, 손잡이를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
팔꿈치를 굽혀 내려갔다 펴며 올라오기.
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
❌ 무릎으로만 튕기며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES812 Dip-Chin Assist의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 어시스트를 고정한 뒤 팔꿈치로 깊게 내려가기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "Lock the EPIC assist, then descend with the elbows"

ES812 Dip-Chin Assist의 딥 모드입니다. 전용 Assist Dip 명칭 SKU는 없습니다 Lean into the PRODIGY/FT/Assist design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 어시스트 중량, 무릎/발 패드, 손잡이.
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
🔥 Use the guided path on ES812 Dip-Chin Assist. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lock the EPIC assist, then descend with the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES812 Dip-Chin Assist","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES812 Dip-Chin Assist의 딥 모드입니다. 전용 Assist Dip 명칭 SKU는 없습니다","verifiedAdjustments":"어시스트 중량, 무릎/발 패드, 손잡이","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 슈퍼 인클라인 프레스

🎯 ONE KEY CUE
🔥 "EPIC 높은 인클라인에서도 견갑을 고정하고 위·앞으로 밀기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 시작 각도, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
높은 각도에서 손잡이를 위·앞으로 밀었다 복귀.
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
❌ 허리를 들어 올리며 벤치프레스처럼 미는
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

"EPIC 높은 인클라인에서도 견갑을 고정하고 위·앞으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Super Incline Press

🎯 ONE KEY CUE
🔥 "Even on a steep EPIC incline, keep scapulae set and press up and forward"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 시작 각도, 중량.

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

"Even on a steep EPIC incline, keep scapulae set and press up and forward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Super Incline Press 전용 SKU가 없습니다","verifiedAdjustments":"시트, 손잡이, 시작 각도, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 랫풀에서 흉곽을 세운 채 바를 쇄골 쪽으로 당기기"

EPIC ES802 Lat Pulldown/High Row의 랫풀다운 모드. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 그립, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 아래로 당겼다 팔을 펴며 복귀.
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
❌ 허리를 과하게 젖히며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES802 Lat Pulldown/High Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 랫풀에서 흉곽을 세운 채 바를 쇄골 쪽으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC lat pulldown, lift the ribcage and pull the bar to the collarbone"

EPIC ES802 Lat Pulldown/High Row의 랫풀다운 모드입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 허벅지 패드, 그립, 스택/중량.

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
🔥 Use the guided path on ES802 Lat Pulldown/High Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC lat pulldown, lift the ribcage and pull the bar to the collarbone. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES802 Lat Pulldown/High Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES802 Lat Pulldown/High Row의 랫풀다운 모드입니다","verifiedAdjustments":"시트, 허벅지 패드, 그립, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 와이드 그립에서 팔꿈치를 옆구리로 끌어내리기"

와이드 전용 SKU 없이 ES802 랫풀다운 와이드 그립 패턴으로 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
와이드 그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 와이드 그립, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
넓은 그립으로 바를 쇄골 앞으로 당겼다 복귀.
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
❌ 바를 목 뒤로 무리하게 당기는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES802 Lat Pulldown/High Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 와이드 그립에서 팔꿈치를 옆구리로 끌어내리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC wide lat path, drive the elbows down to the sides"

와이드 전용 SKU 없이 ES802 랫풀다운 와이드 그립 패턴으로 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 허벅지 패드, 와이드 그립, 스택/중량.
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
🔥 Use the guided path on ES802 Lat Pulldown/High Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC wide lat path, drive the elbows down to the sides. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES802 Lat Pulldown/High Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"와이드 전용 SKU 없이 ES802 랫풀다운 와이드 그립 패턴으로 대응합니다","verifiedAdjustments":"시트, 허벅지 패드, 와이드 그립, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 프론트 풀다운에서 바가 얼굴 앞을 지나가게 수직으로 당기기"

프론트 풀다운 전용 SKU 없이 ES802 랫풀다운 전면 궤적. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 그립, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 쇄골 앞으로 당겼다 천천히 복귀.
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
❌ 상체를 뒤로 과도하게 눕히는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES802 Lat Pulldown/High Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 프론트 풀다운에서 바가 얼굴 앞을 지나가게 수직으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC front pulldown, pull vertically so the bar passes in front of the face"

프론트 풀다운 전용 SKU 없이 ES802 랫풀다운 전면 궤적입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 허벅지 패드, 그립, 스택/중량.
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
🔥 Use the guided path on ES802 Lat Pulldown/High Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC front pulldown, pull vertically so the bar passes in front of the face. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES802 Lat Pulldown/High Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"프론트 풀다운 전용 SKU 없이 ES802 랫풀다운 전면 궤적입니다","verifiedAdjustments":"시트, 허벅지 패드, 그립, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — EPIC Plate Loaded Lat Pull Down · EPIC Plate Loaded

🎯 ONE KEY CUE
🔥 "EPIC 독립 랫풀로 좌우를 같은 깊이로 당기며 불균형 확인"

셀렉터 Iso Lat Pulldown SKU는 없고 EPIC Plate Loaded Lat Pull Down 독립 암이 가깝습니다. 좌우가 독립으로 움직이는 · 플레이트 로딩 · 셀렉터 스택 · Plate Loaded 3-peg 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 스택/중량을 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 아래로 당겼다 복귀.
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
❌ 한쪽만 깊게 당겨 비대칭을 키우는
약한 쪽 속도에 강한 쪽을 맞추세요.
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — EPIC Plate Loaded Lat Pull Down · EPIC Plate Loaded

🎯 ONE KEY CUE
🔥 "With EPIC independent lat arms, pull both sides to the same depth"

셀렉터 Iso Lat Pulldown SKU는 없고 EPIC Plate Loaded Lat Pull Down 독립 암이 가깝습니다 Lean into the independent arms / plate-loaded / selectorized stack / Plate Loaded 3-peg design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 스택/중량. Match plates on both sides — do not load one arm first. Confirm both sides start from the same position.
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
❌ Loading unequal plates
Match both sides, then confirm with a light set.

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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"EPIC Plate Loaded Lat Pull Down","manufacturer":"Freemotion Fitness","productSeries":"EPIC Plate Loaded","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"셀렉터 Iso Lat Pulldown SKU는 없고 EPIC Plate Loaded Lat Pull Down 독립 암이 가깝습니다","verifiedAdjustments":"시트, 좌·우 시작, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 하이로우에서 팔꿈치를 높게 유지한 채 견갑을 모으며 당기기"

ES802의 High Row 모드. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이 높이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이 높이, 풋 지지, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 높은 궤적으로 몸통으로 당겼다 복귀.
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
❌ 이두로만 잡아채며 팔꿈치가 떨어지는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES802 Lat Pulldown/High Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 하이로우에서 팔꿈치를 높게 유지한 채 견갑을 모으며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC high row, keep elbows high and retract the scapulae"

ES802의 High Row 모드입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이 높이, 풋 지지, 스택/중량.

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
🔥 Use the guided path on ES802 Lat Pulldown/High Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC high row, keep elbows high and retract the scapulae. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES802 Lat Pulldown/High Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES802의 High Row 모드입니다","verifiedAdjustments":"시트, 손잡이 높이, 풋 지지, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 독립 하이로우로 좌우를 같은 각도로 당기며 등 중앙 수축"

아이소 하이로우 전용 SKU 없이 ES802 High Row 독립 암 패턴으로 둡니다. 좌우가 독립으로 움직이는 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 풋 지지, 스택/중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 높은 궤적으로 당겼다 복귀.
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
❌ 한쪽만 먼저 당겨 몸통이 돌아가는
약한 쪽 속도에 강한 쪽을 맞추세요.
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES802 Lat Pulldown/High Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "With EPIC independent high-row arms, match angles and squeeze mid-back"

아이소 하이로우 전용 SKU 없이 ES802 High Row 독립 암 패턴으로 둡니다 Lean into the independent arms / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 풋 지지, 스택/중량. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES802 Lat Pulldown/High Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"아이소 하이로우 전용 SKU 없이 ES802 High Row 독립 암 패턴으로 둡니다","verifiedAdjustments":"시트, 좌·우 시작, 풋 지지, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 시티드 로우에서 풋 지지로 고정한 뒤 팔꿈치를 옆구리로 당기기"

EPIC ES817 Seated Row. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 가슴 패드(해당 시), 스택/중량을 확인하세요.

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
🔥 ES817 Seated Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 시티드 로우에서 풋 지지로 고정한 뒤 팔꿈치를 옆구리로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC seated row, brace on the foot supports then pull elbows to the sides"

EPIC ES817 Seated Row입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 가슴 패드(해당 시), 스택/중량.

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
🔥 Use the guided path on ES817 Seated Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC seated row, brace on the foot supports then pull elbows to the sides. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES817 Seated Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES817 Seated Row입니다","verifiedAdjustments":"시트, 풋 지지, 가슴 패드(해당 시), 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 로우에서 가슴을 세운 채 손잡이를 몸통으로 당기기"

로우 머신 범주명은 ES817 Seated Row로 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 손잡이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 당겼다 천천히 펴며 복귀.
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
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES817 Seated Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 로우에서 가슴을 세운 채 손잡이를 몸통으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC row, keep the chest tall and pull handles to the torso"

로우 머신 범주명은 ES817 Seated Row로 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 손잡이, 스택/중량.
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
🔥 Use the guided path on ES817 Seated Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC row, keep the chest tall and pull handles to the torso. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES817 Seated Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"로우 머신 범주명은 ES817 Seated Row로 대응합니다","verifiedAdjustments":"시트, 풋 지지, 손잡이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 로우 로우에서 낮은 궤적으로 팔꿈치를 뒤로 보내며 당기기"

로우 로우 전용 SKU 없이 ES817 낮은 시티드 로우 궤적. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 손잡이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
낮은 손잡이를 몸통으로 당겼다 복귀.
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
❌ 상체를 뒤로 과도하게 눕히는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES817 Seated Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 로우 로우에서 낮은 궤적으로 팔꿈치를 뒤로 보내며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC low row, pull on a low path and drive elbows back"

로우 로우 전용 SKU 없이 ES817 낮은 시티드 로우 궤적입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 손잡이, 스택/중량.
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
🔥 Use the guided path on ES817 Seated Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC low row, pull on a low path and drive elbows back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES817 Seated Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"로우 로우 전용 SKU 없이 ES817 낮은 시티드 로우 궤적입니다","verifiedAdjustments":"시트, 풋 지지, 손잡이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 미드 로우에서 팔꿈치를 몸통 높이로 유지하며 견갑 모으기"

미드 로우 전용 SKU 없이 ES817 중간 높이 로우 패턴. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이 높이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 손잡이 높이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 몸통 중간 높이로 당겼다 복귀.
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
❌ 팔꿈치를 너무 내려 광배만 쓰는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES817 Seated Row의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 미드 로우에서 팔꿈치를 몸통 높이로 유지하며 견갑 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC mid row, keep elbows at torso height and retract the scapulae"

미드 로우 전용 SKU 없이 ES817 중간 높이 로우 패턴입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 손잡이 높이, 스택/중량.
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
🔥 Use the guided path on ES817 Seated Row. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC mid row, keep elbows at torso height and retract the scapulae. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES817 Seated Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"미드 로우 전용 SKU 없이 ES817 중간 높이 로우 패턴입니다","verifiedAdjustments":"시트, 풋 지지, 손잡이 높이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 독립 로우로 좌우를 같은 속도로 당기며 불균형 확인"

공식 Iso Row SKU 없이 ES817 독립 핸들 패턴으로 둡니다. 좌우가 독립으로 움직이는 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 풋 지지, 스택/중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 당겼다 복귀.
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
❌ 강한 쪽만 먼저 당겨 몸통이 틀어지는
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "With EPIC independent row arms, pull both sides at the same speed"

공식 Iso Row SKU 없이 ES817 독립 핸들 패턴으로 둡니다 Lean into the independent arms / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 풋 지지, 스택/중량. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES817 Seated Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"공식 Iso Row SKU 없이 ES817 독립 핸들 패턴으로 둡니다","verifiedAdjustments":"시트, 좌·우 시작, 풋 지지, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 독립 로우 로우에서 낮은 궤적으로 좌우를 대칭으로 당기기"

아이소 로우 로우 전용 SKU 없이 ES817 기반 부분 대응. 좌우가 독립으로 움직이는 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 풋 지지, 스택/중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
낮은 궤적으로 각 팔을 당겼다 복귀.
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
❌ 한쪽만 깊게 당겨 골반이 돌아가는
약한 쪽 속도에 강한 쪽을 맞추세요.
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC independent low row, pull both sides symmetrically on a low path"

아이소 로우 로우 전용 SKU 없이 ES817 기반 부분 대응입니다 Lean into the independent arms / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 풋 지지, 스택/중량. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES817 Seated Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"아이소 로우 로우 전용 SKU 없이 ES817 기반 부분 대응입니다","verifiedAdjustments":"시트, 좌·우 시작, 풋 지지, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 체스트 서포트에서 가슴 패드를 밀착하고 팔꿈치만으로 당기기"

체스트 서포트 전용 SKU 없이 ES817 시티드 로우가 가장 가깝습니다. 가슴 지지 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트/흉부 패드, 풋 지지, 손잡이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 몸통으로 당겼다 천천히 복귀.
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
❌ 패드를 뜨고 상체로 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES817 Seated Row · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC chest-supported row, pin the chest pad and pull with the elbows"

체스트 서포트 전용 SKU 없이 ES817 시티드 로우가 가장 가깝습니다 Lean into the chest-supported / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트/흉부 패드, 풋 지지, 손잡이, 스택/중량.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES817 Seated Row","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"체스트 서포트 전용 SKU 없이 ES817 시티드 로우가 가장 가깝습니다","verifiedAdjustments":"시트/흉부 패드, 풋 지지, 손잡이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — T바 로우 머신

🎯 ONE KEY CUE
🔥 "EPIC T바 패턴에서 가슴을 붙인 채 바를 배꼽 쪽으로 당기기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
흉부 패드, 풋 지지, 그립, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 몸통으로 당겼다 통제하며 복귀.
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
❌ 허리를 둥글게 말고 들어 올리는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "T바 로우 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC T바 패턴에서 가슴을 붙인 채 바를 배꼽 쪽으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — T-Bar Row

🎯 ONE KEY CUE
🔥 "On a EPIC T-bar pattern, keep the chest set and pull the bar toward the navel"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 흉부 패드, 풋 지지, 그립, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "T-Bar Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On a EPIC T-bar pattern, keep the chest set and pull the bar toward the navel. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 T-Bar Row 전용 SKU가 없습니다","verifiedAdjustments":"흉부 패드, 풋 지지, 그립, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 풀오버

🎯 ONE KEY CUE
🔥 "EPIC 풀오버에서 갈비뼈를 내린 채 팔을 호를 그리며 내리기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
팔 패드를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔 패드/손잡이, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 호를 그리며 내렸다 천천히 복귀.
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
❌ 허리를 과하게 아치하며 어깨만 쓰는
자세가 무너지면 무게를 낮추세요.
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

"EPIC 풀오버에서 갈비뼈를 내린 채 팔을 호를 그리며 내리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Pullover

🎯 ONE KEY CUE
🔥 "On the EPIC pullover, keep the ribs down and arc the arms down"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔 패드/손잡이, 스택/중량.

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

"On the EPIC pullover, keep the ribs down and arc the arms down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Pullover 전용 SKU가 없습니다","verifiedAdjustments":"시트, 팔 패드/손잡이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 어시스트를 고정한 뒤 가슴을 바 쪽으로 당기기"

ES812 Dip-Chin Assist의 친업/풀업 모드. PRODIGY/FT/Assist 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
어시스트 중량, 무릎/발 패드, 그립을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
몸을 위로 당겼다 천천히 내려오기.
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
❌ 반동으로 몸을 흔들며 턱만 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES812 Dip-Chin Assist의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 어시스트를 고정한 뒤 가슴을 바 쪽으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "Set the EPIC assist, then pull the chest toward the bar"

ES812 Dip-Chin Assist의 친업/풀업 모드입니다 Lean into the PRODIGY/FT/Assist design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 어시스트 중량, 무릎/발 패드, 그립.
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
🔥 Use the guided path on ES812 Dip-Chin Assist. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set the EPIC assist, then pull the chest toward the bar. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES812 Dip-Chin Assist","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES812 Dip-Chin Assist의 친업/풀업 모드입니다","verifiedAdjustments":"어시스트 중량, 무릎/발 패드, 그립","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES807 Shoulder Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 숄더 프레스에서 갈비뼈를 내린 채 손잡이를 머리 위로 밀기"

EPIC ES807 Shoulder Press. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 시작 위치, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
손잡이를 위로 밀었다 천천히 복귀.
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
❌ 허리를 과하게 젖히며 미는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES807 Shoulder Press의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 숄더 프레스에서 갈비뼈를 내린 채 손잡이를 머리 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES807 Shoulder Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC shoulder press, keep ribs down and press handles overhead"

EPIC ES807 Shoulder Press입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 시작 위치, 스택/중량.

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
🔥 Use the guided path on ES807 Shoulder Press. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC shoulder press, keep ribs down and press handles overhead. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES807 Shoulder Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES807 Shoulder Press입니다","verifiedAdjustments":"시트, 손잡이, 시작 위치, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES807 Shoulder Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 독립 숄더로 좌우를 같은 높이로 밀며 불균형 확인"

Iso Shoulder 전용 SKU 없이 ES807 독립 암 패턴. 좌우가 독립으로 움직이는 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 스택/중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 위로 밀었다 복귀.
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
❌ 한쪽만 높게 밀어 몸통이 기울어지는
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES807 Shoulder Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "With EPIC independent shoulder arms, press both sides to the same height"

Iso Shoulder 전용 SKU 없이 ES807 독립 암 패턴입니다 Lean into the independent arms / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 스택/중량. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES807 Shoulder Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Iso Shoulder 전용 SKU 없이 ES807 독립 암 패턴입니다","verifiedAdjustments":"시트, 좌·우 시작, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 플레이트로드 숄더 프레스

🎯 ONE KEY CUE
🔥 "EPIC 플레이트로드 숄더에서 양쪽 플레이트를 맞추고 머리 위로 밀기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 양쪽 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
손잡이를 위로 밀었다 통제하며 복귀.
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
❌ 한쪽만 먼저 올려 궤적이 틀어지는
약한 쪽 속도에 강한 쪽을 맞추세요.
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "플레이트로드 숄더 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 플레이트로드 숄더에서 양쪽 플레이트를 맞추고 머리 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Plate-Loaded Shoulder Press

🎯 ONE KEY CUE
🔥 "On the EPIC plate-loaded shoulder press, match plates and press overhead"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 양쪽 플레이트. Match plates on both sides — do not load one arm first.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Plate-Loaded Shoulder Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC plate-loaded shoulder press, match plates and press overhead. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC Plate Loaded에 Shoulder Press 전용 SKU가 공개 목록에 없습니다","verifiedAdjustments":"시트, 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES816 Lateral Raise · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 레터럴에서 팔꿈치를 살짝 굽힌 채 옆·위로 들기"

EPIC ES816 Lateral Raise. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔을 옆으로 들었다 천천히 내리기.
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
❌ 승모로 으쓱하며 너무 높이 올리는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES816 Lateral Raise의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 레터럴에서 팔꿈치를 살짝 굽힌 채 옆·위로 들기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES816 Lateral Raise · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC lateral raise, keep a soft elbow and lift out and up"

EPIC ES816 Lateral Raise입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 패드, 스택/중량.

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
🔥 Use the guided path on ES816 Lateral Raise. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC lateral raise, keep a soft elbow and lift out and up. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES816 Lateral Raise","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES816 Lateral Raise입니다","verifiedAdjustments":"시트, 암 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES816 Lateral Raise · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 머신 레터럴에서 어깨 높이까지만 올리고 정지 후 내리기"

ES816이 머신 레터럴 레이즈. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
패드가 옆·위로 올라갔다 천천히 복귀.
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
❌ 반동으로 팔을 튕겨 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES816 Lateral Raise의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 머신 레터럴에서 어깨 높이까지만 올리고 정지 후 내리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES816 Lateral Raise · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC machine lateral, lift only to shoulder height, pause, then lower"

ES816이 머신 레터럴 레이즈입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 패드, 스택/중량.

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
🔥 Use the guided path on ES816 Lateral Raise. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC machine lateral, lift only to shoulder height, pause, then lower. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES816 Lateral Raise","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES816이 머신 레터럴 레이즈입니다","verifiedAdjustments":"시트, 암 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 리어 델트에서 상체를 고정하고 팔을 뒤로 벌리며 수축"

리어 델트 단독 SKU 없이 ES806 Rear Delt 모드. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔을 뒤로 벌렸다 천천히 복귀.
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
❌ 승모로만 잡아채는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES806 Pec Fly/Rear Delt의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 리어 델트에서 상체를 고정하고 팔을 뒤로 벌리며 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES806 Pec Fly/Rear Delt · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC rear delt, brace the torso and open the arms back into a squeeze"

리어 델트 단독 SKU 없이 ES806 Rear Delt 모드입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작, 스택/중량.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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
🔥 Use the guided path on ES806 Pec Fly/Rear Delt. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC rear delt, brace the torso and open the arms back into a squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES806 Pec Fly/Rear Delt","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"리어 델트 단독 SKU 없이 ES806 Rear Delt 모드입니다","verifiedAdjustments":"시트, 암 시작, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 프론트 레이즈

🎯 ONE KEY CUE
🔥 "EPIC 패턴에서 갈비뼈를 내린 채 팔을 앞·위로 들기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트/스탠스, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔을 앞으로 들었다 천천히 내리기.
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
❌ 허리를 젖히며 반동으로 올리는
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

"EPIC 패턴에서 갈비뼈를 내린 채 팔을 앞·위로 들기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Front Raise

🎯 ONE KEY CUE
🔥 "In a EPIC pattern, keep ribs down and raise the arms forward and up"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트/스탠스, 손잡이, 중량.

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

"In a EPIC pattern, keep ribs down and raise the arms forward and up. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Front Raise 전용 SKU가 없습니다","verifiedAdjustments":"시트/스탠스, 손잡이, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 업라이트 로우

🎯 ONE KEY CUE
🔥 "EPIC 패턴에서 팔꿈치를 손보다 높게 유지하며 당기기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
그립 폭를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
스탠스, 그립 폭, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
손잡이를 쇄골 쪽으로 당겼다 복귀.
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
❌ 손목만 끌어올려 어깨를 으쓱하는
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

"EPIC 패턴에서 팔꿈치를 손보다 높게 유지하며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Upright Row

🎯 ONE KEY CUE
🔥 "In a EPIC upright-row pattern, keep elbows higher than the hands"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 스탠스, 그립 폭, 중량.

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

"In a EPIC upright-row pattern, keep elbows higher than the hands. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Upright Row 전용 SKU가 없습니다","verifiedAdjustments":"스탠스, 그립 폭, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 로테이터 머신

🎯 ONE KEY CUE
🔥 "EPIC 로테이터에서 팔꿈치를 옆구리에 붙인 채 천천히 회전"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔뚝을 안·밖으로 회전했다 복귀.
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

"EPIC 로테이터에서 팔꿈치를 옆구리에 붙인 채 천천히 회전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Rotator Machine

🎯 ONE KEY CUE
🔥 "On the EPIC rotator, pin elbows to the sides and rotate slowly"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 스택/중량.

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

"On the EPIC rotator, pin elbows to the sides and rotate slowly. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Rotator Cuff 전용 SKU가 없습니다(ES818은 Torso Rotation)","verifiedAdjustments":"시트, 팔꿈치 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES807 Shoulder Press / ES816 Lateral Raise · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 복합 모드를 확인한 뒤 프레스와 레이즈를 분리해 수행"

단일 복합 SKU는 없고 ES807·ES816을 숄더 프레스/레터럴 조합으로 둡니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
모드, 시트, 손잡이/패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
선택한 모드의 궤적만 끝까지 수행.
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
❌ 모드를 섞어 한 세트에 두 동작을 우겨 넣는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES807 Shoulder Press / ES816 Lateral Raise의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 복합 모드를 확인한 뒤 프레스와 레이즈를 분리해 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES807 Shoulder Press / ES816 Lateral Raise · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "Confirm the EPIC combo mode, then train press and raise as separate sets"

단일 복합 SKU는 없고 ES807·ES816을 숄더 프레스/레터럴 조합으로 둡니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 모드, 시트, 손잡이/패드, 스택/중량.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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
🔥 Use the guided path on ES807 Shoulder Press / ES816 Lateral Raise. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Confirm the EPIC combo mode, then train press and raise as separate sets. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES807 Shoulder Press / ES816 Lateral Raise","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"단일 복합 SKU는 없고 ES807·ES816을 숄더 프레스/레터럴 조합으로 둡니다","verifiedAdjustments":"모드, 시트, 손잡이/패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES804 Leg Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 레그 프레스에서 발바닥 전체를 붙인 채 무릎을 밀었다 제어하며 굽히기"

EPIC ES804 Leg Press. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
등판, 발판 위치, 안전장치, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발판을 밀어 신전했다가 통제하며 굴곡으로 복귀.
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
❌ 무릎을 안쪽으로 모으며 반동으로 미는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES804 Leg Press의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES804 Leg Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC leg press, keep full foot contact and press then control the bend"

EPIC ES804 Leg Press입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 등판, 발판 위치, 안전장치, 스택/중량.

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
🔥 Use the guided path on ES804 Leg Press. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES804 Leg Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES804 Leg Press입니다","verifiedAdjustments":"등판, 발판 위치, 안전장치, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES804 Leg Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 45도 레그 프레스에서 허리를 붙여 밀고 무릎이 발끝 방향을 유지"

45도 전용 SKU명 없이 ES804 Leg Press가 경사 레그 프레스 계열. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
등판, 발판, 시작 위치, 양쪽 플레이트를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발판을 밀어 올렸다 무릎이 과하게 모이지 않게 복귀.
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
❌ 엉덩이가 뜨며 요추만 버티는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES804 Leg Press의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES804 Leg Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC 45° leg press, keep the low back set and track knees over toes"

45도 전용 SKU명 없이 ES804 Leg Press가 경사 레그 프레스 계열입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 등판, 발판, 시작 위치, 양쪽 플레이트.
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
🔥 Use the guided path on ES804 Leg Press. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES804 Leg Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"45도 전용 SKU명 없이 ES804 Leg Press가 경사 레그 프레스 계열입니다","verifiedAdjustments":"등판, 발판, 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES804 Leg Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 수평 레그 프레스에서 시트에 골반을 고정하고 수평으로 밀기"

수평 전용 SKU 없이 ES804를 수평 레그 프레스 패턴으로 부분 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
수평 궤적에 맞춰 발판 중앙에 발을 안정적으로 두세요. 무릎·발끝 방향을 맞춥니다.
⚙️ 조절 포인트
등판, 발판, 스택/캐리지를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발판을 수평으로 밀었다 천천히 복귀.
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
❌ 발판 위쪽에만 올려 엉덩이가 말리는
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES804 Leg Press · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC horizontal leg press, lock the pelvis to the seat and press horizontally"

수평 전용 SKU 없이 ES804를 수평 레그 프레스 패턴으로 부분 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Center the feet on the horizontal path and keep knees tracking with toes.
⚙️ Adjustments
Check 등판, 발판, 스택/캐리지.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES804 Leg Press","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"수평 전용 SKU 없이 ES804를 수평 레그 프레스 패턴으로 부분 대응합니다","verifiedAdjustments":"등판, 발판, 스택/캐리지","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 핵 스쿼트

🎯 ONE KEY CUE
🔥 "EPIC 핵 스쿼트에서 등판에 등을 붙인 채 발뒤꿈치로 밀어 오르기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨 패드, 발판 각도, 안전장치, 플레이트를 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
앉았다 발뒤꿈치로 밀어 일어서기.
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
❌ 무릎만 앞으로 보내며 깊이를 포기하는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "핵 스쿼트"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Hack Squat

🎯 ONE KEY CUE
🔥 "On the EPIC hack squat, keep the back on the pad and drive through the heels"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨 패드, 발판 각도, 안전장치, 플레이트.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Hack Squat", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Hack Squat 전용 SKU가 없습니다","verifiedAdjustments":"어깨 패드, 발판 각도, 안전장치, 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 스쿼트 프레스

🎯 ONE KEY CUE
🔥 "EPIC 스쿼트 프레스에서 발 위치를 고정하고 무릎·엉덩이를 함께 펴기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨/등 패드, 발판, 안전장치, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
앉았다 발판을 밀어 일어서기.
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
❌ 상체를 앞으로 숙이며 허리를 둥글게 만드는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "스쿼트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Squat Press

🎯 ONE KEY CUE
🔥 "On the EPIC squat press, fix foot placement and extend knees and hips together"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨/등 패드, 발판, 안전장치, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Squat Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Squat Press 전용 SKU가 없습니다","verifiedAdjustments":"어깨/등 패드, 발판, 안전장치, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 벨트 스쿼트

🎯 ONE KEY CUE
🔥 "EPIC 벨트 스쿼트에서 벨트로 하중을 받고 상체를 세운 채 앉았다 일어나기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
벨트 사이즈, 발판, 레버/케이블, 플레이트를 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
벨트를 차고 앉았다 일어서기.
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
❌ 벨트가 흘러내리며 허리를 숙이는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "벨트 스쿼트"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Belt Squat

🎯 ONE KEY CUE
🔥 "On a EPIC belt squat pattern, load the belt and squat with a tall torso"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 벨트 사이즈, 발판, 레버/케이블, 플레이트.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Belt Squat", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Belt Squat 전용 SKU가 없습니다","verifiedAdjustments":"벨트 사이즈, 발판, 레버/케이블, 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES801 Leg Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 레그 익스텐션에서 무릎 축을 맞춘 뒤 발끝을 들어 펴기"

EPIC ES801 Leg Extension. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 백패드, 발목 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발목을 앞으로 펴고 천천히 굴곡으로 복귀.
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
❌ 엉덩이를 들며 반동으로 펴는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES801 Leg Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES801 Leg Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC leg extension, align the knee axis then extend by lifting the toes"

EPIC ES801 Leg Extension입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 백패드, 발목 패드, 스택/중량.

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
🔥 Use the guided path on ES801 Leg Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES801 Leg Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES801 Leg Extension입니다","verifiedAdjustments":"시트, 백패드, 발목 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES803 Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 시티드 레그 컬에서 허벅지 패드를 고정하고 발뒤꿈치를 엉덩이 쪽으로 당기기"

EPIC ES803 Leg Curl(시티드 레그 컬). EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 발목 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
무릎을 굽혀 당겼다 천천히 펴기.
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
❌ 허리를 뒤로 젖히며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES803 Leg Curl의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES803 Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC seated leg curl, lock the thigh pad and curl the heels toward the glutes"

EPIC ES803 Leg Curl(시티드 레그 컬)입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 허벅지 패드, 발목 패드, 스택/중량.

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
🔥 Use the guided path on ES803 Leg Curl. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES803 Leg Curl","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES803 Leg Curl(시티드 레그 컬)입니다","verifiedAdjustments":"시트, 허벅지 패드, 발목 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES814 Prone Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 라잉 레그 컬에서 골반을 패드에 붙인 채 발뒤꿈치를 당기기"

EPIC ES814 Prone Leg Curl. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
골반 패드, 발목 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발뒤꿈치를 엉덩이로 당겼다 천천히 펴기.
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
❌ 엉덩이를 들며 요추로 당기는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES814 Prone Leg Curl의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES814 Prone Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC lying leg curl, keep the pelvis on the pad and curl the heels"

EPIC ES814 Prone Leg Curl입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 골반 패드, 발목 패드, 스택/중량.

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
🔥 Use the guided path on ES814 Prone Leg Curl. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES814 Prone Leg Curl","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES814 Prone Leg Curl입니다","verifiedAdjustments":"골반 패드, 발목 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES803 Leg Curl / ES814 Prone Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 스탠딩 레그 컬에서 지지 다리를 고정하고 작업 다리만 굽히기"

스탠딩 전용 SKU 없이 ES803/ES814로 부분 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
힙/골반 패드, 발목 패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
작업 다리 발뒤꿈치를 당겼다 천천히 펴기.
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
❌ 상체를 숙이며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES803 Leg Curl / ES814 Prone Leg Curl의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES803 Leg Curl / ES814 Prone Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC standing leg curl, brace the support leg and curl only the working leg"

스탠딩 전용 SKU 없이 ES803/ES814로 부분 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 힙/골반 패드, 발목 패드, 스택/중량.
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
🔥 Use the guided path on ES803 Leg Curl / ES814 Prone Leg Curl. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES803 Leg Curl / ES814 Prone Leg Curl","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"스탠딩 전용 SKU 없이 ES803/ES814로 부분 대응합니다","verifiedAdjustments":"힙/골반 패드, 발목 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES803 Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 싱글 레그 컬에서 한 다리만으로 같은 가동범위를 유지하며 당기기"

싱글 레그 전용 SKU 없이 ES803 편측 작업으로 둡니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트/패드, 발목 패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
한 다리로 컬했다 천천히 펴기.
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
❌ 약한 쪽 가동범위를 줄여 버리는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES803 Leg Curl의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES803 Leg Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC single-leg curl, keep the same ROM on one leg"

싱글 레그 전용 SKU 없이 ES803 편측 작업으로 둡니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트/패드, 발목 패드, 스택/중량.
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
🔥 Use the guided path on ES803 Leg Curl. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES803 Leg Curl","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"싱글 레그 전용 SKU 없이 ES803 편측 작업으로 둡니다","verifiedAdjustments":"시트/패드, 발목 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 힙 쓰러스트에서 갈비뼈를 내린 채 엉덩이를 끝까지 밀어 수축"

힙 쓰러스트 전용 SKU 없이 ES820 Glute가 힙 신전 패턴. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
등/힙 패드, 발 위치, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 위로 밀어 조인 뒤 천천히 내리기.
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
❌ 허리를 과하게 아치하며 미는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES820 Glute의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 힙 쓰러스트에서 갈비뼈를 내린 채 엉덩이를 끝까지 밀어 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC hip thrust, keep ribs down and drive the hips to a full squeeze"

힙 쓰러스트 전용 SKU 없이 ES820 Glute가 힙 신전 패턴입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 등/힙 패드, 발 위치, 스택/중량.
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
🔥 Use the guided path on ES820 Glute. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC hip thrust, keep ribs down and drive the hips to a full squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES820 Glute","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"힙 쓰러스트 전용 SKU 없이 ES820 Glute가 힙 신전 패턴입니다","verifiedAdjustments":"등/힙 패드, 발 위치, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 글루트 드라이브에서 발뒤꿈치로 밀어 엉덩이만으로 신전"

글루트 드라이브 전용명 없이 ES820 Glute로 부분 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트/패드, 발 위치, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 밀어 신전했다 통제하며 복귀.
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
❌ 무릎만 펴며 허벅지 앞쪽만 쓰는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES820 Glute의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 글루트 드라이브에서 발뒤꿈치로 밀어 엉덩이만으로 신전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC glute drive, push through the heels and extend with the glutes"

글루트 드라이브 전용명 없이 ES820 Glute로 부분 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트/패드, 발 위치, 스택/중량.
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
🔥 Use the guided path on ES820 Glute. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC glute drive, push through the heels and extend with the glutes. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES820 Glute","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"글루트 드라이브 전용명 없이 ES820 Glute로 부분 대응합니다","verifiedAdjustments":"시트/패드, 발 위치, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 글루트 킥백에서 골반을 고정하고 다리를 뒤로만 차기"

글루트 킥백 전용 SKU 없이 ES820 Glute 궤적. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
상체 지지, 발목 스트랩/패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
다리를 뒤로 찼다 천천히 복귀.
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
❌ 허리를 젖히며 다리를 옆으로 여는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES820 Glute의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 글루트 킥백에서 골반을 고정하고 다리를 뒤로만 차기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC glute kickback, lock the pelvis and kick the leg straight back"

글루트 킥백 전용 SKU 없이 ES820 Glute 궤적입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 상체 지지, 발목 스트랩/패드, 스택/중량.
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
🔥 Use the guided path on ES820 Glute. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC glute kickback, lock the pelvis and kick the leg straight back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES820 Glute","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"글루트 킥백 전용 SKU 없이 ES820 Glute 궤적입니다","verifiedAdjustments":"상체 지지, 발목 스트랩/패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES809 Hip Adduction/Abduction · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 어브덕션에서 상체를 세운 채 무릎을 바깥으로 벌리기"

ES809 Hip Adduction/Abduction의 어브덕션 모드. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 무릎/허벅지 패드, 스택/중량을 확인하세요.

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
❌ 상체를 뒤로 젖히며 반동으로 벌리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES809 Hip Adduction/Abduction의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 어브덕션에서 상체를 세운 채 무릎을 바깥으로 벌리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES809 Hip Adduction/Abduction · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC abduction, keep the torso tall and open the knees outward"

ES809 Hip Adduction/Abduction의 어브덕션 모드입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 무릎/허벅지 패드, 스택/중량.

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
🔥 Use the guided path on ES809 Hip Adduction/Abduction. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC abduction, keep the torso tall and open the knees outward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES809 Hip Adduction/Abduction","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES809 Hip Adduction/Abduction의 어브덕션 모드입니다","verifiedAdjustments":"시트, 무릎/허벅지 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES809 Hip Adduction/Abduction · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 어덕션에서 상체를 고정하고 무릎을 안쪽으로 모으기"

ES809의 어덕션 모드. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 무릎/허벅지 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
무릎을 안쪽으로 모았다 천천히 벌리기.
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
❌ 허리를 둥글게 말고 잡아채는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES809 Hip Adduction/Abduction의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 어덕션에서 상체를 고정하고 무릎을 안쪽으로 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES809 Hip Adduction/Abduction · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC adduction, brace the torso and close the knees inward"

ES809의 어덕션 모드입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 무릎/허벅지 패드, 스택/중량.

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
🔥 Use the guided path on ES809 Hip Adduction/Abduction. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC adduction, brace the torso and close the knees inward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES809 Hip Adduction/Abduction","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"ES809의 어덕션 모드입니다","verifiedAdjustments":"시트, 무릎/허벅지 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 글루트/힙에서 힙 신전에 집중해 끝까지 수축"

EPIC ES820 Glute. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트/패드, 발 위치, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 밀어 신전했다 천천히 복귀.
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
❌ 허리로만 밀며 엉덩이 수축을 놓치는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES820 Glute의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 글루트/힙에서 힙 신전에 집중해 끝까지 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC glute/hip machine, focus on hip extension and finish the squeeze"

EPIC ES820 Glute입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트/패드, 발 위치, 스택/중량.

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
🔥 Use the guided path on ES820 Glute. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC glute/hip machine, focus on hip extension and finish the squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES820 Glute","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES820 Glute입니다","verifiedAdjustments":"시트/패드, 발 위치, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES813 Calf Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 스탠딩 카프에서 발볼로 밀어 올린 뒤 발뒤꿈치를 깊게 내리기"

스탠딩 카프 전용 SKU 없이 ES813 Calf Extension으로 부분 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
어깨 패드, 발판, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발뒤꿈치를 올렸다 깊게 내리기.
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
❌ 무릎을 굽히며 반동으로 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES813 Calf Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES813 Calf Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC standing calf, drive through the balls of the feet then lower the heels deep"

스탠딩 카프 전용 SKU 없이 ES813 Calf Extension으로 부분 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 어깨 패드, 발판, 스택/중량.
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
🔥 Use the guided path on ES813 Calf Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES813 Calf Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"스탠딩 카프 전용 SKU 없이 ES813 Calf Extension으로 부분 대응합니다","verifiedAdjustments":"어깨 패드, 발판, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES813 Calf Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 시티드 카프에서 무릎 패드를 고정하고 발볼로만 밀기"

EPIC ES813 Calf Extension(시티드 카프 계열). EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
무릎 패드, 발판, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발뒤꿈치를 올렸다 깊게 내리기.
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
❌ 무릎으로 튕기며 가동범위를 줄이는
자세가 무너지면 무게를 낮추세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES813 Calf Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES813 Calf Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC seated calf, lock the knee pad and press only through the balls of the feet"

EPIC ES813 Calf Extension(시티드 카프 계열)입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 무릎 패드, 발판, 스택/중량.

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
🔥 Use the guided path on ES813 Calf Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES813 Calf Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES813 Calf Extension(시티드 카프 계열)입니다","verifiedAdjustments":"무릎 패드, 발판, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES804 Leg Press / ES813 Calf Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 레그 프레스 카프에서 무릎을 살짝 고정한 채 발볼로만 밀기"

레그 프레스 카프 전용 SKU 없이 ES804·ES813 조합으로 둡니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
발판 위치, 무릎 각도, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발판을 발볼로 밀었다 발뒤꿈치를 내리기.
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
❌ 무릎을 완전히 펴 잠가 관절에 충격 주는
자세가 무너지면 무게를 낮추세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES804 Leg Press / ES813 Calf Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES804 Leg Press / ES813 Calf Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC leg-press calf, soft-lock the knees and press only through the balls of the feet"

레그 프레스 카프 전용 SKU 없이 ES804·ES813 조합으로 둡니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 발판 위치, 무릎 각도, 스택/중량.
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
🔥 Use the guided path on ES804 Leg Press / ES813 Calf Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES804 Leg Press / ES813 Calf Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"레그 프레스 카프 전용 SKU 없이 ES804·ES813 조합으로 둡니다","verifiedAdjustments":"발판 위치, 무릎 각도, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES810 Biceps Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 바이셉 컬에서 팔꿈치를 패드에 고정하고 손잡이만 올리기"

EPIC ES810 Biceps Curl. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 올려 컬했다 천천히 펴기.
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
❌ 상체를 흔들며 반동 컬하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES810 Biceps Curl의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 바이셉 컬에서 팔꿈치를 패드에 고정하고 손잡이만 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES810 Biceps Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC biceps curl, pin the elbows to the pad and lift only the handles"

EPIC ES810 Biceps Curl입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 스택/중량.

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
🔥 Use the guided path on ES810 Biceps Curl. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC biceps curl, pin the elbows to the pad and lift only the handles. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES810 Biceps Curl","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES810 Biceps Curl입니다","verifiedAdjustments":"시트, 팔꿈치 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 프리처 컬

🎯 ONE KEY CUE
🔥 "EPIC 프리처에서 상완을 패드에 밀착하고 손목을 중립으로 컬"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 프리처 패드, 중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
바/손잡이를 올려 컬했다 천천히 펴기.
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
❌ 팔꿈치를 뜨고 어깨로 들어 올리는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "프리처 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 프리처에서 상완을 패드에 밀착하고 손목을 중립으로 컬. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Preacher Curl

🎯 ONE KEY CUE
🔥 "On the EPIC preacher, pin the upper arms to the pad and curl with a neutral wrist"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 프리처 패드, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Preacher Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC preacher, pin the upper arms to the pad and curl with a neutral wrist. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Preacher Curl 전용 SKU가 없습니다","verifiedAdjustments":"시트, 프리처 패드, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES810 Biceps Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 독립 바이셉으로 좌우를 같은 높이로 컬하며 불균형 확인"

Iso Biceps 전용 SKU 없이 ES810 독립 암 패턴. 좌우가 독립으로 움직이는 · EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 패드, 스택/중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 컬했다 펴기.
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
❌ 강한 쪽만 높게 올려 비대칭을 키우는
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
🔥 이 기구는 좌우 암이 독립적으로 움직이는 게 장점입니다. 무게를 올리기 전에 양쪽이 같은 속도로 가는지 확인하세요. 한쪽이 먼저 끝까지 가 버리면 중량보다 밸런스가 먼저입니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES810 Biceps Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "With EPIC independent biceps arms, curl both sides to the same height"

Iso Biceps 전용 SKU 없이 ES810 독립 암 패턴입니다 Lean into the independent arms / EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 패드, 스택/중량. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES810 Biceps Curl","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Iso Biceps 전용 SKU 없이 ES810 독립 암 패턴입니다","verifiedAdjustments":"시트, 좌·우 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES810 Biceps Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 암 컬에서 상체를 고정하고 팔꿈치만 굽히기"

암 컬 범주명은 ES810 Biceps Curl로 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 올려 컬했다 천천히 펴기.
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
❌ 어깨를 앞으로 말리며 잡아채는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES810 Biceps Curl의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 암 컬에서 상체를 고정하고 팔꿈치만 굽히기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES810 Biceps Curl · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC arm curl, brace the torso and bend only at the elbows"

암 컬 범주명은 ES810 Biceps Curl로 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 스택/중량.
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
🔥 Use the guided path on ES810 Biceps Curl. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC arm curl, brace the torso and bend only at the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES810 Biceps Curl","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"암 컬 범주명은 ES810 Biceps Curl로 대응합니다","verifiedAdjustments":"시트, 손잡이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES811 Triceps Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 트라이셉스 익스텐션에서 팔꿈치를 고정한 채 손잡이만 앞으로 펴기"

EPIC ES811 Triceps Extension. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 펴고 천천히 굴곡으로 복귀.
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
❌ 팔꿈치를 벌리며 어깨로 미는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES811 Triceps Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 트라이셉스 익스텐션에서 팔꿈치를 고정한 채 손잡이만 앞으로 펴기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES811 Triceps Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC triceps extension, lock the elbows and extend only the handles forward"

EPIC ES811 Triceps Extension입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 스택/중량.

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
🔥 Use the guided path on ES811 Triceps Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC triceps extension, lock the elbows and extend only the handles forward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES811 Triceps Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES811 Triceps Extension입니다","verifiedAdjustments":"시트, 팔꿈치 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES811 Triceps Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 트라이셉스 프레스에서 팔꿈치를 몸통에 붙인 채 아래로 누르기"

트라이셉스 프레스 전용 SKU 없이 ES811이 가장 가깝습니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 아래로 눌러 펴고 천천히 굴곡.
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
❌ 상체를 숙이며 반동으로 누르는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES811 Triceps Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 트라이셉스 프레스에서 팔꿈치를 몸통에 붙인 채 아래로 누르기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES811 Triceps Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC triceps press, keep elbows by the torso and press down"

트라이셉스 프레스 전용 SKU 없이 ES811이 가장 가깝습니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 스택/중량.
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
🔥 Use the guided path on ES811 Triceps Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC triceps press, keep elbows by the torso and press down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES811 Triceps Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"트라이셉스 프레스 전용 SKU 없이 ES811이 가장 가깝습니다","verifiedAdjustments":"시트, 손잡이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 딥/트라이셉스에서 어깨를 내린 채 팔꿈치로 깊게 내려가기"

딥/트라이셉스 머신 전용명 없이 ES812 딥 모드로 부분 대응합니다. PRODIGY/FT/Assist 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
팔꿈치를 굽혀 내려갔다 펴며 올라오기.
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
❌ 어깨를 으쓱하며 너무 깊게만 가는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES812 Dip-Chin Assist의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 딥/트라이셉스에서 어깨를 내린 채 팔꿈치로 깊게 내려가기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC dip/triceps, keep shoulders down and descend with the elbows"

딥/트라이셉스 머신 전용명 없이 ES812 딥 모드로 부분 대응합니다 Lean into the PRODIGY/FT/Assist design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 스택/중량.
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
🔥 Use the guided path on ES812 Dip-Chin Assist. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC dip/triceps, keep shoulders down and descend with the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES812 Dip-Chin Assist","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"딥/트라이셉스 머신 전용명 없이 ES812 딥 모드로 부분 대응합니다","verifiedAdjustments":"시트, 손잡이, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES810 Biceps Curl / ES811 Triceps Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 복합 모드를 확인한 뒤 컬과 익스텐션을 분리 수행"

단일 복합 SKU는 없고 ES810·ES811 조합. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
모드, 시트, 패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
선택한 모드의 궤적만 끝까지 수행.
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
❌ 모드를 바꾸지 않고 궤적을 섞는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES810 Biceps Curl / ES811 Triceps Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 복합 모드를 확인한 뒤 컬과 익스텐션을 분리 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES810 Biceps Curl / ES811 Triceps Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "Confirm the EPIC combo mode, then train curl and extension as separate sets"

단일 복합 SKU는 없고 ES810·ES811 조합입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 모드, 시트, 패드, 스택/중량.
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
🔥 Use the guided path on ES810 Biceps Curl / ES811 Triceps Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Confirm the EPIC combo mode, then train curl and extension as separate sets. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES810 Biceps Curl / ES811 Triceps Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"단일 복합 SKU는 없고 ES810·ES811 조합입니다","verifiedAdjustments":"모드, 시트, 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES819 Abdominal Crunch · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 앱 크런치에서 갈비뼈를 골반 쪽으로 말아 수축"

EPIC ES819 Abdominal Crunch. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 가슴/어깨 패드, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 말아 올렸다 천천히 펴기.
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
❌ 목을 잡아당기며 반동으로 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES819 Abdominal Crunch의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES819 Abdominal Crunch · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC ab crunch, curl the ribs toward the pelvis into a squeeze"

EPIC ES819 Abdominal Crunch입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 가슴/어깨 패드, 스택/중량.

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
🔥 Use the guided path on ES819 Abdominal Crunch. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES819 Abdominal Crunch","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES819 Abdominal Crunch입니다","verifiedAdjustments":"시트, 가슴/어깨 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES819 Abdominal Crunch · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 어브도미널에서 골반을 고정하고 복부로만 말아 올리기"

어브도미널 범주명은 ES819 Abdominal Crunch로 대응합니다. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
복부를 말아 수축했다 천천히 복귀.
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
❌ 힙플렉서로만 들어 올리는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES819 Abdominal Crunch의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES819 Abdominal Crunch · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC abdominal, lock the pelvis and curl only with the abs"

어브도미널 범주명은 ES819 Abdominal Crunch로 대응합니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 패드, 스택/중량.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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
🔥 Use the guided path on ES819 Abdominal Crunch. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES819 Abdominal Crunch","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"어브도미널 범주명은 ES819 Abdominal Crunch로 대응합니다","verifiedAdjustments":"시트, 패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES818 Torso Rotation · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 로터리 토르소에서 골반을 고정한 채 갈비뼈만 회전"

EPIC ES818 Torso Rotation. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 무릎/골반 고정, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 회전했다 천천히 복귀.
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
❌ 골반까지 같이 돌리며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES818 Torso Rotation의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES818 Torso Rotation · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC rotary torso, lock the pelvis and rotate only the ribcage"

EPIC ES818 Torso Rotation입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 무릎/골반 고정, 스택/중량.

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
🔥 Use the guided path on ES818 Torso Rotation. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES818 Torso Rotation","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES818 Torso Rotation입니다","verifiedAdjustments":"시트, 무릎/골반 고정, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 사이드 밴드

🎯 ONE KEY CUE
🔥 "EPIC 사이드 밴드에서 골반을 고정하고 옆구리를 짧게 수축"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
스탠스/시트, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
옆구리를 숙여 수축했다 천천히 복귀.
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
❌ 허리를 과하게 꺾으며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
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
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Side Bend

🎯 ONE KEY CUE
🔥 "On a EPIC side-bend pattern, lock the pelvis and shorten the side briefly"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 스탠스/시트, 손잡이, 중량.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Side Bend 전용 SKU가 없습니다","verifiedAdjustments":"스탠스/시트, 손잡이, 중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES815 Back Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 백 익스텐션에서 엉덩이를 붙인 채 상체를 길게 펴기"

EPIC ES815 Back Extension. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
⚙️ 조절 포인트
골반 패드, 풋 지지, 스택/중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 펴 올렸다 통제하며 숙이기.
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
❌ 허리를 과신전하며 튕기는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES815 Back Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES815 Back Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC back extension, keep the hips set and lengthen the torso into extension"

EPIC ES815 Back Extension입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 골반 패드, 풋 지지, 스택/중량.

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
🔥 Use the guided path on ES815 Back Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES815 Back Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES815 Back Extension입니다","verifiedAdjustments":"골반 패드, 풋 지지, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 힙 익스텐션에서 허리를 고정하고 엉덩이만 신전"

힙 익스텐션 전용 SKU 없이 ES820 Glute가 힙 신전 패턴. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
상체 지지, 발/패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 밀어 신전했다 천천히 복귀.
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
❌ 허리로만 밀어 올리는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES820 Glute의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 힙 익스텐션에서 허리를 고정하고 엉덩이만 신전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES820 Glute · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC hip extension, lock the low back and extend only at the hips"

힙 익스텐션 전용 SKU 없이 ES820 Glute가 힙 신전 패턴입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 상체 지지, 발/패드, 스택/중량.
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
🔥 Use the guided path on ES820 Glute. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC hip extension, lock the low back and extend only at the hips. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES820 Glute","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"힙 익스텐션 전용 SKU 없이 ES820 Glute가 힙 신전 패턴입니다","verifiedAdjustments":"상체 지지, 발/패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES819 Abdominal Crunch / ES815 Back Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 복근·허리 복합에서 복근과 신전을 세트로 나누어 각각 끝까지"

단일 복합 SKU 없이 ES819·ES815 조합. EPIC Selectorized ES 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
모드, 시트/패드, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
선택한 모드의 궤적만 끝까지 수행.
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
❌ 두 동작을 한 세트에 섞어 가동범위를 줄이는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES819 Abdominal Crunch / ES815 Back Extension의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES819 Abdominal Crunch / ES815 Back Extension · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC abs/back combo, split abs and extension into separate sets and finish each"

단일 복합 SKU 없이 ES819·ES815 조합입니다 Lean into the EPIC Selectorized ES design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 모드, 시트/패드, 스택/중량.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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
🔥 Use the guided path on ES819 Abdominal Crunch / ES815 Back Extension. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"ES819 Abdominal Crunch / ES815 Back Extension","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"단일 복합 SKU 없이 ES819·ES815 조합입니다","verifiedAdjustments":"모드, 시트/패드, 스택/중량","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — GENESIS Dual Cable / Functional Trainer · GENESIS

🎯 ONE KEY CUE
🔥 "EPIC 케이블에서 풀리 높이를 맞춘 뒤 가슴 앞에서 모아 수축"

케이블 크로스오버 전용명 없이 GENESIS 기능성 트레이너 케이블 패턴. PRODIGY/FT/Assist 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
풀리 높이, 손잡이, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
양손 케이블을 모아 조인 뒤 천천히 벌리기.
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
❌ 팔꿈치를 펴고 어깨로만 당기는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 GENESIS Dual Cable / Functional Trainer의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 케이블에서 풀리 높이를 맞춘 뒤 가슴 앞에서 모아 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — GENESIS Dual Cable / Functional Trainer · GENESIS

🎯 ONE KEY CUE
🔥 "On the EPIC cable path, match pulley heights then close and squeeze in front of the chest"

케이블 크로스오버 전용명 없이 GENESIS 기능성 트레이너 케이블 패턴입니다 Lean into the PRODIGY/FT/Assist design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 풀리 높이, 손잡이, 스택 핀.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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
🔥 Use the guided path on GENESIS Dual Cable / Functional Trainer. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC cable path, match pulley heights then close and squeeze in front of the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"GENESIS Dual Cable / Functional Trainer","manufacturer":"Freemotion Fitness","productSeries":"GENESIS","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"케이블 크로스오버 전용명 없이 GENESIS 기능성 트레이너 케이블 패턴입니다","verifiedAdjustments":"풀리 높이, 손잡이, 스택 핀","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — GENESIS Dual Adjustable Pulley / Functional Trainer · GENESIS

🎯 ONE KEY CUE
🔥 "EPIC 듀얼 풀리에서 양측 높이를 맞춘 뒤 대칭으로 당기기"

Freemotion GENESIS 듀얼 어저스터블 풀리/기능성 트레이너. Cable Motion · PRODIGY/FT/Assist 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
좌·우 풀리 높이, 손잡이, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
양측 케이블을 대칭으로 당겼다 복귀.
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
❌ 한쪽 풀리만 맞춰 비대칭으로 당기는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 GENESIS Dual Adjustable Pulley / Functional Trainer의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 듀얼 풀리에서 양측 높이를 맞춘 뒤 대칭으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — GENESIS Dual Adjustable Pulley / Functional Trainer · GENESIS

🎯 ONE KEY CUE
🔥 "On the EPIC dual adjustable pulley, match both heights then pull symmetrically"

Freemotion GENESIS 듀얼 어저스터블 풀리/기능성 트레이너입니다 Lean into the Cable Motion / PRODIGY/FT/Assist design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 좌·우 풀리 높이, 손잡이, 스택 핀.

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
🔥 Use the guided path on GENESIS Dual Adjustable Pulley / Functional Trainer. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC dual adjustable pulley, match both heights then pull symmetrically. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"GENESIS Dual Adjustable Pulley / Functional Trainer","manufacturer":"Freemotion Fitness","productSeries":"GENESIS","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion GENESIS 듀얼 어저스터블 풀리/기능성 트레이너입니다","verifiedAdjustments":"좌·우 풀리 높이, 손잡이, 스택 핀","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 멀티 정글짐

🎯 ONE KEY CUE
🔥 "EPIC 정글짐에서 스테이션을 정한 뒤 한 동작만 끝까지"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
스테이션, 핀/케이블, 손잡이를 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
선택한 스테이션 궤적만 반복.
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
❌ 스테이션을 자주 바꿔 자세가 흐트러지는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "멀티 정글짐"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 정글짐에서 스테이션을 정한 뒤 한 동작만 끝까지. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Multi Jungle Gym

🎯 ONE KEY CUE
🔥 "On the EPIC jungle gym, pick one station and finish that single movement"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 스테이션, 핀/케이블, 손잡이.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Multi Jungle Gym", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC jungle gym, pick one station and finish that single movement. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC/GENESIS에 Multi Jungle Gym 전용 SKU가 없습니다","verifiedAdjustments":"스테이션, 핀/케이블, 손잡이","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "EPIC 어시스트에서 중량을 고정하고 풀업·딥을 분리해 수행"

EPIC ES812 Dip-Chin Assist(풀업·딥 어시스트). PRODIGY/FT/Assist 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
어시스트 중량, 무릎/발 패드, 그립을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
선택한 동작의 궤적만 끝까지.
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
❌ 풀업과 딥을 한 세트에 섞는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 ES812 Dip-Chin Assist의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 어시스트에서 중량을 고정하고 풀업·딥을 분리해 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — ES812 Dip-Chin Assist · EPIC Selectorized

🎯 ONE KEY CUE
🔥 "On the EPIC assist, lock the assist load and train pull-up and dip as separate sets"

EPIC ES812 Dip-Chin Assist(풀업·딥 어시스트)입니다 Lean into the PRODIGY/FT/Assist design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 어시스트 중량, 무릎/발 패드, 그립.

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
🔥 Use the guided path on ES812 Dip-Chin Assist. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC assist, lock the assist load and train pull-up and dip as separate sets. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"ES812 Dip-Chin Assist","manufacturer":"Freemotion Fitness","productSeries":"EPIC Selectorized","sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"EPIC ES812 Dip-Chin Assist(풀업·딥 어시스트)입니다","verifiedAdjustments":"어시스트 중량, 무릎/발 패드, 그립","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 스미스 머신

🎯 ONE KEY CUE
🔥 "EPIC 스미스에서 바를 언랙한 뒤 발 위치를 고정하고 수직으로 움직이기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
바 후크, 세이프티, 발 위치, 플레이트를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
바를 수직으로 내렸다 밀어 올리기.
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
❌ 발 위치를 자주 바꿔 궤적이 흔들리는
자세가 무너지면 무게를 낮추세요.
❌ 안전바 높이를 안 맞추고 올리는 것
세트 전에 안전 위치부터 다시 맞추세요.
❌ 좌우 원판 불균형
자세가 무너지면 무게를 낮추세요.
❌ 바 경로와 발 위치가 어긋나는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "스미스 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 안전바 → 가동범위에 맞춤
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 스미스에서 바를 언랙한 뒤 발 위치를 고정하고 수직으로 움직이기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Smith Machine

🎯 ONE KEY CUE
🔥 "On the EPIC Smith, unrack then fix foot placement and move vertically"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 바 후크, 세이프티, 발 위치, 플레이트.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Smith Machine", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Safeties → match your range
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC Smith, unrack then fix foot placement and move vertically. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Smith Machine 전용 SKU가 없습니다","verifiedAdjustments":"바 후크, 세이프티, 발 위치, 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 파워 랙

🎯 ONE KEY CUE
🔥 "EPIC 파워 랙에서 제이훅·세이프티를 맞춘 뒤 바 경로만 집중"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
제이훅, 세이프티, 바, 플레이트를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
설정한 바 경로로 언랙·리프트·리랙.
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
❌ 세이프티 없이 고중량을 시도하는
자세가 무너지면 무게를 낮추세요.
❌ 안전바 높이를 안 맞추고 올리는 것
세트 전에 안전 위치부터 다시 맞추세요.
❌ 좌우 원판 불균형
자세가 무너지면 무게를 낮추세요.
❌ 바 경로와 발 위치가 어긋나는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "파워 랙"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 안전바 → 가동범위에 맞춤
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 파워 랙에서 제이훅·세이프티를 맞춘 뒤 바 경로만 집중. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Power Rack

🎯 ONE KEY CUE
🔥 "On the EPIC power rack, set J-hooks and safeties then focus only on the bar path"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
⚙️ Adjustments
Check 제이훅, 세이프티, 바, 플레이트.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Power Rack", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Safeties → match your range
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC power rack, set J-hooks and safeties then focus only on the bar path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Power Rack 전용 SKU가 없습니다","verifiedAdjustments":"제이훅, 세이프티, 바, 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
    'ko', jsonb_build_array($k$🏋️ FREEMOTION — 하프 랙

🎯 ONE KEY CUE
🔥 "EPIC 하프랙에서 세이프티 높이를 맞춘 뒤 수직으로 움직이기"

프리모션 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
제이훅, 세이프티, 바, 플레이트를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
바를 언랙해 리프트한 뒤 리랙.
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
❌ 세이프티를 너무 낮게 두어 실패 시 위험해지는
자세가 무너지면 무게를 낮추세요.
❌ 안전바 높이를 안 맞추고 올리는 것
세트 전에 안전 위치부터 다시 맞추세요.
❌ 좌우 원판 불균형
자세가 무너지면 무게를 낮추세요.
❌ 바 경로와 발 위치가 어긋나는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "하프 랙"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 안전바 → 가동범위에 맞춤
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"EPIC 하프랙에서 세이프티 높이를 맞춘 뒤 수직으로 움직이기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FREEMOTION — Half Rack

🎯 ONE KEY CUE
🔥 "On the EPIC half rack, set safety height then move vertically"

There is no dedicated Freemotion SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
⚙️ Adjustments
Check 제이훅, 세이프티, 바, 플레이트.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Half Rack", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Safeties → match your range
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"On the EPIC half rack, set safety height then move vertically. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Freemotion Fitness","productSeries":null,"sourceUrl":"https://freemotionfitness.com/strength-machines/epic-selectorized/","verifiedStructure":"Freemotion EPIC 카탈로그에 Half Rack 전용 SKU가 없습니다","verifiedAdjustments":"제이훅, 세이프티, 바, 플레이트","importedAt":"2026-08-20T04:18:37.776Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FREEMOTION'
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
  WHERE b.code = 'FREEMOTION'
    AND m.is_active = TRUE
    AND m.pro_tips IS NOT NULL
    AND m.pro_tips_meta IS NOT NULL
    AND m.pro_tips_meta->>'verificationStatus' IS NOT NULL
    AND (m.pro_tips->'ko'->>0) LIKE '%ONE KEY CUE%'
    AND (m.pro_tips->'ko'->>0) LIKE '%MACHINE FIT PRO TIP%'
    AND (m.pro_tips->'ko'->>0) NOT LIKE '%📋 검증 상태%';

  IF updated_count < 80 THEN
    RAISE EXCEPTION 'FREEMOTION trainer PRO tips import incomplete: % / 80', updated_count;
  END IF;
END $$;
