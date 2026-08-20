-- Import PRECOR MachineFit PRO tips (trainer coaching style).
-- Source: database/catalog/pro-tips/precor_pro_tips.csv
-- Backup previous pro_tips / pro_tips_meta before UPDATE.

CREATE TABLE IF NOT EXISTS _backup_precor_pro_tips_20260820 (
  machine_id UUID PRIMARY KEY,
  code TEXT,
  machine_name_ko TEXT,
  pro_tips JSONB,
  pro_tips_meta JSONB,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO _backup_precor_pro_tips_20260820 (machine_id, code, machine_name_ko, pro_tips, pro_tips_meta)
SELECT m.id,
       m.code,
       COALESCE(st.name->>'ko', m.name->>'ko'),
       m.pro_tips,
       m.pro_tips_meta
FROM machines m
JOIN brands b ON b.id = m.brand_id
LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
WHERE b.code = 'PRECOR'
  AND m.is_active = TRUE
ON CONFLICT (machine_id) DO NOTHING;


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Chest Press DSL0404 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "견갑을 붙인 채 손잡이를 가슴 중앙으로 밀기"

Precor Discovery Chest Press(DSL0404). 셀렉터 스택 체스트 프레스. 셀렉터 스택 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 시작를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이 시작, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 앞·안쪽으로 밀었다 천천히 복귀.
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
🔥 Select 라인(Discovery Chest Press DSL0404)은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"견갑을 붙인 채 손잡이를 가슴 중앙으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Chest Press DSL0404 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep scapulae set and press handles through center chest"

Precor Discovery Chest Press(DSL0404). 셀렉터 스택 체스트 프레스입니다 Lean into the selectorized stack / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이 시작, 스택 핀.

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
🔥 On Select (Discovery Chest Press DSL0404), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep scapulae set and press handles through center chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Chest Press DSL0404","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery Chest Press(DSL0404). 셀렉터 스택 체스트 프레스입니다","verifiedAdjustments":"시트, 손잡이 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Incline Press DPL0541 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "견갑을 고정하고 대각선 위로 밀기"

DSL 셀렉터에 전용 인클라인 없음. Discovery Plate Loaded Incline Press(DPL0541)가 해당 패턴. 플레이트 로딩 · 셀렉터 스택 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 양쪽 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

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
🔥 Discovery Plate Loaded Incline Press DPL0541은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"견갑을 고정하고 대각선 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Incline Press DPL0541 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Set the scapula and press upward on a diagonal"

DSL 셀렉터에 전용 인클라인 없음. Discovery Plate Loaded Incline Press(DPL0541)가 해당 패턴입니다 Lean into the plate-loaded / selectorized stack / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 양쪽 플레이트. Match plates on both sides — do not load one arm first.
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
❌ Loading unequal plates
Match both sides, then confirm with a light set.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Plate Loaded Incline Press DPL0541 is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set the scapula and press upward on a diagonal. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Plate Loaded Incline Press DPL0541","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"DSL 셀렉터에 전용 인클라인 없음. Discovery Plate Loaded Incline Press(DPL0541)가 해당 패턴입니다","verifiedAdjustments":"시트, 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 디클라인 체스트 프레스

🎯 ONE KEY CUE
🔥 "하부 가슴을 향해 아래·앞으로 밀기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "디클라인 체스트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"하부 가슴을 향해 아래·앞으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Decline Chest Press

🎯 ONE KEY CUE
🔥 "Press down and forward toward the lower chest"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Decline Chest Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Press down and forward toward the lower chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute/Vitality 카탈로그에 Decline Chest Press 전용 SKU가 없습니다","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Converging Chest Press DSL0414 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "넓은 시작에서 중앙으로 수렴하며 밀기"

Discovery Converging Chest Press(DSL0414). Advanced Movement Design™ 수렴 프레스. 안쪽으로 모이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 스택 핀을 확인하세요.

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

"넓은 시작에서 중앙으로 수렴하며 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Converging Chest Press DSL0414 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Start wide and converge toward center chest"

Discovery Converging Chest Press(DSL0414). Advanced Movement Design™ 수렴 프레스입니다 Lean into the converging path / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 스택 핀.

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
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Converging Chest Press DSL0414","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Converging Chest Press(DSL0414). Advanced Movement Design™ 수렴 프레스입니다","verifiedAdjustments":"시트, 시작 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Converging Chest Press DSL0414 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "좌우를 같은 속도로 밀며 불균형 확인"

공식 Iso-Lateral 명칭 SKU는 없고 DSL0414 수렴 암으로 좌우 균형을 확인합니다. 좌우가 독립으로 움직이는 · 안쪽으로 모이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 스택 핀을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Converging Chest Press DSL0414 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Press both sides at the same speed and watch for imbalances"

공식 Iso-Lateral 명칭 SKU는 없고 DSL0414 수렴 암으로 좌우 균형을 확인합니다 Lean into the independent arms / converging path / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 스택 핀. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Converging Chest Press DSL0414","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"공식 Iso-Lateral 명칭 SKU는 없고 DSL0414 수렴 암으로 좌우 균형을 확인합니다","verifiedAdjustments":"시트, 좌·우 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Chest Press DPL0540 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "양쪽 플레이트를 맞추고 가슴 중앙으로 밀기"

Discovery Plate Loaded Chest Press(DPL0540). 플레이트 로딩 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

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
🔥 Discovery Plate Loaded Chest Press DPL0540은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"양쪽 플레이트를 맞추고 가슴 중앙으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Chest Press DPL0540 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Match plates on both sides and press through center chest"

Discovery Plate Loaded Chest Press(DPL0540)입니다 Lean into the plate-loaded / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

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
🔥 Discovery Plate Loaded Chest Press DPL0540 is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match plates on both sides and press through center chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Plate Loaded Chest Press DPL0540","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Plate Loaded Chest Press(DPL0540)입니다","verifiedAdjustments":"시트, 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치 각도를 유지한 채 가슴으로 모으기"

Discovery Rear Delt / Pec Fly(DSL0505). 펙 플라이 모드로 사용합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작, 스택 핀, 모드 전환을 확인하세요.

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
🔥 Discovery Rear Delt / Pec Fly DSL0505의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치 각도를 유지한 채 가슴으로 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep elbow angle steady and close through the chest"

Discovery Rear Delt / Pec Fly(DSL0505). 펙 플라이 모드로 사용합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작, 스택 핀, 모드 전환.

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
🔥 Use the guided path on Discovery Rear Delt / Pec Fly DSL0505. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep elbow angle steady and close through the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Rear Delt / Pec Fly DSL0505","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Rear Delt / Pec Fly(DSL0505). 펙 플라이 모드로 사용합니다","verifiedAdjustments":"시트, 암 시작, 스택 핀, 모드 전환","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "가슴을 고정하고 팔을 뒤로 벌리며 수축"

DSL0505 리어 델트 모드. 리버스 플라이 궤적. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작, 스택 핀, 모드 전환을 확인하세요.

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
🔥 Discovery Rear Delt / Pec Fly DSL0505의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 고정하고 팔을 뒤로 벌리며 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Brace the chest and open the arms back into a rear-delt squeeze"

DSL0505 리어 델트 모드. 리버스 플라이 궤적입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작, 스택 핀, 모드 전환.

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
🔥 Use the guided path on Discovery Rear Delt / Pec Fly DSL0505. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the chest and open the arms back into a rear-delt squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Rear Delt / Pec Fly DSL0505","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"DSL0505 리어 델트 모드. 리버스 플라이 궤적입니다","verifiedAdjustments":"시트, 암 시작, 스택 핀, 모드 전환","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "호를 크게 그리며 가슴 앞에서 모으기"

전용 Fly 명칭 SKU 없이 DSL0505 Pec Fly 모드가 플라이 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

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
❌ 손목으로 밀며 궤적을 짧게 끊는
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Rear Delt / Pec Fly DSL0505의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"호를 크게 그리며 가슴 앞에서 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Draw a wide arc and close in front of the chest"

전용 Fly 명칭 SKU 없이 DSL0505 Pec Fly 모드가 플라이 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작, 스택 핀.
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
🔥 Use the guided path on Discovery Rear Delt / Pec Fly DSL0505. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Draw a wide arc and close in front of the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Rear Delt / Pec Fly DSL0505","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"전용 Fly 명칭 SKU 없이 DSL0505 Pec Fly 모드가 플라이 패턴입니다","verifiedAdjustments":"시트, 암 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Dip DSL0215 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치를 몸통 옆으로 붙인 채 아래로 누르기"

Discovery Seated Dip(DSL0215). 시티드 딥/트라이셉스 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 아래로 눌렀다 천천히 복귀.
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
❌ 어깨를 귀 쪽으로 올리며 반동으로 누르는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Dip DSL0215의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 몸통 옆으로 붙인 채 아래로 누르기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Dip DSL0215 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep elbows close to the torso and press down"

Discovery Seated Dip(DSL0215). 시티드 딥/트라이셉스 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 스택 핀.

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
🔥 Use the guided path on Discovery Seated Dip DSL0215. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep elbows close to the torso and press down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Seated Dip DSL0215","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Seated Dip(DSL0215). 시티드 딥/트라이셉스 패턴입니다","verifiedAdjustments":"시트, 손잡이, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 어시스트 딥

🎯 ONE KEY CUE
🔥 "무릎 패드에 체중을 싣고 팔꿈치로 깊게 내려가기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
몸을 내린 뒤 팔로 밀어 올려 복귀.
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
❌ 반동으로 튕기며 어깨를 앞으로 내미는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "어시스트 딥"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"무릎 패드에 체중을 싣고 팔꿈치로 깊게 내려가기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Assisted Dip

🎯 ONE KEY CUE
🔥 "Load the knee pad and descend deep through the elbows"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Assisted Dip", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Load the knee pad and descend deep through the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Assisted Dip 전용 SKU가 없습니다. Seated Dip(DSL0215)은 어시스트가 아닙니다","verifiedAdjustments":"무릎 패드, 손잡이, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Incline Press DPL0541 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "높은 인클라인에서 쇄골 방향으로 밀기"

슈퍼 인클라인 전용 SKU 없이 DPL0541 인클라인 프레스가 가장 가까운 패턴. 플레이트 로딩 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 시작 위치, 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 위·앞으로 밀었다 복귀.
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
❌ 허리를 띄우며 하부 가슴으로만 미는
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
🔥 Discovery Plate Loaded Incline Press DPL0541은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"높은 인클라인에서 쇄골 방향으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Incline Press DPL0541 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "From a steep incline, press toward the collarbone line"

슈퍼 인클라인 전용 SKU 없이 DPL0541 인클라인 프레스가 가장 가까운 패턴입니다 Lean into the plate-loaded / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 시작 위치, 플레이트. Match plates on both sides — do not load one arm first.
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
❌ Loading unequal plates
Match both sides, then confirm with a light set.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Plate Loaded Incline Press DPL0541 is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"From a steep incline, press toward the collarbone line. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Plate Loaded Incline Press DPL0541","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"슈퍼 인클라인 전용 SKU 없이 DPL0541 인클라인 프레스가 가장 가까운 패턴입니다","verifiedAdjustments":"시트, 시작 위치, 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Lat Pulldown DSL0304 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "흉곽을 세운 채 바를 쇄골 쪽으로 당기기"

Discovery Lat Pulldown(DSL0304). 고정 궤적 랫풀다운. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 시트, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 아래로 당겼다 천천히 올려 복귀.
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
❌ 몸을 크게 흔들며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Lat Pulldown DSL0304의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"흉곽을 세운 채 바를 쇄골 쪽으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Lat Pulldown DSL0304 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the ribcage tall and pull the bar toward the collarbone"

Discovery Lat Pulldown(DSL0304). 고정 궤적 랫풀다운입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 시트, 스택 핀.

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
🔥 Use the guided path on Discovery Lat Pulldown DSL0304. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the ribcage tall and pull the bar toward the collarbone. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Lat Pulldown DSL0304","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Lat Pulldown(DSL0304). 고정 궤적 랫풀다운입니다","verifiedAdjustments":"무릎 패드, 시트, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Diverging Lat Pulldown DSL0314 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "넓은 그립에서 팔꿈치를 옆구리로 끌어내리기"

와이드 전용 SKU명 없이 DSL0314 Diverging Lat Pulldown의 넓은 시작이 해당합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 시트, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 쇄골 높이까지 내린 뒤 통제 복귀.
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
❌ 손목만 구부리며 바를 가슴 아래로 과도하게 내리는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Diverging Lat Pulldown DSL0314의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"넓은 그립에서 팔꿈치를 옆구리로 끌어내리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Diverging Lat Pulldown DSL0314 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "From a wide grip, drive the elbows down beside the ribs"

와이드 전용 SKU명 없이 DSL0314 Diverging Lat Pulldown의 넓은 시작이 해당합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 시트, 스택 핀.
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
🔥 Use the guided path on Discovery Diverging Lat Pulldown DSL0314. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"From a wide grip, drive the elbows down beside the ribs. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Diverging Lat Pulldown DSL0314","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"와이드 전용 SKU명 없이 DSL0314 Diverging Lat Pulldown의 넓은 시작이 해당합니다","verifiedAdjustments":"무릎 패드, 시트, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Lat Pulldown DSL0304 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "바가 얼굴 앞을 지나가게 수직으로 당기기"

프론트 풀다운 전용 SKU 없이 DSL0304를 앞면 풀다운으로 사용합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 시트, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 앞가슴 높이로 당겼다 복귀.
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
❌ 목을 빼고 바를 뒤로 넘기려는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Lat Pulldown DSL0304의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"바가 얼굴 앞을 지나가게 수직으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Lat Pulldown DSL0304 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Pull vertically so the bar travels in front of the face"

프론트 풀다운 전용 SKU 없이 DSL0304를 앞면 풀다운으로 사용합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 시트, 스택 핀.
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
🔥 Use the guided path on Discovery Lat Pulldown DSL0304. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pull vertically so the bar travels in front of the face. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Lat Pulldown DSL0304","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"프론트 풀다운 전용 SKU 없이 DSL0304를 앞면 풀다운으로 사용합니다","verifiedAdjustments":"무릎 패드, 시트, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Diverging Lat Pulldown DSL0314 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "좌우를 같은 깊이로 당기며 불균형 확인"

공식 Iso-Lateral 명칭 없이 DSL0314 발산형 암으로 좌우를 분리 확인할 수 있습니다. 좌우가 독립으로 움직이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
무릎 패드, 좌·우 시작, 스택 핀을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 내린 뒤 천천히 복귀.
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
❌ 강한 쪽만 먼저 당겨 궤적이 틀어지는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Diverging Lat Pulldown DSL0314 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Pull both sides to the same depth and watch for imbalances"

공식 Iso-Lateral 명칭 없이 DSL0314 발산형 암으로 좌우를 분리 확인할 수 있습니다 Lean into the independent arms / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 무릎 패드, 좌·우 시작, 스택 핀. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Diverging Lat Pulldown DSL0314","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"공식 Iso-Lateral 명칭 없이 DSL0314 발산형 암으로 좌우를 분리 확인할 수 있습니다","verifiedAdjustments":"무릎 패드, 좌·우 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치를 높게 유지한 채 견갑을 모으며 당기기"

하이로우 전용 SKU 없이 DSL0310 Seated Row의 높은 손잡이/궤적이 가깝습니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴/풋 지지, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 몸통 쪽으로 당겼다 천천히 복귀.
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
❌ 허리를 뒤로 젖히며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Row DSL0310의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 높게 유지한 채 견갑을 모으며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep elbows high and pull while retracting the scapulae"

하이로우 전용 SKU 없이 DSL0310 Seated Row의 높은 손잡이/궤적이 가깝습니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴/풋 지지, 스택 핀.
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
🔥 Use the guided path on Discovery Seated Row DSL0310. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep elbows high and pull while retracting the scapulae. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Row DSL0310","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"하이로우 전용 SKU 없이 DSL0310 Seated Row의 높은 손잡이/궤적이 가깝습니다","verifiedAdjustments":"시트, 가슴/풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "좌우를 같은 각도로 당기며 등 중앙 수축"

공식 Iso High Row SKU 없이 DSL0324 Diverging Low Row의 독립 발산 암이 유사합니다. 좌우가 독립으로 움직이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 풋 지지, 스택 핀을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 뒤로 당겼다 천천히 복귀.
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
❌ 한쪽만 과도하게 돌리며 몸통을 비트는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Pull both sides on matching angles into a mid-back squeeze"

공식 Iso High Row SKU 없이 DSL0324 Diverging Low Row의 독립 발산 암이 유사합니다 Lean into the independent arms / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 풋 지지, 스택 핀. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Diverging Low Row DSL0324","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"공식 Iso High Row SKU 없이 DSL0324 Diverging Low Row의 독립 발산 암이 유사합니다","verifiedAdjustments":"시트, 좌·우 시작, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "풋 지지로 고정한 뒤 팔꿈치를 옆구리로 당기기"

Discovery Seated Row(DSL0310). 시티드 로우 셀렉터. 셀렉터 스택 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 스택 핀을 확인하세요.

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
❌ 무릎을 펴며 몸 전체를 흔드는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Select 라인(Discovery Seated Row DSL0310)은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"풋 지지로 고정한 뒤 팔꿈치를 옆구리로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Brace on the foot supports and pull the elbows to the ribs"

Discovery Seated Row(DSL0310). 시티드 로우 셀렉터입니다 Lean into the selectorized stack / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 스택 핀.

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
🔥 On Select (Discovery Seated Row DSL0310), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace on the foot supports and pull the elbows to the ribs. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Seated Row DSL0310","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Seated Row(DSL0310). 시티드 로우 셀렉터입니다","verifiedAdjustments":"시트, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "가슴을 세운 채 손잡이를 몸통으로 당기기"

일반 로우 머신 표기는 DSL0310 Seated Row로 매칭합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
당긴 뒤 팔을 앞으로 천천히 펴며 복귀.
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
❌ 승모만으로 짧게 잡아채는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Row DSL0310의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 세운 채 손잡이를 몸통으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the chest tall and pull the handles to the torso"

일반 로우 머신 표기는 DSL0310 Seated Row로 매칭합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 스택 핀.
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
🔥 Use the guided path on Discovery Seated Row DSL0310. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the chest tall and pull the handles to the torso. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Row DSL0310","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"일반 로우 머신 표기는 DSL0310 Seated Row로 매칭합니다","verifiedAdjustments":"시트, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "낮은 궤적으로 팔꿈치를 뒤로 보내며 당기기"

Discovery Diverging Low Row(DSL0324). Advanced Movement Design™ 로우 로우. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 낮은 위치에서 뒤로 당겼다 복귀.
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
❌ 허리를 과하게 신전하며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Diverging Low Row DSL0324의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"낮은 궤적으로 팔꿈치를 뒤로 보내며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Pull on a low path and drive the elbows back"

Discovery Diverging Low Row(DSL0324). Advanced Movement Design™ 로우 로우입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 스택 핀.

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
🔥 Use the guided path on Discovery Diverging Low Row DSL0324. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pull on a low path and drive the elbows back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Diverging Low Row DSL0324","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Diverging Low Row(DSL0324). Advanced Movement Design™ 로우 로우입니다","verifiedAdjustments":"시트, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치를 몸통 높이로 유지하며 견갑 모으기"

미드 로우 전용 SKU 없이 DSL0310의 중간 높이 손잡이 패턴이 가깝습니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 풋 지지, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 몸통 중앙으로 당겼다 복귀.
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
❌ 팔꿈치를 너무 낮추거나 올려 궤적을 벗어나는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Row DSL0310의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 몸통 높이로 유지하며 견갑 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep elbows at torso height and retract the scapulae"

미드 로우 전용 SKU 없이 DSL0310의 중간 높이 손잡이 패턴이 가깝습니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 풋 지지, 스택 핀.
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
🔥 Use the guided path on Discovery Seated Row DSL0310. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep elbows at torso height and retract the scapulae. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Row DSL0310","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"미드 로우 전용 SKU 없이 DSL0310의 중간 높이 손잡이 패턴이 가깝습니다","verifiedAdjustments":"시트, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "좌우를 같은 속도로 당기며 불균형 확인"

공식 Iso-Lateral Row SKU 없이 DSL0324 발산형 암으로 좌우를 확인합니다. 좌우가 독립으로 움직이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 풋 지지, 스택 핀을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 뒤로 당겼다 천천히 복귀.
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
❌ 강한 쪽만 먼저 당겨 몸통이 돌아가는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Pull both sides at the same speed and watch for imbalances"

공식 Iso-Lateral Row SKU 없이 DSL0324 발산형 암으로 좌우를 확인합니다 Lean into the independent arms / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 풋 지지, 스택 핀. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Diverging Low Row DSL0324","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"공식 Iso-Lateral Row SKU 없이 DSL0324 발산형 암으로 좌우를 확인합니다","verifiedAdjustments":"시트, 좌·우 시작, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "낮은 궤적에서 좌우를 대칭으로 당기기"

DSL0324 Diverging Low Row가 아이소래터럴 로우 로우에 가장 가깝습니다. 좌우가 독립으로 움직이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 풋 지지, 스택 핀을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 낮게 뒤로 당겼다 복귀.
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
❌ 한쪽으로만 기울이며 당기는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Diverging Low Row DSL0324 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "On a low path, pull left and right symmetrically"

DSL0324 Diverging Low Row가 아이소래터럴 로우 로우에 가장 가깝습니다 Lean into the independent arms / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 풋 지지, 스택 핀. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Diverging Low Row DSL0324","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"DSL0324 Diverging Low Row가 아이소래터럴 로우 로우에 가장 가깝습니다","verifiedAdjustments":"시트, 좌·우 시작, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "가슴 패드를 밀착하고 팔꿈치만으로 당기기"

전용 Chest-Supported SKU명 없이 DSL0310의 가슴/패드 지지 시티드 로우가 해당합니다. 가슴 지지 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 풋 지지, 스택 핀을 확인하세요.
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
❌ 패드를 떼며 몸통을 흔드는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Row DSL0310 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Stay glued to the chest pad and pull with the elbows only"

전용 Chest-Supported SKU명 없이 DSL0310의 가슴/패드 지지 시티드 로우가 해당합니다 Lean into the chest-supported / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 풋 지지, 스택 핀.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Row DSL0310","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"전용 Chest-Supported SKU명 없이 DSL0310의 가슴/패드 지지 시티드 로우가 해당합니다","verifiedAdjustments":"시트, 가슴 패드, 풋 지지, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — T바 로우 머신

🎯 ONE KEY CUE
🔥 "가슴을 붙인 채 바를 배꼽 쪽으로 당기기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
흉부 패드, 풋 지지, 플레이트를 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 위로 당겼다 천천히 내리며 복귀.
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
❌ 허리를 과도하게 신전하며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
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

"가슴을 붙인 채 바를 배꼽 쪽으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — T-Bar Row

🎯 ONE KEY CUE
🔥 "Keep the chest planted and pull the bar toward the navel"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 흉부 패드, 풋 지지, 플레이트.

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

"Keep the chest planted and pull the bar toward the navel. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 T-Bar Row 전용 머신이 없습니다","verifiedAdjustments":"흉부 패드, 풋 지지, 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 풀오버

🎯 ONE KEY CUE
🔥 "갈비뼈를 내린 채 팔을 호를 그리며 내리기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
팔 패드를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔 패드, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 호를 그리며 내린 뒤 천천히 복귀.
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
❌ 팔꿈치만 구부리며 삼두로만 누르는
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

"갈비뼈를 내린 채 팔을 호를 그리며 내리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Pullover

🎯 ONE KEY CUE
🔥 "Keep the ribs down and arc the arms downward"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔 패드, 중량.

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

"Keep the ribs down and arc the arms downward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute/Vitality 카탈로그에 Pullover 전용 SKU가 없습니다","verifiedAdjustments":"시트, 팔 패드, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 어시스트 풀업 / 친업

🎯 ONE KEY CUE
🔥 "어시스트를 고정한 뒤 가슴을 바 쪽으로 당기기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
무릎/발 패드, 그립, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
몸을 올린 뒤 천천히 내려 복귀.
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "어시스트 풀업 / 친업"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"어시스트를 고정한 뒤 가슴을 바 쪽으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Assisted Pull-up / Chin-up

🎯 ONE KEY CUE
🔥 "Lock the assist and pull the chest toward the bar"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 무릎/발 패드, 그립, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Assisted Pull-up / Chin-up", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lock the assist and pull the chest toward the bar. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Assisted Pull-Up/Chin-Up 전용 SKU가 없습니다","verifiedAdjustments":"무릎/발 패드, 그립, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Shoulder Press DSL0500 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "갈비뼈를 내린 채 손잡이를 머리 위로 밀기"

Discovery Shoulder Press(DSL0500). 셀렉터 숄더 프레스. 셀렉터 스택 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 시작를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이 시작, 스택 핀을 확인하세요.

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
❌ 허리를 과하게 아치하며 반동으로 미는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Select 라인(Discovery Shoulder Press DSL0500)은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"갈비뼈를 내린 채 손잡이를 머리 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Shoulder Press DSL0500 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the ribs down and press the handles overhead"

Discovery Shoulder Press(DSL0500). 셀렉터 숄더 프레스입니다 Lean into the selectorized stack / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이 시작, 스택 핀.

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
🔥 On Select (Discovery Shoulder Press DSL0500), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the ribs down and press the handles overhead. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Shoulder Press DSL0500","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Shoulder Press(DSL0500). 셀렉터 숄더 프레스입니다","verifiedAdjustments":"시트, 손잡이 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Converging Shoulder Press DSL0515 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "좌우를 같은 높이로 밀며 불균형 확인"

공식 Iso-Lateral 명칭 없이 DSL0515 Converging Shoulder Press로 좌우를 확인합니다. 좌우가 독립으로 움직이는 · 안쪽으로 모이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 시작, 스택 핀을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 밀었다 복귀.
손잡이가 직선으로만 가는 게 아닙니다. 기구가 만들어 주는 안쪽 궤적을 그대로 타세요. 억지로 모으지 마세요.

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
❌ 한쪽만 먼저 올려 어깨가 기울어지는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Converging Shoulder Press DSL0515 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Press both sides to the same height and watch for imbalances"

공식 Iso-Lateral 명칭 없이 DSL0515 Converging Shoulder Press로 좌우를 확인합니다 Lean into the independent arms / converging path / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 시작, 스택 핀. Confirm both sides start from the same position.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

---

💪 ② Start position
Drop the ribs — do not over-arch. Set the elbows on the press path.
Double-check both sides start at the same height.
Check only this:
👉 Low back not over-arched

---

🔥 ③ Execution
The handles are not a straight line — ride the converging path. Do not force them together.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Converging Shoulder Press DSL0515","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"공식 Iso-Lateral 명칭 없이 DSL0515 Converging Shoulder Press로 좌우를 확인합니다","verifiedAdjustments":"시트, 좌·우 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Shoulder Press DPL0550 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "양쪽 플레이트를 맞추고 머리 위로 밀기"

Discovery Plate Loaded Shoulder Press(DPL0550). 플레이트 로딩 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

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
🔥 Discovery Plate Loaded Shoulder Press DPL0550은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"양쪽 플레이트를 맞추고 머리 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Shoulder Press DPL0550 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Match plates on both sides and press overhead"

Discovery Plate Loaded Shoulder Press(DPL0550)입니다 Lean into the plate-loaded / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

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
🔥 Discovery Plate Loaded Shoulder Press DPL0550 is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match plates on both sides and press overhead. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Plate Loaded Shoulder Press DPL0550","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Plate Loaded Shoulder Press(DPL0550)입니다","verifiedAdjustments":"시트, 시작 위치, 양쪽 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Lateral Raise DSL0504 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치를 살짝 굽힌 채 옆·위로 들기"

Discovery Lateral Raise(DSL0504). 머신 레터럴 레이즈. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
팔 패드를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔을 옆으로 올린 뒤 천천히 내리기.
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
❌ 승모로 으쓱하며 무게를 들어올리는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Lateral Raise DSL0504의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 살짝 굽힌 채 옆·위로 들기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Lateral Raise DSL0504 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep a soft elbow bend and raise out to the sides"

Discovery Lateral Raise(DSL0504). 머신 레터럴 레이즈입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Lateral Raise DSL0504. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep a soft elbow bend and raise out to the sides. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Lateral Raise DSL0504","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Lateral Raise(DSL0504). 머신 레터럴 레이즈입니다","verifiedAdjustments":"시트, 팔 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Lateral Raise DSL0504 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "어깨 높이까지만 올리고 정지 후 내리기"

DSL0504 Lateral Raise — 머신 레터럴 레이즈 공식 모델. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
팔 패드를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
팔을 옆으로 올린 뒤 천천히 내리기.
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
❌ 머리 위까지 올려 승모에 넘기는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Lateral Raise DSL0504의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"어깨 높이까지만 올리고 정지 후 내리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Lateral Raise DSL0504 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Raise only to shoulder height, pause, then lower"

DSL0504 Lateral Raise — 머신 레터럴 레이즈 공식 모델입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Lateral Raise DSL0504. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Raise only to shoulder height, pause, then lower. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Lateral Raise DSL0504","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"DSL0504 Lateral Raise — 머신 레터럴 레이즈 공식 모델입니다","verifiedAdjustments":"시트, 팔 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "상체를 고정하고 팔을 뒤로 벌리며 수축"

DSL0505 Rear Delt 모드로 리어 델트를 훈련합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작, 스택 핀을 확인하세요.

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
❌ 손목으로만 밀며 가동범위를 줄이는
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Rear Delt / Pec Fly DSL0505의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 고정하고 팔을 뒤로 벌리며 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Rear Delt / Pec Fly DSL0505 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Brace the torso and open the arms into a rear-delt squeeze"

DSL0505 Rear Delt 모드로 리어 델트를 훈련합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작, 스택 핀.

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
🔥 Use the guided path on Discovery Rear Delt / Pec Fly DSL0505. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the torso and open the arms into a rear-delt squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Rear Delt / Pec Fly DSL0505","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"DSL0505 Rear Delt 모드로 리어 델트를 훈련합니다","verifiedAdjustments":"시트, 암 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 프론트 레이즈

🎯 ONE KEY CUE
🔥 "갈비뼈를 내린 채 팔을 앞·위로 들기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
팔을 어깨 높이까지 올린 뒤 천천히 내리기.
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
❌ 허리를 흔들며 반동으로 들어올리는
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

"갈비뼈를 내린 채 팔을 앞·위로 들기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Front Raise

🎯 ONE KEY CUE
🔥 "Keep the ribs down and raise the arms forward-up"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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

"Keep the ribs down and raise the arms forward-up. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Front Raise 전용 머신이 없습니다","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 업라이트 로우

🎯 ONE KEY CUE
🔥 "팔꿈치를 손보다 높게 유지하며 당기기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
손잡이를 쇄골 높이로 당겼다 복귀.
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
❌ 손목을 꺾으며 어깨를 으쓱하는
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

"팔꿈치를 손보다 높게 유지하며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Upright Row

🎯 ONE KEY CUE
🔥 "Keep the elbows higher than the hands as you pull"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 손잡이, 중량.

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

"Keep the elbows higher than the hands as you pull. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Upright Row 전용 머신이 없습니다","verifiedAdjustments":"손잡이, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 로테이터 머신

🎯 ONE KEY CUE
🔥 "팔꿈치를 옆구리에 붙인 채 천천히 회전"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
팔꿈치 패드, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
전완을 안·밖으로 회전했다 복귀.
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
❌ 몸통을 돌리며 가동범위를 키우는
자세가 무너지면 무게를 낮추세요.
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

"팔꿈치를 옆구리에 붙인 채 천천히 회전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Rotator Machine

🎯 ONE KEY CUE
🔥 "Keep the elbow glued to the ribs and rotate slowly"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 팔꿈치 패드, 중량.

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

"Keep the elbow glued to the ribs and rotate slowly. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Rotator Cuff 전용 머신이 없습니다","verifiedAdjustments":"팔꿈치 패드, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Vitality Multi-Press VSL024BP / Lateral Raise DSL0504 · Vitality / Discovery

🎯 ONE KEY CUE
🔥 "모드를 확인한 뒤 프레스와 레이즈를 분리해 수행"

단일 복합 SKU는 없고 Vitality Multi-Press(VSL024BP)와 DSL0504를 조합한 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 모드/손잡이, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
선택한 모드의 궤적을 끝까지 탄 뒤 복귀.
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
❌ 모드를 바꾸지 않고 궤적을 섞는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Vitality Multi-Press VSL024BP / Lateral Raise DSL0504의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"모드를 확인한 뒤 프레스와 레이즈를 분리해 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Vitality Multi-Press VSL024BP / Lateral Raise DSL0504 · Vitality / Discovery

🎯 ONE KEY CUE
🔥 "Confirm the mode, then run press and raise as separate patterns"

단일 복합 SKU는 없고 Vitality Multi-Press(VSL024BP)와 DSL0504를 조합한 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 모드/손잡이, 스택 핀.
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
🔥 Use the guided path on Vitality Multi-Press VSL024BP / Lateral Raise DSL0504. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Confirm the mode, then run press and raise as separate patterns. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Vitality Multi-Press VSL024BP / Lateral Raise DSL0504","manufacturer":"Precor","productSeries":"Vitality / Discovery","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"단일 복합 SKU는 없고 Vitality Multi-Press(VSL024BP)와 DSL0504를 조합한 패턴입니다","verifiedAdjustments":"시트, 모드/손잡이, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Leg Press DSL0602 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "발바닥 전체를 붙인 채 무릎을 밀었다 제어하며 굽히기"

Discovery Leg Press(DSL0602). 셀렉터 레그 프레스. 셀렉터 스택 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 발 위치, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
플랫폼을 밀어 편 뒤 천천히 굽혀 복귀.
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
❌ 엉덩이를 띄우며 무릎을 안쪽으로 모으는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Select 라인(Discovery Leg Press DSL0602)은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Leg Press DSL0602 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep full foot contact, press out, then control the bend"

Discovery Leg Press(DSL0602). 셀렉터 레그 프레스입니다 Lean into the selectorized stack / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 발 위치, 스택 핀.

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
🔥 On Select (Discovery Leg Press DSL0602), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Leg Press DSL0602","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Leg Press(DSL0602). 셀렉터 레그 프레스입니다","verifiedAdjustments":"시트, 발 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Angled Leg Press DPL0601 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "허리를 붙여 밀고 무릎이 발끝 방향을 유지"

Discovery Plate Loaded Angled Leg Press(DPL0601). 앵글/45도형 레그 프레스. 플레이트 로딩 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
등받이, 발 위치, 안전장치, 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
슬레드를 밀어 올린 뒤 천천히 내리기.
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
❌ 안전장치 없이 깊게 내려가 반동으로 튕기는
템포를 늦추고 같은 궤적만 반복하세요.
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
🔥 Discovery Plate Loaded Angled Leg Press DPL0601은 플레이트 로딩 레그 프레스입니다. 양쪽 원판을 맞춘 뒤, 안전 스톱을 내 가동범위에 먼저 걸고 시작하세요. 첫 2세트는 템포를 늦춰 골반이 뜨는지 확인합니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Angled Leg Press DPL0601 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Keep the low back planted and knees tracking over the toes"

Discovery Plate Loaded Angled Leg Press(DPL0601). 앵글/45도형 레그 프레스입니다 Lean into the plate-loaded / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 등받이, 발 위치, 안전장치, 플레이트. Match plates on both sides — do not load one arm first.

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
🔥 Discovery Plate Loaded Angled Leg Press DPL0601 is plate-loaded. Match both sides, set the safety stops to your range first, and use the first two sets to confirm the pelvis stays down.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Plate Loaded Angled Leg Press DPL0601","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Plate Loaded Angled Leg Press(DPL0601). 앵글/45도형 레그 프레스입니다","verifiedAdjustments":"등받이, 발 위치, 안전장치, 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Leg Press DSL0602 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "시트에 골반을 고정하고 수평으로 밀기"

수평 전용 명칭 SKU 없이 DSL0602 시티드 레그 프레스가 수평에 가깝습니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
수평 궤적에 맞춰 발판 중앙에 발을 안정적으로 두세요. 무릎·발끝 방향을 맞춥니다.
⚙️ 조절 포인트
시트, 발 위치, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
플랫폼을 앞으로 민 뒤 천천히 복귀.
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
❌ 발뒤꿈치를 들며 무릎만 튕기는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Leg Press DSL0602 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Lock the pelvis in the seat and press on a horizontal path"

수평 전용 명칭 SKU 없이 DSL0602 시티드 레그 프레스가 수평에 가깝습니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet on the horizontal path and keep knees tracking with toes.
⚙️ Adjustments
Check 시트, 발 위치, 스택 핀.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Leg Press DSL0602","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"수평 전용 명칭 SKU 없이 DSL0602 시티드 레그 프레스가 수평에 가깝습니다","verifiedAdjustments":"시트, 발 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Hack Squat DPL0603 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "등판에 등을 붙인 채 발뒤꿈치로 밀어 오르기"

Discovery Plate Loaded Hack Squat(DPL0603). 플레이트 로딩 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨 패드, 발 위치, 안전장치, 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
내려앉았다 발뒤꿈치로 밀어 올라 복귀.
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
❌ 무릎만 앞으로 보내며 엉덩이를 뜨게 하는
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
🔥 Discovery Plate Loaded Hack Squat DPL0603은 플레이트 로딩 레그 프레스입니다. 양쪽 원판을 맞춘 뒤, 안전 스톱을 내 가동범위에 먼저 걸고 시작하세요. 첫 2세트는 템포를 늦춰 골반이 뜨는지 확인합니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Hack Squat DPL0603 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Keep the back on the pad and drive up through the heels"

Discovery Plate Loaded Hack Squat(DPL0603)입니다 Lean into the plate-loaded / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨 패드, 발 위치, 안전장치, 플레이트. Match plates on both sides — do not load one arm first.

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
🔥 Discovery Plate Loaded Hack Squat DPL0603 is plate-loaded. Match both sides, set the safety stops to your range first, and use the first two sets to confirm the pelvis stays down.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Plate Loaded Hack Squat DPL0603","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Plate Loaded Hack Squat(DPL0603)입니다","verifiedAdjustments":"어깨 패드, 발 위치, 안전장치, 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Squat Machine DPL0624 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "발 위치를 고정하고 무릎·엉덩이를 함께 펴기"

Discovery Plate Loaded Squat Machine(DPL0624). 플레이트 로딩 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨/등 패드, 발 위치, 안전장치, 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
앉았다 일어서며 슬레드를 밀어 올리기.
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
❌ 무릎만 펴며 허리를 과신전하는
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
🔥 Discovery Plate Loaded Squat Machine DPL0624은 플레이트 로딩 레그 프레스입니다. 양쪽 원판을 맞춘 뒤, 안전 스톱을 내 가동범위에 먼저 걸고 시작하세요. 첫 2세트는 템포를 늦춰 골반이 뜨는지 확인합니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Squat Machine DPL0624 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Fix foot placement and extend the knees and hips together"

Discovery Plate Loaded Squat Machine(DPL0624)입니다 Lean into the plate-loaded / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨/등 패드, 발 위치, 안전장치, 플레이트. Match plates on both sides — do not load one arm first.

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
🔥 Discovery Plate Loaded Squat Machine DPL0624 is plate-loaded. Match both sides, set the safety stops to your range first, and use the first two sets to confirm the pelvis stays down.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Plate Loaded Squat Machine DPL0624","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Plate Loaded Squat Machine(DPL0624)입니다","verifiedAdjustments":"어깨/등 패드, 발 위치, 안전장치, 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 벨트 스쿼트

🎯 ONE KEY CUE
🔥 "벨트로 하중을 받고 상체를 세운 채 앉았다 일어나기"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
벨트, 발 위치, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
앉았다 발뒤꿈치로 일어서며 복귀.
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
❌ 벨트가 느슨한 채 허리를 숙여 당기는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Belt Squat

🎯 ONE KEY CUE
🔥 "Load the belt, keep the torso tall, and squat up and down"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 벨트, 발 위치, 중량.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Belt Squat 전용 SKU가 없습니다","verifiedAdjustments":"벨트, 발 위치, 중량","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Leg Extension DSL0605 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "무릎 축을 맞춘 뒤 발끝을 들어 펴기"

Discovery Leg Extension(DSL0605). Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 무릎 축, 발목 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
정강이를 위로 편 뒤 천천히 굽혀 복귀.
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
❌ 엉덩이를 띄우며 반동으로 펴는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Leg Extension DSL0605의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Leg Extension DSL0605 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Align the knee axis, then extend by lifting the toes"

Discovery Leg Extension(DSL0605)입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 무릎 축, 발목 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Leg Extension DSL0605. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Leg Extension DSL0605","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Leg Extension(DSL0605)입니다","verifiedAdjustments":"시트, 무릎 축, 발목 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Leg Curl DSL0619 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "허벅지 패드를 고정하고 발뒤꿈치를 엉덩이 쪽으로 당기기"

Discovery Seated Leg Curl(DSL0619). Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 발목 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발뒤꿈치를 당겼다 천천히 펴며 복귀.
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
🔥 Discovery Seated Leg Curl DSL0619의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Leg Curl DSL0619 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Lock the thigh pad and curl the heels toward the glutes"

Discovery Seated Leg Curl(DSL0619)입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 허벅지 패드, 발목 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Seated Leg Curl DSL0619. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Seated Leg Curl DSL0619","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Seated Leg Curl(DSL0619)입니다","verifiedAdjustments":"시트, 허벅지 패드, 발목 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Prone Leg Curl DSL0606 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "골반을 패드에 붙인 채 발뒤꿈치를 당기기"

Discovery Prone Leg Curl(DSL0606). 라잉/프라원 레그 컬. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
흉부 패드, 발목 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발뒤꿈치를 올린 뒤 천천히 내리기.
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
❌ 허리를 과하게 아치하며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Prone Leg Curl DSL0606의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Prone Leg Curl DSL0606 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the hips glued to the pad and curl the heels up"

Discovery Prone Leg Curl(DSL0606). 라잉/프라원 레그 컬입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 흉부 패드, 발목 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Prone Leg Curl DSL0606. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Prone Leg Curl DSL0606","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Prone Leg Curl(DSL0606). 라잉/프라원 레그 컬입니다","verifiedAdjustments":"흉부 패드, 발목 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Leg Curl DSL0619 / Prone DSL0606 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "지지 다리를 고정하고 작업 다리만 굽히기"

스탠딩 레그 컬 전용 SKU 없이 DSL0619/DSL0606로 햄스트링 컬 패턴을 대체합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
지지 패드, 발목 패드, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
발뒤꿈치를 당겼다 천천히 펴며 복귀.
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
❌ 몸통을 숙이며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Leg Curl DSL0619 / Prone DSL0606의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Leg Curl DSL0619 / Prone DSL0606 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Brace the support leg and curl only the working leg"

스탠딩 레그 컬 전용 SKU 없이 DSL0619/DSL0606로 햄스트링 컬 패턴을 대체합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 지지 패드, 발목 패드, 스택 핀.
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
🔥 Use the guided path on Discovery Seated Leg Curl DSL0619 / Prone DSL0606. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Leg Curl DSL0619 / Prone DSL0606","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"스탠딩 레그 컬 전용 SKU 없이 DSL0619/DSL0606로 햄스트링 컬 패턴을 대체합니다","verifiedAdjustments":"지지 패드, 발목 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Leg Curl DSL0619 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "한 다리만으로 같은 가동범위를 유지하며 당기기"

싱글 전용 SKU명 없이 DSL0619에서 편측으로 수행하는 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 발목 패드, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
편측 발뒤꿈치를 당겼다 천천히 복귀.
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
❌ 반대쪽 다리를 들어 균형을 무너뜨리는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Leg Curl DSL0619의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Leg Curl DSL0619 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Curl one leg through the same full range every rep"

싱글 전용 SKU명 없이 DSL0619에서 편측으로 수행하는 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 허벅지 패드, 발목 패드, 스택 핀.
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
🔥 Use the guided path on Discovery Seated Leg Curl DSL0619. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Leg Curl DSL0619","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"싱글 전용 SKU명 없이 DSL0619에서 편측으로 수행하는 패턴입니다","verifiedAdjustments":"시트, 허벅지 패드, 발목 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "갈비뼈를 내린 채 엉덩이를 끝까지 밀어 수축"

힙 쓰러스트 전용 SKU 없이 DSL0618 Glute Extension이 가장 가까운 글루트 신전. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 시작 위치, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 밀어 올린 뒤 천천히 복귀.
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
❌ 허리를 과신전하며 무게를 들어올리는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Glute Extension DSL0618의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"갈비뼈를 내린 채 엉덩이를 끝까지 밀어 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the ribs down and drive the hips to a full glute squeeze"

힙 쓰러스트 전용 SKU 없이 DSL0618 Glute Extension이 가장 가까운 글루트 신전입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 시작 위치, 스택 핀.
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
🔥 Use the guided path on Discovery Glute Extension DSL0618. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the ribs down and drive the hips to a full glute squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Glute Extension DSL0618","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"힙 쓰러스트 전용 SKU 없이 DSL0618 Glute Extension이 가장 가까운 글루트 신전입니다","verifiedAdjustments":"패드, 시작 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "발뒤꿈치로 밀어 엉덩이만으로 신전"

글루트 드라이브 명칭 SKU 없이 DSL0618 Glute Extension이 해당 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 발/무릎 위치, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 밀어 편 뒤 천천히 복귀.
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
❌ 무릎만 펴며 대퇴사두로 넘기는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Glute Extension DSL0618의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발뒤꿈치로 밀어 엉덩이만으로 신전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Drive through the heel and extend with the glutes only"

글루트 드라이브 명칭 SKU 없이 DSL0618 Glute Extension이 해당 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 발/무릎 위치, 스택 핀.
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
🔥 Use the guided path on Discovery Glute Extension DSL0618. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Drive through the heel and extend with the glutes only. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Glute Extension DSL0618","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"글루트 드라이브 명칭 SKU 없이 DSL0618 Glute Extension이 해당 패턴입니다","verifiedAdjustments":"패드, 발/무릎 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "골반을 고정하고 다리를 뒤로만 차기"

킥백 전용 SKU 없이 DSL0618의 후방 신전 궤적이 가깝습니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 발목/무릎, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
다리를 뒤로 밀어 올린 뒤 천천히 복귀.
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
❌ 허리를 젖히며 다리를 옆으로 빼는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Glute Extension DSL0618의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반을 고정하고 다리를 뒤로만 차기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Lock the pelvis and kick the leg straight back"

킥백 전용 SKU 없이 DSL0618의 후방 신전 궤적이 가깝습니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 발목/무릎, 스택 핀.
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
🔥 Use the guided path on Discovery Glute Extension DSL0618. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lock the pelvis and kick the leg straight back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Glute Extension DSL0618","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"킥백 전용 SKU 없이 DSL0618의 후방 신전 궤적이 가깝습니다","verifiedAdjustments":"패드, 발목/무릎, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Outer Thigh DSL0621 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "상체를 세운 채 무릎을 바깥으로 벌리기"

Discovery Outer Thigh(DSL0621). 힙 어브덕션. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 무릎/허벅지 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
무릎을 벌렸다 천천히 모으며 복귀.
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
❌ 허리를 비틀며 반동으로 벌리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Outer Thigh DSL0621의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 세운 채 무릎을 바깥으로 벌리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Outer Thigh DSL0621 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the torso tall and open the knees outward"

Discovery Outer Thigh(DSL0621). 힙 어브덕션입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 무릎/허벅지 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Outer Thigh DSL0621. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the torso tall and open the knees outward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Outer Thigh DSL0621","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Outer Thigh(DSL0621). 힙 어브덕션입니다","verifiedAdjustments":"시트, 무릎/허벅지 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Inner Thigh DSL0620 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "상체를 고정하고 무릎을 안쪽으로 모으기"

Discovery Inner Thigh(DSL0620). 힙 어덕션. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 무릎/허벅지 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
무릎을 모았다 천천히 벌리며 복귀.
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
❌ 발을 튕기며 가동범위를 줄이는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Inner Thigh DSL0620의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 고정하고 무릎을 안쪽으로 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Inner Thigh DSL0620 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Brace the torso and squeeze the knees inward"

Discovery Inner Thigh(DSL0620). 힙 어덕션입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 무릎/허벅지 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Inner Thigh DSL0620. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the torso and squeeze the knees inward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Inner Thigh DSL0620","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Inner Thigh(DSL0620). 힙 어덕션입니다","verifiedAdjustments":"시트, 무릎/허벅지 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "힙 신전에 집중해 끝까지 수축"

복합 명칭 SKU 없이 DSL0618 Glute Extension이 글루트/힙 패턴의 기준. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 시작 위치, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 밀어 편 뒤 천천히 복귀.
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
❌ 무릎 굴곡만으로 무게를 움직이는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Glute Extension DSL0618의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"힙 신전에 집중해 끝까지 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Focus on hip extension and finish with a full squeeze"

복합 명칭 SKU 없이 DSL0618 Glute Extension이 글루트/힙 패턴의 기준입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 시작 위치, 스택 핀.
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
🔥 Use the guided path on Discovery Glute Extension DSL0618. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Focus on hip extension and finish with a full squeeze. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Glute Extension DSL0618","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"복합 명칭 SKU 없이 DSL0618 Glute Extension이 글루트/힙 패턴의 기준입니다","verifiedAdjustments":"패드, 시작 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Calf Raise DPL0616 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "발볼로 밀어 올린 뒤 발뒤꿈치를 깊게 내리기"

스탠딩 카프 셀렉터 전용 SKU보다 DPL0616 Calf Raise가 해당합니다. 플레이트 로딩 · 셀렉터 스택 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
어깨/등 패드, 발 위치, 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발뒤꿈치를 올린 뒤 천천히 내리기.
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
❌ 무릎을 굽히며 반동으로 튀는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.
❌ 양쪽 플레이트 무게를 다르게 올리는 것
양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Plate Loaded Calf Raise DPL0616은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Calf Raise DPL0616 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Drive up through the balls of the feet, then lower the heels deep"

스탠딩 카프 셀렉터 전용 SKU보다 DPL0616 Calf Raise가 해당합니다 Lean into the plate-loaded / selectorized stack / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 어깨/등 패드, 발 위치, 플레이트. Match plates on both sides — do not load one arm first.
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
❌ Loading unequal plates
Match both sides, then confirm with a light set.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Plate Loaded Calf Raise DPL0616 is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Plate Loaded Calf Raise DPL0616","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"스탠딩 카프 셀렉터 전용 SKU보다 DPL0616 Calf Raise가 해당합니다","verifiedAdjustments":"어깨/등 패드, 발 위치, 플레이트","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Calf Extension DSL0623 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "무릎 패드를 고정하고 발볼로만 밀기"

Discovery Calf Extension(DSL0623). 시티드 카프 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
시트, 무릎 패드, 발 위치, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발앞쪽으로 민 뒤 발뒤꿈치를 내리며 복귀.
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
❌ 무릎으로 밀며 가동범위를 줄이는
자세가 무너지면 무게를 낮추세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Calf Extension DSL0623의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Calf Extension DSL0623 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Lock the knee pad and press only through the balls of the feet"

Discovery Calf Extension(DSL0623). 시티드 카프 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 시트, 무릎 패드, 발 위치, 스택 핀.

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
🔥 Use the guided path on Discovery Calf Extension DSL0623. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Calf Extension DSL0623","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Calf Extension(DSL0623). 시티드 카프 패턴입니다","verifiedAdjustments":"시트, 무릎 패드, 발 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Vitality Leg Press / Calf Extension VSL010BP · Vitality

🎯 ONE KEY CUE
🔥 "무릎을 살짝 고정한 채 발볼로만 밀기"

레그 프레스 카프 전용 Discovery SKU 없이 Vitality Leg Press/Calf(VSL010BP) 또는 DSL0602에서 카프 변형. Vitality 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
시트, 발 위치, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발앞쪽으로 민 뒤 발뒤꿈치를 내리며 복귀.
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
❌ 무릎을 함께 펴며 레그 프레스로 바꾸는
자세가 무너지면 무게를 낮추세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Vitality Leg Press / Calf Extension VSL010BP의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Vitality Leg Press / Calf Extension VSL010BP · Vitality

🎯 ONE KEY CUE
🔥 "Keep a soft locked knee and press only through the balls of the feet"

레그 프레스 카프 전용 Discovery SKU 없이 Vitality Leg Press/Calf(VSL010BP) 또는 DSL0602에서 카프 변형입니다 Lean into the Vitality design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 시트, 발 위치, 스택 핀.
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
🔥 Use the guided path on Vitality Leg Press / Calf Extension VSL010BP. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Vitality Leg Press / Calf Extension VSL010BP","manufacturer":"Precor","productSeries":"Vitality","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"레그 프레스 카프 전용 Discovery SKU 없이 Vitality Leg Press/Calf(VSL010BP) 또는 DSL0602에서 카프 변형입니다","verifiedAdjustments":"시트, 발 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Biceps Curl DSL0204 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치를 패드에 고정하고 손잡이만 올리기"

Discovery Biceps Curl(DSL0204). Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 올린 뒤 천천히 내리기.
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
❌ 어깨를 들어올리며 반동으로 컬하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Biceps Curl DSL0204의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 패드에 고정하고 손잡이만 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Biceps Curl DSL0204 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Pin the elbows to the pad and curl only the handles"

Discovery Biceps Curl(DSL0204)입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Biceps Curl DSL0204. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pin the elbows to the pad and curl only the handles. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Biceps Curl DSL0204","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Biceps Curl(DSL0204)입니다","verifiedAdjustments":"시트, 팔꿈치 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Benches Preacher Curl Bench DBR0202 · Discovery Benches & Racks

🎯 ONE KEY CUE
🔥 "상완을 패드에 밀착하고 손목을 중립으로 컬"

프리처 컬 셀렉터 SKU 없이 Discovery Preacher Curl Bench(DBR0202)+프리웨이트 패턴. 셀렉터 스택 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 패드, 바/덤벨을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
바를 올린 뒤 천천히 펴며 복귀.
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
❌ 엉덩이를 들며 반동으로 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Select 라인(Discovery Benches Preacher Curl Bench DBR0202)은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상완을 패드에 밀착하고 손목을 중립으로 컬. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Benches Preacher Curl Bench DBR0202 · Discovery Benches & Racks

🎯 ONE KEY CUE
🔥 "Glue the upper arms to the pad and curl with neutral wrists"

프리처 컬 셀렉터 SKU 없이 Discovery Preacher Curl Bench(DBR0202)+프리웨이트 패턴입니다 Lean into the selectorized stack design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 패드, 바/덤벨.
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
🔥 On Select (Discovery Benches Preacher Curl Bench DBR0202), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Glue the upper arms to the pad and curl with neutral wrists. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Benches Preacher Curl Bench DBR0202","manufacturer":"Precor","productSeries":"Discovery Benches & Racks","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"프리처 컬 셀렉터 SKU 없이 Discovery Preacher Curl Bench(DBR0202)+프리웨이트 패턴입니다","verifiedAdjustments":"시트, 암 패드, 바/덤벨","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Biceps Curl DSL0204 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "좌우를 같은 높이로 컬하며 불균형 확인"

공식 Iso-Lateral Curl SKU 없이 DSL0204에서 편측으로 균형을 확인합니다. 좌우가 독립으로 움직이는 · Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 스택 핀을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 올린 뒤 천천히 내리기.
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
❌ 강한 쪽만 먼저 올려 몸통이 기울어지는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Biceps Curl DSL0204 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Curl both sides to the same height and watch for imbalances"

공식 Iso-Lateral Curl SKU 없이 DSL0204에서 편측으로 균형을 확인합니다 Lean into the independent arms / Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 스택 핀. Confirm both sides start from the same position.
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
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Biceps Curl DSL0204","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"공식 Iso-Lateral Curl SKU 없이 DSL0204에서 편측으로 균형을 확인합니다","verifiedAdjustments":"시트, 팔꿈치 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Biceps Curl DSL0204 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "상체를 고정하고 팔꿈치만 굽히기"

암 컬 표기는 DSL0204 Biceps Curl로 매칭합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 올린 뒤 천천히 내리기.
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
❌ 손목을 과도하게 꺾으며 올리는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Biceps Curl DSL0204의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 고정하고 팔꿈치만 굽히기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Biceps Curl DSL0204 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Brace the torso and bend only at the elbows"

암 컬 표기는 DSL0204 Biceps Curl로 매칭합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 스택 핀.
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
🔥 Use the guided path on Discovery Biceps Curl DSL0204. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the torso and bend only at the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Biceps Curl DSL0204","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"암 컬 표기는 DSL0204 Biceps Curl로 매칭합니다","verifiedAdjustments":"시트, 팔꿈치 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.059Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Triceps Extension DSL0208 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치를 고정한 채 손잡이만 앞으로 펴기"

Discovery Triceps Extension(DSL0208). Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
팔을 편 뒤 천천히 굽혀 복귀.
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
❌ 어깨를 앞으로 말리며 반동으로 펴는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Triceps Extension DSL0208의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 고정한 채 손잡이만 앞으로 펴기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Triceps Extension DSL0208 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the elbows fixed and extend only the handles forward"

Discovery Triceps Extension(DSL0208)입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Triceps Extension DSL0208. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the elbows fixed and extend only the handles forward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Triceps Extension DSL0208","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Triceps Extension(DSL0208)입니다","verifiedAdjustments":"시트, 팔꿈치 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Dip DSL0215 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "팔꿈치를 몸통에 붙인 채 아래로 누르기"

트라이셉스 프레스 전용 SKU 없이 DSL0215 Seated Dip이 가까운 누르기 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 아래로 눌렀다 천천히 복귀.
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
❌ 팔꿈치를 밖으로 벌리며 어깨에 넘기는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Dip DSL0215의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 몸통에 붙인 채 아래로 누르기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Dip DSL0215 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep elbows tucked and press downward"

트라이셉스 프레스 전용 SKU 없이 DSL0215 Seated Dip이 가까운 누르기 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 스택 핀.
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
🔥 Use the guided path on Discovery Seated Dip DSL0215. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep elbows tucked and press downward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Dip DSL0215","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"트라이셉스 프레스 전용 SKU 없이 DSL0215 Seated Dip이 가까운 누르기 패턴입니다","verifiedAdjustments":"시트, 손잡이, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Seated Dip DSL0215 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "어깨를 내린 채 팔꿈치로 깊게 내려가기"

DSL0215 Seated Dip이 딥/트라이셉스 머신 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
내린 뒤 팔로 밀어 올려 복귀.
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
❌ 가동범위를 줄인 채 짧게만 튕기는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Seated Dip DSL0215의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"어깨를 내린 채 팔꿈치로 깊게 내려가기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Seated Dip DSL0215 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the shoulders down and descend deep through the elbows"

DSL0215 Seated Dip이 딥/트라이셉스 머신 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이, 스택 핀.
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
🔥 Use the guided path on Discovery Seated Dip DSL0215. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the shoulders down and descend deep through the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Seated Dip DSL0215","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"DSL0215 Seated Dip이 딥/트라이셉스 머신 패턴입니다","verifiedAdjustments":"시트, 손잡이, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Vitality Biceps Curl / Triceps Extension VSL025BP · Vitality

🎯 ONE KEY CUE
🔥 "모드를 확인한 뒤 컬과 익스텐션을 분리 수행"

Discovery 단일 복합 SKU 없이 Vitality Biceps/Triceps(VSL025BP)가 해당합니다. Vitality 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 모드/손잡이, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
선택한 모드의 궤적을 끝까지 탄 뒤 복귀.
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
🔥 Vitality Biceps Curl / Triceps Extension VSL025BP의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"모드를 확인한 뒤 컬과 익스텐션을 분리 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Vitality Biceps Curl / Triceps Extension VSL025BP · Vitality

🎯 ONE KEY CUE
🔥 "Confirm the mode, then run curl and extension as separate patterns"

Discovery 단일 복합 SKU 없이 Vitality Biceps/Triceps(VSL025BP)가 해당합니다 Lean into the Vitality design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 모드/손잡이, 스택 핀.
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
🔥 Use the guided path on Vitality Biceps Curl / Triceps Extension VSL025BP. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Confirm the mode, then run curl and extension as separate patterns. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Vitality Biceps Curl / Triceps Extension VSL025BP","manufacturer":"Precor","productSeries":"Vitality","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery 단일 복합 SKU 없이 Vitality Biceps/Triceps(VSL025BP)가 해당합니다","verifiedAdjustments":"시트, 모드/손잡이, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Abdominal DSL0714 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "갈비뼈를 골반 쪽으로 말아 수축"

앱 크런치 전용 명칭 없이 DSL0714 Abdominal이 크런치 패턴. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 흉부/어깨 패드, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 말아 올린 뒤 천천히 복귀.
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
❌ 목만 당기며 엉덩이를 드는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Abdominal DSL0714의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Abdominal DSL0714 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Curl the ribs toward the pelvis into a crunch"

앱 크런치 전용 명칭 없이 DSL0714 Abdominal이 크런치 패턴입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 흉부/어깨 패드, 스택 핀.
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
🔥 Use the guided path on Discovery Abdominal DSL0714. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Abdominal DSL0714","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"앱 크런치 전용 명칭 없이 DSL0714 Abdominal이 크런치 패턴입니다","verifiedAdjustments":"시트, 흉부/어깨 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Abdominal DSL0714 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "골반을 고정하고 복부로만 말아 올리기"

Discovery Abdominal(DSL0714). Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 흉부/어깨 패드, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 말아 올린 뒤 천천히 복귀.
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
❌ 팔로 패드를 잡아채며 반동으로 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Abdominal DSL0714의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Abdominal DSL0714 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Lock the pelvis and curl up with the abs only"

Discovery Abdominal(DSL0714)입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 흉부/어깨 패드, 스택 핀.

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
🔥 Use the guided path on Discovery Abdominal DSL0714. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Abdominal DSL0714","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Abdominal(DSL0714)입니다","verifiedAdjustments":"시트, 흉부/어깨 패드, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Rotary Torso DSL0315 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "골반을 고정한 채 갈비뼈만 회전"

Discovery Rotary Torso(DSL0315). Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 흉부 패드, 회전 시작, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
좌·우로 회전했다 중앙으로 복귀.
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
❌ 무릎까지 돌리며 반동으로 회전하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Rotary Torso DSL0315의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Rotary Torso DSL0315 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Lock the pelvis and rotate only through the ribcage"

Discovery Rotary Torso(DSL0315)입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 흉부 패드, 회전 시작, 스택 핀.

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
🔥 Use the guided path on Discovery Rotary Torso DSL0315. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Rotary Torso DSL0315","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Rotary Torso(DSL0315)입니다","verifiedAdjustments":"시트, 흉부 패드, 회전 시작, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 사이드 밴드

🎯 ONE KEY CUE
🔥 "골반을 고정하고 옆구리를 짧게 수축"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
손잡이/패드, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 옆으로 숙였다 천천히 복귀.
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
❌ 허리를 앞으로 숙이며 가동범위를 키우는
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
    'en', jsonb_build_array($e$🏋️ PRECOR — Side Bend

🎯 ONE KEY CUE
🔥 "Lock the pelvis and shorten the side body"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 손잡이/패드, 중량.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Side Bend 전용 머신이 없습니다","verifiedAdjustments":"손잡이/패드, 중량","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Back Extension DSL0313 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "엉덩이를 붙인 채 상체를 길게 펴기"

Discovery Back Extension(DSL0313). Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 발/엉덩이 위치, 스택 핀을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 올린 뒤 천천히 숙여 복귀.
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
❌ 목을 젖히며 과신전으로 튕기는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Back Extension DSL0313의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Back Extension DSL0313 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Keep the hips planted and lengthen the torso into extension"

Discovery Back Extension(DSL0313)입니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 발/엉덩이 위치, 스택 핀.

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
🔥 Use the guided path on Discovery Back Extension DSL0313. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Back Extension DSL0313","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Discovery Back Extension(DSL0313)입니다","verifiedAdjustments":"패드, 발/엉덩이 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "허리를 고정하고 엉덩이만 신전"

힙 익스텐션 표기는 DSL0618 Glute Extension으로 매칭합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 시작 위치, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 밀어 편 뒤 천천히 복귀.
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
❌ 무릎을 과도하게 펴며 요추로 넘기는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Glute Extension DSL0618의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"허리를 고정하고 엉덩이만 신전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Glute Extension DSL0618 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Brace the low back and extend only through the hips"

힙 익스텐션 표기는 DSL0618 Glute Extension으로 매칭합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 시작 위치, 스택 핀.
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
🔥 Use the guided path on Discovery Glute Extension DSL0618. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the low back and extend only through the hips. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Glute Extension DSL0618","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"힙 익스텐션 표기는 DSL0618 Glute Extension으로 매칭합니다","verifiedAdjustments":"패드, 시작 위치, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Abdominal DSL0714 / Back Extension DSL0313 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "복근과 신전을 세트로 나누어 각각 끝까지"

단일 복합 SKU 없이 DSL0714 Abdominal과 DSL0313 Back Extension을 조합합니다. Discovery DSL 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트/패드, 모드, 스택 핀을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
선택한 모드의 궤적을 끝까지 탄 뒤 복귀.
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
❌ 한 궤적으로 두 동작을 섞어 버리는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Abdominal DSL0714 / Back Extension DSL0313의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Abdominal DSL0714 / Back Extension DSL0313 · Discovery Selectorized

🎯 ONE KEY CUE
🔥 "Split abs and extension into separate sets and finish each path"

단일 복합 SKU 없이 DSL0714 Abdominal과 DSL0313 Back Extension을 조합합니다 Lean into the Discovery DSL design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트/패드, 모드, 스택 핀.
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
🔥 Use the guided path on Discovery Abdominal DSL0714 / Back Extension DSL0313. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Abdominal DSL0714 / Back Extension DSL0313","manufacturer":"Precor","productSeries":"Discovery Selectorized","sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"단일 복합 SKU 없이 DSL0714 Abdominal과 DSL0313 Back Extension을 조합합니다","verifiedAdjustments":"시트/패드, 모드, 스택 핀","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Precor FTS Glide / Queenax Functional · Functional / Queenax

🎯 ONE KEY CUE
🔥 "풀리 높이를 맞춘 뒤 가슴 앞에서 모아 수축"

Discovery 셀렉터에 Crossover SKU 없음. FTS Glide·Queenax 기능성 스테이션이 케이블 패턴. 셀렉터 스택 · Cable Motion · FTS/Queenax 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
풀리 높이, 손잡이, 스택/중량을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
양손을 모아 조인 뒤 천천히 벌리기.
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
❌ 몸통을 흔들며 팔을 과도하게 뒤로 보내는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Select 라인(Precor FTS Glide / Queenax Functional)은 스택 핀 위치가 곧 시작 난이도입니다. 시트부터 맞춘 뒤 핀을 고르고, 첫 세트에서 궤적이 어깨·관절에 맞는지 확인하세요.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"풀리 높이를 맞춘 뒤 가슴 앞에서 모아 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Precor FTS Glide / Queenax Functional · Functional / Queenax

🎯 ONE KEY CUE
🔥 "Set pulley height, then close and squeeze in front of the chest"

Discovery 셀렉터에 Crossover SKU 없음. FTS Glide·Queenax 기능성 스테이션이 케이블 패턴입니다 Lean into the selectorized stack / Cable Motion / FTS/Queenax design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 풀리 높이, 손잡이, 스택/중량.
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
🔥 On Select (Precor FTS Glide / Queenax Functional), the pin is your difficulty. Fit the seat first, choose the pin second, and confirm the path on set one.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set pulley height, then close and squeeze in front of the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Precor FTS Glide / Queenax Functional","manufacturer":"Precor","productSeries":"Functional / Queenax","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery 셀렉터에 Crossover SKU 없음. FTS Glide·Queenax 기능성 스테이션이 케이블 패턴입니다","verifiedAdjustments":"풀리 높이, 손잡이, 스택/중량","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Precor FTS Glide · Functional

🎯 ONE KEY CUE
🔥 "양측 풀리 높이를 맞춘 뒤 대칭으로 당기기"

Precor FTS Glide 기능성 트레이너가 듀얼 어저스터블 풀리 패턴. FTS/Queenax 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
좌·우 풀리 높이, 손잡이, 스택을 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
선택한 경로로 당겼다 천천히 복귀.
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
❌ 한쪽 풀리만 다르게 두고 몸통이 돌아가는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 Precor FTS Glide의 가이드 궤적을 이용하세요. 첫 2세트는 천천히, 대칭이 확인된 뒤에만 무게를 올립니다.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"양측 풀리 높이를 맞춘 뒤 대칭으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Precor FTS Glide · Functional

🎯 ONE KEY CUE
🔥 "Match both pulley heights, then pull symmetrically"

Precor FTS Glide 기능성 트레이너가 듀얼 어저스터블 풀리 패턴입니다 Lean into the FTS/Queenax design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 좌·우 풀리 높이, 손잡이, 스택.
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
🔥 Use the guided path on Precor FTS Glide. Slow the first two sets, confirm symmetry, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match both pulley heights, then pull symmetrically. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Precor FTS Glide","manufacturer":"Precor","productSeries":"Functional","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Precor FTS Glide 기능성 트레이너가 듀얼 어저스터블 풀리 패턴입니다","verifiedAdjustments":"좌·우 풀리 높이, 손잡이, 스택","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 멀티 정글짐

🎯 ONE KEY CUE
🔥 "스테이션을 정한 뒤 한 동작만 끝까지"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
스테이션, 풀리, 스택을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
선택한 케이블 경로를 당겼다 복귀.
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
❌ 스테이션을 바꾸며 세팅을 대충 넘기는
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

"스테이션을 정한 뒤 한 동작만 끝까지. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Multi Jungle Gym

🎯 ONE KEY CUE
🔥 "Pick one station and finish that one movement path"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
⚙️ Adjustments
Check 스테이션, 풀리, 스택.

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

"Pick one station and finish that one movement path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 멀티 정글짐(4스택 정글) 전용 SKU가 없습니다","verifiedAdjustments":"스테이션, 풀리, 스택","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — 어시스트 풀업 / 딥

🎯 ONE KEY CUE
🔥 "어시스트를 고정하고 풀업·딥을 분리해 수행"

프리코 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎 패드, 그립, 중량을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
올린 뒤 천천히 내려 복귀.
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
❌ 반동으로 몸을 흔들며 가동범위를 줄이는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "어시스트 풀업 / 딥"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"어시스트를 고정하고 풀업·딥을 분리해 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Assisted Pull-up / Dip

🎯 ONE KEY CUE
🔥 "Lock the assist and run pull-ups and dips as separate patterns"

There is no dedicated Precor SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎 패드, 그립, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Assisted Pull-up / Dip", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Lock the assist and run pull-ups and dips as separate patterns. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Precor","productSeries":null,"sourceUrl":"https://static.precor.com/catalog/Precor-2018-Spec-Tables_US%20Version_Final.pdf","verifiedStructure":"Precor Discovery/Resolute 카탈로그에 Assisted Pull-Up/Dip 콤보 전용 SKU가 없습니다","verifiedAdjustments":"무릎 패드, 그립, 중량","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Plate Loaded Smith Machine DPL0802 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "바를 언랙한 뒤 발 위치를 고정하고 수직으로 움직이기"

Discovery Plate Loaded Smith Machine(DPL0802). 플레이트 로딩 · Discovery Plate Loaded 구조입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
바 훅, 안전 스톱, 발 위치, 플레이트를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
바를 내린 뒤 밀어 올려 훅에 걸기.
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
❌ 안전 스톱 없이 깊이만 키우다 바를 놓치는
자세가 무너지면 무게를 낮추세요.
❌ 안전바 높이를 안 맞추고 올리는 것
세트 전에 안전 위치부터 다시 맞추세요.
❌ 좌우 원판 불균형
자세가 무너지면 무게를 낮추세요.
❌ 바 경로와 발 위치가 어긋나는 것
자세가 무너지면 무게를 낮추세요.
❌ 양쪽 플레이트 무게를 다르게 올리는 것
양쪽을 맞춘 뒤 가벼운 세트로 좌우를 확인하세요.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Plate Loaded Smith Machine DPL0802은 플레이트 로딩입니다. 좌우 원판을 동일하게 맞추고, 첫 세트는 궤적·좌우 대칭만 확인한 다음 무게를 올리세요.

---

🎯 MACHINE FIT CHECK
🟢 안전바 → 가동범위에 맞춤
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"바를 언랙한 뒤 발 위치를 고정하고 수직으로 움직이기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Plate Loaded Smith Machine DPL0802 · Discovery Plate Loaded

🎯 ONE KEY CUE
🔥 "Unrack, fix foot placement, and move on a vertical path"

Discovery Plate Loaded Smith Machine(DPL0802)입니다 Lean into the plate-loaded / Discovery Plate Loaded design. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 바 훅, 안전 스톱, 발 위치, 플레이트. Match plates on both sides — do not load one arm first.

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
❌ Loading unequal plates
Match both sides, then confirm with a light set.

---

💡 MACHINE FIT PRO TIP
🔥 Discovery Plate Loaded Smith Machine DPL0802 is plate-loaded. Match plates, confirm path and left-right symmetry on set one, then add load.

---

🎯 MACHINE FIT CHECK
🟢 Safeties → match your range
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Unrack, fix foot placement, and move on a vertical path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"VERIFIED","verifiedModel":"Discovery Plate Loaded Smith Machine DPL0802","manufacturer":"Precor","productSeries":"Discovery Plate Loaded","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Plate Loaded Smith Machine(DPL0802)입니다","verifiedAdjustments":"바 훅, 안전 스톱, 발 위치, 플레이트","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Benches & Racks Line · Discovery Benches & Racks

🎯 ONE KEY CUE
🔥 "제이훅·세이프티를 맞춘 뒤 바 경로만 집중"

Discovery Benches & Racks 라인의 랙/스탠드 구성. 단일 Power Rack SKU명은 카탈로그마다 다릅니다. 프리코 Discovery(DSL)·Resolute(RSL)·Plate Loaded 궤적을 그대로 타는 게 핵심입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
제이훅, 안전 바, 발 위치를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
바를 언랙·리프트·랙하는 경로를 반복.
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
❌ 세이프티 없이 깊이만 키우는
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

"제이훅·세이프티를 맞춘 뒤 바 경로만 집중. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Benches & Racks Line · Discovery Benches & Racks

🎯 ONE KEY CUE
🔥 "Set J-hooks and safeties, then focus only on the bar path"

Discovery Benches & Racks 라인의 랙/스탠드 구성. 단일 Power Rack SKU명은 카탈로그마다 다릅니다 Ride the Precor Discovery (DSL) / Resolute (RSL) / Plate Loaded path instead of fighting it. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 제이훅, 안전 바, 발 위치.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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

"Set J-hooks and safeties, then focus only on the bar path. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Benches & Racks Line","manufacturer":"Precor","productSeries":"Discovery Benches & Racks","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Benches & Racks 라인의 랙/스탠드 구성. 단일 Power Rack SKU명은 카탈로그마다 다릅니다","verifiedAdjustments":"제이훅, 안전 바, 발 위치","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
    'ko', jsonb_build_array($k$🏋️ PRECOR — Discovery Benches & Racks Line · Discovery Benches & Racks

🎯 ONE KEY CUE
🔥 "하프랙 세이프티 높이를 맞춘 뒤 수직으로 움직이기"

Discovery Benches & Racks 하프랙/스쿼트스탠드 계열. 전용 Half Rack SKU명은 카탈로그마다 다릅니다. 프리코 Discovery(DSL)·Resolute(RSL)·Plate Loaded 궤적을 그대로 타는 게 핵심입니다. 처음부터 무게 올리지 말고, 세팅부터 잡으세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
제이훅, 안전 바, 발 위치를 확인하세요.
이 카테고리는 공식 명칭이 겹칠 수 있으니, 헬스장 기구의 실제 레버·패드 배치를 우선하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
바를 언랙·리프트·랙하는 경로를 반복.
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
❌ 바가 랙에서 벗어나도록 앞으로 나오는
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

"하프랙 세이프티 높이를 맞춘 뒤 수직으로 움직이기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ PRECOR — Discovery Benches & Racks Line · Discovery Benches & Racks

🎯 ONE KEY CUE
🔥 "Set half-rack safety height, then move vertically"

Discovery Benches & Racks 하프랙/스쿼트스탠드 계열. 전용 Half Rack SKU명은 카탈로그마다 다릅니다 Ride the Precor Discovery (DSL) / Resolute (RSL) / Plate Loaded path instead of fighting it. Do not chase load until the setup feels locked in.

---

⚙️ ① Setup
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 제이훅, 안전 바, 발 위치.
Naming can overlap in this category — trust the levers and pads on the unit in front of you.

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

"Set half-rack safety height, then move vertically. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"PARTIALLY_VERIFIED","verifiedModel":"Discovery Benches & Racks Line","manufacturer":"Precor","productSeries":"Discovery Benches & Racks","sourceUrl":"https://assets.ctfassets.net/5bv2a78ngtvd/1NfP24or3fPmjV2vYW1uPg/72382f4e5d8d98f7afdd0880987f8dd4/CS-1815-_Precor_2021_Spec_Tables_013122.pdf","verifiedStructure":"Discovery Benches & Racks 하프랙/스쿼트스탠드 계열. 전용 Half Rack SKU명은 카탈로그마다 다릅니다","verifiedAdjustments":"제이훅, 안전 바, 발 위치","importedAt":"2026-08-20T03:36:24.060Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'PRECOR'
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
  WHERE b.code = 'PRECOR'
    AND m.is_active = TRUE
    AND m.pro_tips IS NOT NULL
    AND m.pro_tips_meta IS NOT NULL
    AND m.pro_tips_meta->>'verificationStatus' IS NOT NULL
    AND (m.pro_tips->'ko'->>0) LIKE '%ONE KEY CUE%'
    AND (m.pro_tips->'ko'->>0) LIKE '%MACHINE FIT PRO TIP%'
    AND (m.pro_tips->'ko'->>0) NOT LIKE '%📋 검증 상태%';

  IF updated_count < 80 THEN
    RAISE EXCEPTION 'PRECOR trainer PRO tips import incomplete: % / 80', updated_count;
  END IF;
END $$;
