-- Import FOCUS MachineFit PRO tips (trainer coaching style).
-- Source: database/catalog/pro-tips/focus_pro_tips.csv
-- Backup previous pro_tips / pro_tips_meta before UPDATE.

CREATE TABLE IF NOT EXISTS _backup_focus_pro_tips_20260820 (
  machine_id UUID PRIMARY KEY,
  code TEXT,
  machine_name_ko TEXT,
  pro_tips JSONB,
  pro_tips_meta JSONB,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO _backup_focus_pro_tips_20260820 (machine_id, code, machine_name_ko, pro_tips, pro_tips_meta)
SELECT m.id,
       m.code,
       COALESCE(st.name->>'ko', m.name->>'ko'),
       m.pro_tips,
       m.pro_tips_meta
FROM machines m
JOIN brands b ON b.id = m.brand_id
LEFT JOIN standard_machine_types st ON st.id = m.standard_type_id
WHERE b.code = 'FOCUS'
  AND m.is_active = TRUE
ON CONFLICT (machine_id) DO NOTHING;


UPDATE machines m
SET
  pro_tips = jsonb_build_object(
    'ko', jsonb_build_array($k$🏋️ FOCUS — 체스트 프레스

🎯 ONE KEY CUE
🔥 "견갑을 붙인 채 손잡이를 가슴 중앙으로 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 등판, 시작용 로드 추출 풋 지지, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
손잡이를 앞으로 밀었다 천천히 복귀.
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "체스트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"견갑을 붙인 채 손잡이를 가슴 중앙으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Chest Press

🎯 ONE KEY CUE
🔥 "Brace scapulae and press the handles through center chest"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 등판, 시작용 로드 추출 풋 지지, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Chest Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace scapulae and press the handles through center chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Chest Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 등판, 시작용 로드 추출 풋 지지, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 인클라인 체스트 프레스

🎯 ONE KEY CUE
🔥 "인클라인 궤적에서 쇄골·상부 가슴 방향으로 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 등판 각도, 시작용 로드 추출 풋 지지, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
대각선 위·앞으로 밀었다 복귀.
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
❌ 허리를 과아치해 요추에 힘을 주는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "인클라인 체스트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"인클라인 궤적에서 쇄골·상부 가슴 방향으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Incline Chest Press

🎯 ONE KEY CUE
🔥 "Press along the incline path toward upper chest"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 등판 각도, 시작용 로드 추출 풋 지지, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Incline Chest Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Press along the incline path toward upper chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Incline Chest Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 등판 각도, 시작용 로드 추출 풋 지지, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 디클라인 체스트 프레스

🎯 ONE KEY CUE
🔥 "하부 가슴을 향해 아래·앞으로 통제하며 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 시작를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트/등판, 손잡이 시작, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
디클라인 각도로 밀었다 천천히 복귀.
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
❌ 팔꿈치를 과벌려 어깨에 부하를 주는
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

"하부 가슴을 향해 아래·앞으로 통제하며 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Decline Chest Press

🎯 ONE KEY CUE
🔥 "Press down and forward toward the lower chest with control"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트/등판, 손잡이 시작, 중량.

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

"Press down and forward toward the lower chest with control. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Decline Chest Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트/등판, 손잡이 시작, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 컨버징 체스트 프레스

🎯 ONE KEY CUE
🔥 "넓은 시작에서 중앙으로 모으며 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작 폭, 중량을 확인하세요.

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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "컨버징 체스트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"넓은 시작에서 중앙으로 모으며 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Converging Chest Press

🎯 ONE KEY CUE
🔥 "Start wide and press while converging toward center"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작 폭, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Converging Chest Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Start wide and press while converging toward center. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Converging Chest Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 암 시작 폭, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 아이소래터럴 체스트 프레스

🎯 ONE KEY CUE
🔥 "좌우 암을 같은 속도로 밀며 불균형을 확인"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 독립 암, 시작용 풋 지지, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 밀었다 복귀.
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "아이소래터럴 체스트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Iso-Lateral Chest Press

🎯 ONE KEY CUE
🔥 "Press both independent arms at the same speed and check balance"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 독립 암, 시작용 풋 지지, 중량. Confirm both sides start from the same position.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Iso-Lateral Chest Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Iso-Lateral Chest Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 좌·우 독립 암, 시작용 풋 지지, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 플레이트로드 체스트 프레스

🎯 ONE KEY CUE
🔥 "견갑을 고정한 채 양팔을 고르게 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트/등판, 양쪽 플레이트 로딩, 시작 위치를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
플레이트를 싣고 프레스 후 천천히 복귀.
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
❌ 원판만 늘리고 궤적을 통제하지 않는
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "플레이트로드 체스트 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"견갑을 고정한 채 양팔을 고르게 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Plate-Loaded Chest Press

🎯 ONE KEY CUE
🔥 "Keep scapulae set and press both arms evenly"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트/등판, 양쪽 플레이트 로딩, 시작 위치. Match plates on both sides — do not load one arm first.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Plate-Loaded Chest Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Plates → matched
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep scapulae set and press both arms evenly. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Plate-Loaded Chest Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트/등판, 양쪽 플레이트 로딩, 시작 위치","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 펙덱

🎯 ONE KEY CUE
🔥 "팔꿈치를 패드에 붙인 채 가슴 앞에서 모으기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
팔 패드 높이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔 패드 높이, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
양팔을 벌린 상태에서 앞으로 모았다 벌리기.
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
❌ 어깨를 으쓱하며 승모로 당기는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "펙덱"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 패드에 붙인 채 가슴 앞에서 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Pec Deck

🎯 ONE KEY CUE
🔥 "Keep elbows on the pads and bring the arms together in front of the chest"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔 패드 높이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Pec Deck", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep elbows on the pads and bring the arms together in front of the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Pec Deck 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 팔 패드 높이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 리어 델트 / 리버스 펙덱

🎯 ONE KEY CUE
🔥 "가슴을 패드에 붙이고 견갑을 모으며 팔을 뒤로 벌리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 손잡이/암, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
앞으로 모은 손잡이를 뒤로 벌렸다 복귀.
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
❌ 상체를 흔들며 반동으로 벌리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "리어 델트 / 리버스 펙덱"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 패드에 붙이고 견갑을 모으며 팔을 뒤로 벌리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Rear Delt / Reverse Pec Deck

🎯 ONE KEY CUE
🔥 "Keep the chest on the pad and open the arms back while retracting scapulae"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 손잡이/암, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Rear Delt / Reverse Pec Deck", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the chest on the pad and open the arms back while retracting scapulae. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Rear Delt / Reverse Pec Deck 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 손잡이/암, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 플라이 머신

🎯 ONE KEY CUE
🔥 "팔꿈치를 약간 굽힌 채 가슴 앞에서 호를 그리며 모으기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 시작 위치, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
양팔을 벌렸다 앞으로 모으며 복귀.
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
❌ 팔꿈치를 펴고 어깨만으로 모으는
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 앞으로 말며 반동으로 미는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리를 과하게 아치해 가슴 대신 요추로 미는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 끝에서 어깨를 더 밀어 넣는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "플라이 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 약간 굽힌 채 가슴 앞에서 호를 그리며 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Fly Machine

🎯 ONE KEY CUE
🔥 "With soft elbows, arc the arms together in front of the chest"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 시작 위치, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Fly Machine", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"With soft elbows, arc the arms together in front of the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Fly Machine 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 암 시작 위치, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 딥 머신

🎯 ONE KEY CUE
🔥 "팔꿈치를 몸통 가까이 두고 손잡이를 아래로 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 폭를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 손잡이 폭, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
앉은 채 딥 궤적으로 밀었다 천천히 복귀.
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "딥 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 몸통 가까이 두고 손잡이를 아래로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Dip Machine

🎯 ONE KEY CUE
🔥 "Keep elbows close to the torso and press the handles down"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 손잡이 폭, 중량.

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

"Keep elbows close to the torso and press the handles down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Dip Machine 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 손잡이 폭, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 어시스트 딥

🎯 ONE KEY CUE
🔥 "보조 무게로 깊이를 통제하며 딥 핸들을 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎/보조 패드, 손잡이, 보조 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
보조 패드로 하강 후 딥 핸들을 밀어 올리기.
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
❌ 보조를 과도히 줄여 어깨가 무너지는
자세가 무너지면 무게를 낮추세요.
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

"보조 무게로 깊이를 통제하며 딥 핸들을 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Assisted Dip

🎯 ONE KEY CUE
🔥 "Use assist load to control depth while pressing the dip handles"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎/보조 패드, 손잡이, 보조 중량.

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

"Use assist load to control depth while pressing the dip handles. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Assisted Dip 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"무릎/보조 패드, 손잡이, 보조 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 슈퍼 인클라인 프레스

🎯 ONE KEY CUE
🔥 "가파른 인클라인에서 상부 가슴·전면 삼각으로 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 고각도 등판, 시작용 풋 지지, 중량을 확인하세요.

---

💪 ② 시작 자세
등과 골반을 패드에 붙이고, 손잡이가 가슴 높이에 오게 잡습니다.
이 자세에서 이것만 확인하세요.
👉 등이 패드에서 뜨지 않는지

---

🔥 ③ 운동 방법
가파른 대각선으로 밀었다 복귀.
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
❌ 각도를 무시하고 수평 프레스처럼 미는
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

"가파른 인클라인에서 상부 가슴·전면 삼각으로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Super Incline Press

🎯 ONE KEY CUE
🔥 "Press on a steep incline toward upper chest and front delts"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 고각도 등판, 시작용 풋 지지, 중량.

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

"Press on a steep incline toward upper chest and front delts. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Super Incline Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 고각도 등판, 시작용 풋 지지, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 랫풀다운

🎯 ONE KEY CUE
🔥 "가슴을 열고 팔꿈치를 옆구리로 내리며 바를 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
허벅지 고정 패드, 시트, 그립, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
바를 쇄골 쪽으로 당겼다 천천히 올리기.
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
❌ 상체를 크게 젖히며 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "랫풀다운"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 열고 팔꿈치를 옆구리로 내리며 바를 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Lat Pulldown

🎯 ONE KEY CUE
🔥 "Open the chest and drive elbows to the ribs while pulling the bar down"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 허벅지 고정 패드, 시트, 그립, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Lat Pulldown", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Open the chest and drive elbows to the ribs while pulling the bar down. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Lat Pulldown 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"허벅지 고정 패드, 시트, 그립, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 와이드 랫풀다운

🎯 ONE KEY CUE
🔥 "와이드 그립으로 팔꿈치를 아래로 내리며 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
허벅지 고정 패드, 와이드 바, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
와이드 그립으로 바를 내렸다 올리기.
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
❌ 손만 넓히고 팔꿈치가 앞으로 나가는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "와이드 랫풀다운"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"와이드 그립으로 팔꿈치를 아래로 내리며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Wide Lat Pulldown

🎯 ONE KEY CUE
🔥 "With a wide grip, drive the elbows down while pulling"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 허벅지 고정 패드, 와이드 바, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Wide Lat Pulldown", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"With a wide grip, drive the elbows down while pulling. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Wide Lat Pulldown 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"허벅지 고정 패드, 와이드 바, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 프론트 풀다운

🎯 ONE KEY CUE
🔥 "바를 쇄골 앞쪽으로 당기며 광배를 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
허벅지 고정 패드, 시트, 바, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
앞에서 아래로 당겼다 천천히 복귀.
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
❌ 바를 목 뒤로 넘겨 어깨를 위험하게 하는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "프론트 풀다운"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"바를 쇄골 앞쪽으로 당기며 광배를 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Front Pulldown

🎯 ONE KEY CUE
🔥 "Pull the bar to the front of the collarbone and squeeze the lats"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 허벅지 고정 패드, 시트, 바, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Front Pulldown", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pull the bar to the front of the collarbone and squeeze the lats. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Front Pulldown 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"허벅지 고정 패드, 시트, 바, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 아이소래터럴 랫풀다운

🎯 ONE KEY CUE
🔥 "좌우를 같은 깊이로 당기며 광배 균형을 확인"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 허벅지 패드, 좌·우 독립 암, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "아이소래터럴 랫풀다운"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Iso-Lateral Lat Pulldown

🎯 ONE KEY CUE
🔥 "Pull both sides to the same depth and check lat balance"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 허벅지 패드, 좌·우 독립 암, 중량. Confirm both sides start from the same position.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Iso-Lateral Lat Pulldown", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Iso-Lateral Lat Pulldown 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 허벅지 패드, 좌·우 독립 암, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 하이로우

🎯 ONE KEY CUE
🔥 "높은 시작에서 팔꿈치를 옆구리로 당기며 광배·후면 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
위에서 아래로·뒤로 당겼다 복귀.
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
❌ 손을 얼굴 쪽으로만 당겨 승모만 쓰는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "하이로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"높은 시작에서 팔꿈치를 옆구리로 당기며 광배·후면 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — High Row

🎯 ONE KEY CUE
🔥 "From a high start, pull elbows to the ribs and squeeze mid-back"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "High Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"From a high start, pull elbows to the ribs and squeeze mid-back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 High Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 아이소래터럴 하이로우

🎯 ONE KEY CUE
🔥 "독립 암으로 높은 궤적 로우를 좌우 균등하게"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 가슴 패드, 좌·우 독립 암, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

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
❌ 한쪽만 먼저 당겨 비대칭을 키우는
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "아이소래터럴 하이로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Iso-Lateral High Row

🎯 ONE KEY CUE
🔥 "Row both independent high-path arms evenly"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 가슴 패드, 좌·우 독립 암, 중량. Confirm both sides start from the same position.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Iso-Lateral High Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Iso-Lateral High Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 좌·우 독립 암, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 시티드 로우

🎯 ONE KEY CUE
🔥 "가슴을 패드에 붙이고 팔꿈치로 당기며 견갑을 모으기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 풋 지지, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 몸통으로 당겼다 천천히 뻗기.
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
❌ 상체를 뒤로 젖혀 반동으로 당기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "시티드 로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 패드에 붙이고 팔꿈치로 당기며 견갑을 모으기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Seated Row

🎯 ONE KEY CUE
🔥 "Keep the chest on the pad and row with the elbows while retracting scapulae"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 풋 지지, 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Seated Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the chest on the pad and row with the elbows while retracting scapulae. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Seated Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 풋 지지, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 로우 머신

🎯 ONE KEY CUE
🔥 "중립 자세에서 팔꿈치로 당기며 중부 등을 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 풋 지지, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
손잡이를 당겼다 통제하며 복귀.
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
❌ 손만 당겨 전완만 피로해지는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "로우 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"중립 자세에서 팔꿈치로 당기며 중부 등을 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Row Machine

🎯 ONE KEY CUE
🔥 "From a neutral setup, row with the elbows and squeeze mid-back"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 풋 지지, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Row Machine", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"From a neutral setup, row with the elbows and squeeze mid-back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Row Machine 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 풋 지지, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 로우 로우

🎯 ONE KEY CUE
🔥 "낮은 케이블에서 팔꿈치를 뒤로 보내며 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
낮은 손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 낮은 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
낮은 위치에서 당겼다 천천히 뻗기.
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
❌ 허리를 과도히 젖혀 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "로우 로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"낮은 케이블에서 팔꿈치를 뒤로 보내며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Low Row

🎯 ONE KEY CUE
🔥 "From the low cable, drive the elbows back while rowing"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 낮은 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Low Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"From the low cable, drive the elbows back while rowing. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Low Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 낮은 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 미드 로우

🎯 ONE KEY CUE
🔥 "중간 높이 궤적으로 팔꿈치를 뒤로 보내며 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
미드 손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 미드 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
중간 높이에서 당겼다 복귀.
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
❌ 손잡이만 올리고 견갑이 안 모이는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "미드 로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"중간 높이 궤적으로 팔꿈치를 뒤로 보내며 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Mid Row

🎯 ONE KEY CUE
🔥 "Row on a mid-height path by driving the elbows back"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 미드 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Mid Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Row on a mid-height path by driving the elbows back. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Mid Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 미드 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 아이소래터럴 로우

🎯 ONE KEY CUE
🔥 "좌우를 같은 속도로 당기며 등 균형을 확인"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 가슴 패드, 좌·우 독립 암, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

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
❌ 강한 쪽만 깊게 당기는
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "아이소래터럴 로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Iso-Lateral Row

🎯 ONE KEY CUE
🔥 "Row both sides at the same speed and check back balance"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 가슴 패드, 좌·우 독립 암, 중량. Confirm both sides start from the same position.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Iso-Lateral Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Iso-Lateral Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 좌·우 독립 암, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 아이소래터럴 로우 로우

🎯 ONE KEY CUE
🔥 "낮은 독립 암 로우로 좌우를 균등히 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 가슴 패드, 좌·우 낮은 암, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
각 팔을 낮은 궤적으로 당겼다 복귀.
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
❌ 한쪽만 먼저 당겨 비대칭을 키우는
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "아이소래터럴 로우 로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 당김 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Iso-Lateral Low Row

🎯 ONE KEY CUE
🔥 "Row both independent low-path arms evenly"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 가슴 패드, 좌·우 낮은 암, 중량. Confirm both sides start from the same position.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Iso-Lateral Low Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → pull direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Iso-Lateral Low Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 좌·우 낮은 암, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 체스트 서포티드 로우

🎯 ONE KEY CUE
🔥 "가슴 패드를 유지한 채 팔꿈치로만 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
가슴 패드 높이, 시트, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
가슴 지지 상태에서 당겼다 뻗기.
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
❌ 패드를 떼고 상체로 당기는
자세가 무너지면 무게를 낮추세요.
❌ 몸을 뒤로 젖혀 반동으로 당기는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 어깨를 으쓱하며 승모근만 쓰는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 손잡이만 당기고 팔꿈치는 안 움직이는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "체스트 서포티드 로우"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 가슴 → 패드에 고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴은 패드에, 팔꿈치는 뒤로, 끝에서 1초."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Chest Supported Row

🎯 ONE KEY CUE
🔥 "Keep contact with the chest pad and row only with the elbows"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 가슴 패드 높이, 시트, 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Chest Supported Row", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Chest → glued to pad
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Chest on the pad, elbows back, one-second squeeze."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Chest Supported Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"가슴 패드 높이, 시트, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — T바 로우 머신

🎯 ONE KEY CUE
🔥 "상체를 고정하고 팔꿈치로 바를 몸통으로 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
가슴 패드, 스탠스, 플레이트, 손잡이를 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
T바를 몸통으로 당겼다 천천히 내리기.
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
❌ 허리를 과도히 말며 반동하는
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

"상체를 고정하고 팔꿈치로 바를 몸통으로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — T-Bar Row

🎯 ONE KEY CUE
🔥 "Brace the torso and row the bar to the body with the elbows"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 가슴 패드, 스탠스, 플레이트, 손잡이.

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

"Brace the torso and row the bar to the body with the elbows. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 T-Bar Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"가슴 패드, 스탠스, 플레이트, 손잡이","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 풀오버

🎯 ONE KEY CUE
🔥 "갈비뼈를 내린 채 팔꿈치를 큰 호로 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
팔 패드를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔 패드, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
머리 위쪽에서 옆구리 쪽으로 호를 그리며 당기기.
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
❌ 허리를 과아치해 요추로 버티는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
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

"갈비뼈를 내린 채 팔꿈치를 큰 호로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Pullover

🎯 ONE KEY CUE
🔥 "Keep the ribs down and sweep the elbows through a large arc"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔 패드, 가동 범위, 중량.

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

"Keep the ribs down and sweep the elbows through a large arc. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Pullover 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 팔 패드, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 어시스트 풀업 / 친업

🎯 ONE KEY CUE
🔥 "보조 무게로 턱걸이 깊이를 통제하며 가슴을 바 쪽으로"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
가슴/등 패드에 몸을 안정적으로 붙이세요. 패드에서 몸이 들리면 반동이 들어갑니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎/보조 패드, 그립, 보조 중량을 확인하세요.

---

💪 ② 시작 자세
가슴을 세우고 어깨를 귀에서 멀리 둡니다. 팔보다 등부터 준비합니다.
이 자세에서 이것만 확인하세요.
👉 어깨가 귀 쪽으로 올라가지 않는지

---

🔥 ③ 운동 방법
보조 패드로 매달린 채 바를 당겼다 내리기.
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
❌ 반동으로 몸을 흔들며 올라가는
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

"보조 무게로 턱걸이 깊이를 통제하며 가슴을 바 쪽으로. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Assisted Pull-up / Chin-up

🎯 ONE KEY CUE
🔥 "Use assist load to control chin-up depth and pull the chest to the bar"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Pin yourself to the chest/back pad. If you lift off the pad, you are cheating with momentum.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎/보조 패드, 그립, 보조 중량.

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

"Use assist load to control chin-up depth and pull the chest to the bar. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Assisted Pull-up / Chin-up 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"무릎/보조 패드, 그립, 보조 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 숄더 프레스

🎯 ONE KEY CUE
🔥 "코어를 고정한 채 손잡이를 귀 옆에서 위로 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이 시작를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 등판, 손잡이 시작, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
위로 밀었다 천천히 귀 옆까지 복귀.
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
❌ 허리를 과아치해 요추로 미는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "숄더 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"코어를 고정한 채 손잡이를 귀 옆에서 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Shoulder Press

🎯 ONE KEY CUE
🔥 "Brace the core and press the handles up from beside the ears"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 등판, 손잡이 시작, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Shoulder Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the core and press the handles up from beside the ears. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Shoulder Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 등판, 손잡이 시작, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 아이소래터럴 숄더 프레스

🎯 ONE KEY CUE
🔥 "좌우를 같은 높이로 밀며 어깨 균형을 확인"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 독립 암, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

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
❌ 한쪽만 먼저 밀어 비대칭을 키우는
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "아이소래터럴 숄더 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 좌우 → 같은 속도
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"좌우 같은 속도, 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Iso-Lateral Shoulder Press

🎯 ONE KEY CUE
🔥 "Press both sides to the same height and check shoulder balance"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 독립 암, 중량. Confirm both sides start from the same position.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Iso-Lateral Shoulder Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Left/right → same speed
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Match sides, one-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Iso-Lateral Shoulder Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 좌·우 독립 암, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 플레이트로드 숄더 프레스

🎯 ONE KEY CUE
🔥 "팔꿈치를 앞으로 과도히 보내지 않고 위로 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 양쪽 플레이트, 손잡이를 확인하세요. 양쪽 플레이트를 동일하게 맞추고, 한쪽만 먼저 올리지 마세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
플레이트를 싣고 위로 밀었다 복귀.
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
❌ 원판만 늘리고 가동범위를 줄이는
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "플레이트로드 숄더 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 원판 → 좌우 동일
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 앞으로 과도히 보내지 않고 위로 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Plate-Loaded Shoulder Press

🎯 ONE KEY CUE
🔥 "Press upward without letting the elbows drift too far forward"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 양쪽 플레이트, 손잡이. Match plates on both sides — do not load one arm first.

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

"Press upward without letting the elbows drift too far forward. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Plate-Loaded Shoulder Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 양쪽 플레이트, 손잡이","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 레터럴 레이즈

🎯 ONE KEY CUE
🔥 "팔꿈치를 약간 굽힌 채 측면으로 어깨 높이까지 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
팔 패드 높이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔 패드 높이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
양팔을 옆으로 올렸다 천천히 내리기.
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
❌ 승모로 으쓱하며 올리는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "레터럴 레이즈"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 약간 굽힌 채 측면으로 어깨 높이까지 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Lateral Raise

🎯 ONE KEY CUE
🔥 "With soft elbows, raise the arms laterally to shoulder height"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔 패드 높이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Lateral Raise", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"With soft elbows, raise the arms laterally to shoulder height. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Lateral Raise 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 팔 패드 높이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 머신 레터럴 레이즈

🎯 ONE KEY CUE
🔥 "덤벨처럼 흔들지 말고 패드 궤적을 따라 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 암 패드, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
패드를 따라 측면으로 올렸다 복귀.
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
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "머신 레터럴 레이즈"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"덤벨처럼 흔들지 말고 패드 궤적을 따라 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Machine Lateral Raise

🎯 ONE KEY CUE
🔥 "Follow the pad path and avoid swinging like dumbbells"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 암 패드, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Machine Lateral Raise", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Follow the pad path and avoid swinging like dumbbells. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Machine Lateral Raise 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 암 패드, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 리어 델트

🎯 ONE KEY CUE
🔥 "가슴을 고정하고 후면 삼각으로 팔을 뒤로 벌리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 가슴 패드, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
앞으로 모은 팔을 뒤로 벌렸다 복귀.
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
❌ 허리 힘으로 상체를 돌리는
자세가 무너지면 무게를 낮추세요.
❌ 허리를 꺾어 프레스하는 것
자세가 무너지면 무게를 낮추세요.
❌ 어깨를 귀 쪽으로 으쓱하는 것
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 반동으로 들어 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "리어 델트"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가슴을 고정하고 후면 삼각으로 팔을 뒤로 벌리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Rear Delt

🎯 ONE KEY CUE
🔥 "Brace the chest and open the arms back with the rear delts"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 가슴 패드, 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Rear Delt", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the chest and open the arms back with the rear delts. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Rear Delt 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴 패드, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 프론트 레이즈

🎯 ONE KEY CUE
🔥 "전면 삼각으로 팔을 앞으로 어깨 높이까지 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
앞으로 올렸다 천천히 내리기.
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

"전면 삼각으로 팔을 앞으로 어깨 높이까지 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Front Raise

🎯 ONE KEY CUE
🔥 "Raise the arms forward to shoulder height with the front delts"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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

"Raise the arms forward to shoulder height with the front delts. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Front Raise 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트/스탠스, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 업라이트 로우

🎯 ONE KEY CUE
🔥 "팔꿈치를 위로 리드하며 바를 가슴 높이로 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
아래에서 가슴 높이로 당겼다 복귀.
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
❌ 손목만 구부려 전완만 쓰는
자세가 무너지면 무게를 낮추세요.
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

"팔꿈치를 위로 리드하며 바를 가슴 높이로 당기기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Upright Row

🎯 ONE KEY CUE
🔥 "Lead with the elbows and pull the bar to chest height"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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

"Lead with the elbows and pull the bar to chest height. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Upright Row 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"스탠스, 그립 폭, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 로테이터 머신

🎯 ONE KEY CUE
🔥 "팔꿈치를 옆구리에 고정한 채 천천히 외·내회전"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 패드, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
고정된 팔꿈치로 회전했다 복귀.
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
❌ 무거운 무게로 빠르게 회전하는
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

"팔꿈치를 옆구리에 고정한 채 천천히 외·내회전. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Rotator Machine

🎯 ONE KEY CUE
🔥 "Keep the elbow fixed at the side and rotate slowly in and out"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 패드, 가동 범위, 중량.

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

"Keep the elbow fixed at the side and rotate slowly in and out. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Rotator Machine 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 팔꿈치 패드, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 숄더 프레스 / 레터럴 복합 머신

🎯 ONE KEY CUE
🔥 "선택한 모드에 맞춰 프레스 또는 측면 거상을 분리 수행"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 모드 전환, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
갈비뼈를 내리고 허리를 과하게 아치하지 않습니다. 팔꿈치를 시작 궤적에 올립니다.
이 자세에서 이것만 확인하세요.
👉 허리가 과하게 꺾이지 않는지

---

🔥 ③ 운동 방법
프레스 궤적과 레터럴 궤적을 구분해 수행.
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
❌ 모드를 혼용해 궤적을 흐리는
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

"선택한 모드에 맞춰 프레스 또는 측면 거상을 분리 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Shoulder Press / Lateral Combo

🎯 ONE KEY CUE
🔥 "Perform press or lateral raise separately according to the selected mode"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 모드 전환, 손잡이, 중량.

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

"Perform press or lateral raise separately according to the selected mode. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Shoulder Press / Lateral Combo 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 모드 전환, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 레그 프레스

🎯 ONE KEY CUE
🔥 "허리를 등판에 붙인 채 발바닥 전체로 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트/등판 각도, 풋 플랫폼, 안전 스토퍼, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
플랫폼을 밀었다 통제하며 접기.
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
❌ 무릎을 안쪽으로 모으며 미는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "레그 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Leg Press

🎯 ONE KEY CUE
🔥 "Keep the low back on the pad and drive through the whole foot"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트/등판 각도, 풋 플랫폼, 안전 스토퍼, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Leg Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Leg Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트/등판 각도, 풋 플랫폼, 안전 스토퍼, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 45도 레그 프레스

🎯 ONE KEY CUE
🔥 "발 위치를 안정히 두고 무릎이 발끝 방향으로 움직이게"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
등판, 풋 플랫폼 위치, 안전 스토퍼, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
45도 슬레드를 밀었다 천천히 내리기.
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
❌ 엉덩이가 들뜨며 허리가 뜨는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "45도 레그 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — 45° Leg Press

🎯 ONE KEY CUE
🔥 "Set a stable foot position and track the knees over the toes"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 등판, 풋 플랫폼 위치, 안전 스토퍼, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "45° Leg Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 45° Leg Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"등판, 풋 플랫폼 위치, 안전 스토퍼, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 수평 레그 프레스

🎯 ONE KEY CUE
🔥 "발 전체를 붙인 채 수평으로 밀고 무릎을 완전히 잠그지 않기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
수평 궤적에 맞춰 발판 중앙에 발을 안정적으로 두세요. 무릎·발끝 방향을 맞춥니다.
⚙️ 조절 포인트
시트, 풋 플랫폼, 안전 스토퍼, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
수평으로 밀었다 천천히 접기.
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
❌ 발뒤꿈치만으로 밀어 무릎에 충격을 주는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "수평 레그 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반은 시트에, 발 전체로 수평으로 밀고, 복귀는 2~3초."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Horizontal Leg Press

🎯 ONE KEY CUE
🔥 "Keep the whole foot planted, press horizontally, and avoid locking the knees"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet on the horizontal path and keep knees tracking with toes.
⚙️ Adjustments
Check 시트, 풋 플랫폼, 안전 스토퍼, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Horizontal Leg Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Pelvis glued, whole-foot horizontal drive, 2–3 sec return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Horizontal Leg Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 풋 플랫폼, 안전 스토퍼, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 핵 스쿼트

🎯 ONE KEY CUE
🔥 "발 위치를 고정하고 무릎이 발끝과 같은 방향으로 앉았다 일어나기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨 패드, 등판, 풋 플랫폼, 안전 스토퍼를 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
슬레드를 내려 앉았다 밀어 올리기.
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
❌ 무릎만 과도히 앞으로 보내 뒤꿈치가 뜨는
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
    'en', jsonb_build_array($e$🏋️ FOCUS — Hack Squat

🎯 ONE KEY CUE
🔥 "Fix foot placement and squat with knees tracking over the toes"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨 패드, 등판, 풋 플랫폼, 안전 스토퍼.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Hack Squat 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"어깨 패드, 등판, 풋 플랫폼, 안전 스토퍼","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 스쿼트 프레스

🎯 ONE KEY CUE
🔥 "상체를 패드에 붙인 채 스쿼트 궤적으로 밀어 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
어깨/등 패드, 풋 플랫폼, 안전 스토퍼, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
내려 앉았다 밀어 올리기.
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
❌ 반동으로 무릎을 튕기는
템포를 늦추고 같은 궤적만 반복하세요.
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
    'en', jsonb_build_array($e$🏋️ FOCUS — Squat Press

🎯 ONE KEY CUE
🔥 "Keep the torso on the pads and drive up through a squat path"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 어깨/등 패드, 풋 플랫폼, 안전 스토퍼, 중량.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Squat Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"어깨/등 패드, 풋 플랫폼, 안전 스토퍼, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 벨트 스쿼트

🎯 ONE KEY CUE
🔥 "벨트로 하중을 받고 상체 부담을 줄인 채 스쿼트"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
벨트 높이, 풋 스탠스, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
벨트를 찬 채 앉았다 일어나기.
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
❌ 벨트가 헐거워 하중이 흔들리는
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
    'en', jsonb_build_array($e$🏋️ FOCUS — Belt Squat

🎯 ONE KEY CUE
🔥 "Load through the belt and squat with less axial spine load"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 벨트 높이, 풋 스탠스, 중량.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Belt Squat 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"벨트 높이, 풋 스탠스, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 레그 익스텐션

🎯 ONE KEY CUE
🔥 "엉덩이를 시트에 붙인 채 무릎을 펴 대퇴사두 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 무릎 축 정렬, 발목 롤러, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
무릎을 펴 올렸다 천천히 접기.
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
❌ 상체를 뒤로 젖혀 반동으로 펴는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "레그 익스텐션"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Leg Extension

🎯 ONE KEY CUE
🔥 "Keep the hips on the seat and extend the knees to squeeze the quads"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 무릎 축 정렬, 발목 롤러, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Leg Extension", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Leg Extension 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 무릎 축 정렬, 발목 롤러, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 시티드 레그 컬

🎯 ONE KEY CUE
🔥 "앉은 채 발뒤꿈치를 엉덩이 쪽으로 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트, 무릎 축, 발목 롤러, 허벅지 패드, 중량을 확인하세요.

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
❌ 엉덩이가 들뜨며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "시티드 레그 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Seated Leg Curl

🎯 ONE KEY CUE
🔥 "From a seated position, curl the heels toward the glutes"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트, 무릎 축, 발목 롤러, 허벅지 패드, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Seated Leg Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Seated Leg Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 무릎 축, 발목 롤러, 허벅지 패드, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 라잉 레그 컬

🎯 ONE KEY CUE
🔥 "골반을 패드에 붙인 채 발뒤꿈치를 엉덩이로 당기기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
골반 패드, 발목 롤러, 무릎 축, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
엎드린 채 컬했다 천천히 펴기.
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
❌ 허리를 과아치해 요추로 당기는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "라잉 레그 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Lying Leg Curl

🎯 ONE KEY CUE
🔥 "Keep the hips on the pad and curl the heels toward the glutes"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 골반 패드, 발목 롤러, 무릎 축, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Lying Leg Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Lying Leg Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"골반 패드, 발목 롤러, 무릎 축, 중량","importedAt":"2026-08-20T04:58:16.936Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 스탠딩 레그 컬

🎯 ONE KEY CUE
🔥 "지지 다리를 고정하고 한쪽씩 발뒤꿈치를 위로 컬"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
골반/허벅지 지지, 발목 롤러, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
한쪽 무릎을 굽혀 올렸다 내리기.
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
❌ 상체를 앞으로 과도히 숙이며 반동하는
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
    'en', jsonb_build_array($e$🏋️ FOCUS — Standing Leg Curl

🎯 ONE KEY CUE
🔥 "Brace the support leg and curl one heel up at a time"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 골반/허벅지 지지, 발목 롤러, 중량.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Standing Leg Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"골반/허벅지 지지, 발목 롤러, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 싱글 레그 컬

🎯 ONE KEY CUE
🔥 "한쪽에 집중해 슬굴곡근을 끝까지 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
발판 중앙에 발을 두고, 무릎이 발끝 방향으로 가게 맞추세요. 너무 높거나 낮으면 골반이 먼저 뜹니다.
⚙️ 조절 포인트
시트/지지, 발목 롤러, 무릎 축, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 시트/패드에 붙이고 발 전체로 발판을 느낍니다. 무릎·발끝 방향을 맞춥니다.
이 자세에서 이것만 확인하세요.
👉 골반이 말리지 않는 깊이인지

---

🔥 ③ 운동 방법
한쪽씩 컬했다 천천히 펴기.
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
❌ 양다리를 동시에 흔들며 통제를 잃는
자세가 무너지면 깊이·무게를 줄이세요.
❌ 무릎이 안쪽으로 무너지는 것
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 하부 범위에서 요추가 뜨거나 골반이 말리는 것
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 무릎을 강하게 잠그며 튕기는 것
자세가 무너지면 깊이·무게를 줄이세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "싱글 레그 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 골반 고정
🟢 발 → 발판 중앙·방향 정렬
🟢 무릎 → 발끝 방향
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발 전체로 밀고, 골반은 끝까지 안정적으로."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Single Leg Curl

🎯 ONE KEY CUE
🔥 "Focus on one side and fully contract the hamstring"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Center the feet. If placement is too high or low, the pelvis lifts first.
⚙️ Adjustments
Check 시트/지지, 발목 롤러, 무릎 축, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Single Leg Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → pelvis planted
🟢 Feet → centered and aligned
🟢 Knees → track toes
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Whole-foot drive, pelvis stays honest."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Single Leg Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트/지지, 발목 롤러, 무릎 축, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 힙 쓰러스트

🎯 ONE KEY CUE
🔥 "턱을 살짝 당긴 채 엉덩이를 천장으로 밀어 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
등/어깨 패드, 벨트/패드, 풋 스탠스, 중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
엉덩이를 올려 수축했다 천천히 내리기.
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
❌ 허리를 과신전해 요추로 올리는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "힙 쓰러스트"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"턱을 살짝 당긴 채 엉덩이를 천장으로 밀어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Hip Thrust

🎯 ONE KEY CUE
🔥 "Tuck the chin slightly and drive the hips up toward the ceiling"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 등/어깨 패드, 벨트/패드, 풋 스탠스, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Hip Thrust", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Tuck the chin slightly and drive the hips up toward the ceiling. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Hip Thrust 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"등/어깨 패드, 벨트/패드, 풋 스탠스, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 글루트 드라이브

🎯 ONE KEY CUE
🔥 "발뒤꿈치로 밀며 엉덩이만 들어 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
등판, 풋 플랫폼, 중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
힙을 밀어 올렸다 통제하며 내리기.
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
❌ 무릎이 안쪽으로 무너지는
발끝 방향으로 무릎을 보내세요. 안쪽으로 모이면 바로 중량을 낮춥니다.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "글루트 드라이브"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발뒤꿈치로 밀며 엉덩이만 들어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Glute Drive

🎯 ONE KEY CUE
🔥 "Drive through the heels and lift only with the glutes"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 등판, 풋 플랫폼, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Glute Drive", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Drive through the heels and lift only with the glutes. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Glute Drive 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"등판, 풋 플랫폼, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 글루트 킥백

🎯 ONE KEY CUE
🔥 "골반을 고정한 채 다리를 뒤로 차며 둔근 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드 높이, 스탠스, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
뒤로 찼다 천천히 복귀.
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
❌ 허리를 과도히 젖혀 요추로 차는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "글루트 킥백"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반을 고정한 채 다리를 뒤로 차며 둔근 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Glute Kickback

🎯 ONE KEY CUE
🔥 "Keep the pelvis stable and kick the leg back to squeeze the glute"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드 높이, 스탠스, 가동 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Glute Kickback", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the pelvis stable and kick the leg back to squeeze the glute. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Glute Kickback 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"패드 높이, 스탠스, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 힙 어브덕션

🎯 ONE KEY CUE
🔥 "상체를 고정하고 무릎을 바깥으로 벌리며 둔근 중부 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 무릎/허벅지 패드, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
바깥으로 벌렸다 천천히 모으기.
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
❌ 반동으로 다리를 튕겨 벌리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "힙 어브덕션"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"상체를 고정하고 무릎을 바깥으로 벌리며 둔근 중부 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Hip Abduction

🎯 ONE KEY CUE
🔥 "Brace the torso and open the knees outward to squeeze the glute medius"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 무릎/허벅지 패드, 가동 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Hip Abduction", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the torso and open the knees outward to squeeze the glute medius. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Hip Abduction 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 무릎/허벅지 패드, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 힙 어덕션

🎯 ONE KEY CUE
🔥 "무릎을 천천히 모으며 내전근을 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 무릎/허벅지 패드, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
바깥에서 안쪽으로 모았다 벌리기.
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
❌ 다리를 세게 부딪치듯 모으는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "힙 어덕션"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"무릎을 천천히 모으며 내전근을 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Hip Adduction

🎯 ONE KEY CUE
🔥 "Slowly bring the knees together and squeeze the adductors"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 무릎/허벅지 패드, 가동 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Hip Adduction", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Slowly bring the knees together and squeeze the adductors. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Hip Adduction 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 무릎/허벅지 패드, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 글루트 / 힙 머신

🎯 ONE KEY CUE
🔥 "선택한 동작(어브덕션/어덕션/킥백)에 맞춰 골반을 고정"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트부터 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
시트, 패드, 모드/가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
설정한 힙 동작의 궤적을 따라 수행.
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
❌ 모드와 다른 궤적으로 억지로 움직이는
자세가 무너지면 무게를 낮추세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "글루트 / 힙 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"선택한 동작(어브덕션/어덕션/킥백)에 맞춰 골반을 고정. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Glute / Hip Machine

🎯 ONE KEY CUE
🔥 "Brace the pelvis for the selected move (abduction/adduction/kickback)"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 시트, 패드, 모드/가동 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Glute / Hip Machine", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the pelvis for the selected move (abduction/adduction/kickback). One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Glute / Hip Machine 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 패드, 모드/가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 스탠딩 카프

🎯 ONE KEY CUE
🔥 "발볼로 밀어 올리며 종아리를 끝까지 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
어깨 패드, 풋 플랫폼 위치, 중량을 확인하세요.

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
❌ 무릎을 굽혀 반동으로 튀는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "스탠딩 카프"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Standing Calf

🎯 ONE KEY CUE
🔥 "Drive through the balls of the feet and fully squeeze the calves"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 어깨 패드, 풋 플랫폼 위치, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Standing Calf", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Standing Calf 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"어깨 패드, 풋 플랫폼 위치, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 시티드 카프

🎯 ONE KEY CUE
🔥 "무릎 아래 패드를 유지한 채 발볼로 뒤꿈치를 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
무릎 패드, 풋 플랫폼, 중량을 확인하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
뒤꿈치를 올렸다 깊게 내리기.
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
❌ 가동범위 없이 짧게만 튕기는
자세가 무너지면 무게를 낮추세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "시티드 카프"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Seated Calf

🎯 ONE KEY CUE
🔥 "Keep the pads on the thighs and raise the heels through the balls of the feet"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 무릎 패드, 풋 플랫폼, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Seated Calf", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Seated Calf 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"무릎 패드, 풋 플랫폼, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 레그 프레스 카프

🎯 ONE KEY CUE
🔥 "레그 프레스 플랫폼에서 무릎을 펴고 카프만 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🦶 발 위치
발볼만 발판에 올리고 발뒤꿈치는 아래로 떨어질 여유를 남기세요.
⚙️ 조절 포인트
풋 플랫폼 위치, 무릎 잠금, 중량을 확인하세요.

---

💪 ② 시작 자세
무릎 각도를 고정한 채 발볼로만 움직일 준비를 합니다.
이 자세에서 이것만 확인하세요.
👉 무릎이 같이 굽혀지지 않는지

---

🔥 ③ 운동 방법
발볼로 밀어 뒤꿈치를 올렸다 내리기.
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
❌ 무릎을 굽혔다 펴며 프레스로 바꾸는
자세가 무너지면 무게를 낮추세요.
❌ 무릎을 같이 굽혀 카프가 아닌 다리로 미는 것
자세가 무너지면 무게를 낮추세요.
❌ 발뒤꿈치를 튕기는 것
자세가 무너지면 무게를 낮추세요.
❌ 가동범위를 너무 짧게 가져가는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "레그 프레스 카프"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"발볼로만, 꼭대기 1초, 튕기지 않기."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Leg Press Calf

🎯 ONE KEY CUE
🔥 "On a leg-press platform, keep the knees soft-locked and raise only with the calves"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🦶 Feet
Balls of the feet on the platform; leave room for the heels to drop.
⚙️ Adjustments
Check 풋 플랫폼 위치, 무릎 잠금, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Leg Press Calf", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Balls of the feet only, pause on top, no bounce."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Leg Press Calf 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"풋 플랫폼 위치, 무릎 잠금, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 바이셉 컬

🎯 ONE KEY CUE
🔥 "팔꿈치를 패드에 고정한 채 손잡이를 어깨 쪽으로 컬"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
아래에서 위로 컬했다 천천히 내리기.
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
❌ 팔꿈치를 들며 반동으로 올리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "바이셉 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 패드에 고정한 채 손잡이를 어깨 쪽으로 컬. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Biceps Curl

🎯 ONE KEY CUE
🔥 "Keep the elbows on the pad and curl the handles toward the shoulders"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Biceps Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the elbows on the pad and curl the handles toward the shoulders. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Biceps Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 팔꿈치 패드, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 프리처 컬

🎯 ONE KEY CUE
🔥 "상완을 패드에 붙인 채 하단에서 통제하며 컬"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 프리처 패드 높이, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
프리처 패드에서 컬했다 천천히 펴기.
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
❌ 패드를 떼고 상체로 들어 올리는
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

"상완을 패드에 붙인 채 하단에서 통제하며 컬. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Preacher Curl

🎯 ONE KEY CUE
🔥 "Keep the upper arms on the pad and curl with control from the bottom"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 프리처 패드 높이, 손잡이, 중량.

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

"Keep the upper arms on the pad and curl with control from the bottom. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Preacher Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 프리처 패드 높이, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 아이소래터럴 바이셉 컬

🎯 ONE KEY CUE
🔥 "좌우를 같은 속도로 컬하며 힘 차이를 확인"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
양손잡이 높이가 좌우 같은지 먼저 보세요. 독립 암이라 한쪽만 어긋나도 바로 느껴집니다.
⚙️ 조절 포인트
시트, 좌·우 독립 암, 팔꿈치 패드, 중량을 확인하세요. 좌우 시작 위치가 같은지도 같이 봅니다.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
좌우가 같은 높이에서 시작하는지 한 번 더 보세요.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
각 팔을 독립적으로 컬했다 복귀.
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
❌ 강한 쪽만 먼저 올리는
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
    'en', jsonb_build_array($e$🏋️ FOCUS — Iso-Lateral Biceps Curl

🎯 ONE KEY CUE
🔥 "Curl both sides at the same speed and notice strength differences"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Match left and right handle height first — independent arms expose any mismatch immediately.
⚙️ Adjustments
Check 시트, 좌·우 독립 암, 팔꿈치 패드, 중량. Confirm both sides start from the same position.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Iso-Lateral Biceps Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 좌·우 독립 암, 팔꿈치 패드, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 암 컬

🎯 ONE KEY CUE
🔥 "어깨를 고정하고 전완만 들어 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 팔꿈치 지지, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 컬했다 천천히 펴기.
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
❌ 상체를 흔들며 치팅하는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "암 컬"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"어깨를 고정하고 전완만 들어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Arm Curl

🎯 ONE KEY CUE
🔥 "Keep the shoulders still and lift only with the forearms"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 팔꿈치 지지, 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Arm Curl", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the shoulders still and lift only with the forearms. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Arm Curl 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 팔꿈치 지지, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 트라이셉스 익스텐션

🎯 ONE KEY CUE
🔥 "팔꿈치를 고정한 채 전완만 펴 삼두 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
팔을 펴 올렸다 천천히 접기.
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
❌ 팔꿈치가 벌어지며 어깨가 개입하는
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

"팔꿈치를 고정한 채 전완만 펴 삼두 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Triceps Extension

🎯 ONE KEY CUE
🔥 "Keep the elbows fixed and extend only the forearms to squeeze the triceps"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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

"Keep the elbows fixed and extend only the forearms to squeeze the triceps. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Triceps Extension 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 팔꿈치 패드, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 트라이셉스 프레스

🎯 ONE KEY CUE
🔥 "팔꿈치를 몸통 가까이 두고 아래로 밀어 삼두 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
손잡이를 아래로 밀었다 복귀.
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
❌ 어깨를 으쓱하며 승모로 미는
어깨를 귀에서 멀리 두고 다시 시작하세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "트라이셉스 프레스"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"팔꿈치를 몸통 가까이 두고 아래로 밀어 삼두 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Triceps Press

🎯 ONE KEY CUE
🔥 "Keep elbows close and press down to squeeze the triceps"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Triceps Press", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep elbows close and press down to squeeze the triceps. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Triceps Press 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 딥 / 트라이셉스 머신

🎯 ONE KEY CUE
🔥 "가동범위 하단에서 어깨를 보호하며 밀어 올리기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

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
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
딥 궤적으로 내렸다 밀어 올리기.
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
❌ 너무 깊게 내려 어깨 앞쪽이 아픈
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "딥 / 트라이셉스 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"가동범위 하단에서 어깨를 보호하며 밀어 올리기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Dip / Triceps Machine

🎯 ONE KEY CUE
🔥 "Protect the shoulders at the bottom and press back up through the range"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Dip / Triceps Machine", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Protect the shoulders at the bottom and press back up through the range. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Dip / Triceps Machine 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 바이셉스 / 트라이셉스 복합 머신

🎯 ONE KEY CUE
🔥 "컬과 익스텐션을 모드별로 분리해 팔꿈치만 움직이기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
시트, 모드 전환, 패드/손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
팔꿈치 위치를 패드나 몸 옆에 고정합니다. 몸통 반동은 끕니다.
이 자세에서 이것만 확인하세요.
👉 팔꿈치가 앞으로 흘러가지 않는지

---

🔥 ③ 운동 방법
선택한 팔 동작 궤적만 수행.
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
❌ 모드를 혼용해 어깨까지 흔드는
자세가 무너지면 무게를 낮추세요.
❌ 팔꿈치가 앞으로 흘러가며 어깨가 개입하는 것
자세가 무너지면 무게를 낮추세요.
❌ 몸통 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 손목을 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "바이셉스 / 트라이셉스 복합 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 팔꿈치 → 미는/드는 방향
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"컬과 익스텐션을 모드별로 분리해 팔꿈치만 움직이기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Biceps / Triceps Combo

🎯 ONE KEY CUE
🔥 "Separate curl and extension modes and move only at the elbow"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 시트, 모드 전환, 패드/손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Biceps / Triceps Combo", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Elbows → press/raise direction
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Separate curl and extension modes and move only at the elbow. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Biceps / Triceps Combo 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 모드 전환, 패드/손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 앱 크런치

🎯 ONE KEY CUE
🔥 "골반을 고정하고 갈비뼈를 아래로 말며 크런치"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 가슴/어깨 패드, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 말아 수축했다 천천히 펴기.
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
❌ 목만 앞으로 당겨 경추에 부담을 주는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "앱 크런치"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Ab Crunch

🎯 ONE KEY CUE
🔥 "Brace the pelvis and crunch by curling the ribs down"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 가슴/어깨 패드, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Ab Crunch", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Ab Crunch 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 가슴/어깨 패드, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 어브도미널

🎯 ONE KEY CUE
🔥 "복압을 유지한 채 짧게 수축하기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 패드, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
말아 올렸다 통제하며 복귀.
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
❌ 반동으로 상체를 튕기는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "어브도미널"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Abdominal

🎯 ONE KEY CUE
🔥 "Keep abdominal pressure and use a short controlled crunch"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 패드, 가동 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Abdominal", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Abdominal 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 패드, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 로터리 토르소

🎯 ONE KEY CUE
🔥 "골반을 고정한 채 갈비뼈만 천천히 회전"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 무릎/골반 고정, 회전 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
좌우로 회전했다 중앙으로 복귀.
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
❌ 팔을 흔들어 반동으로 돌리는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "로터리 토르소"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Rotary Torso

🎯 ONE KEY CUE
🔥 "Keep the pelvis fixed and rotate only the ribcage slowly"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 무릎/골반 고정, 회전 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Rotary Torso", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Rotary Torso 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 무릎/골반 고정, 회전 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 사이드 밴드

🎯 ONE KEY CUE
🔥 "골반을 고정하고 옆구리를 짧게 측굴"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트/힙 패드, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
옆으로 숙였다 중앙으로 복귀.
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
❌ 크게 흔들며 요추를 비트는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
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
    'en', jsonb_build_array($e$🏋️ FOCUS — Side Bend

🎯 ONE KEY CUE
🔥 "Brace the pelvis and side-bend briefly through the obliques"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트/힙 패드, 가동 범위, 중량.

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
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Side Bend 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트/힙 패드, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 백 익스텐션

🎯 ONE KEY CUE
🔥 "중립 척추를 유지한 채 힙 힌지로 상체를 펴기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
⚙️ 조절 포인트
골반 패드, 풋 지지, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
상체를 내려 접었다 중립까지 펴기.
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
❌ 허리를 과신전해 끝을 튕기는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "백 익스텐션"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Back Extension

🎯 ONE KEY CUE
🔥 "Keep a neutral spine and extend through a hip hinge"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 골반 패드, 풋 지지, 가동 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Back Extension", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Back Extension 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"골반 패드, 풋 지지, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 힙 익스텐션

🎯 ONE KEY CUE
🔥 "골반을 고정하고 다리를 뒤로 펴 둔근·햄스트링 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트·백패드를 먼저 맞추세요. 밀었을 때 골반이 말리거나 허리가 뜨지 않는 깊이가 시작점입니다.
🦶 발 위치
지지하는 발을 먼저 고정하세요. 흔들리면 중량을 낮춥니다.
⚙️ 조절 포인트
패드, 스탠스, 가동 범위, 중량을 확인하세요.

---

💪 ② 시작 자세
골반 위치를 먼저 고정합니다. 허리로 높이 만들 준비를 하지 마세요.
이 자세에서 이것만 확인하세요.
👉 허리가 아니라 엉덩이가 일을 받을 준비인지

---

🔥 ③ 운동 방법
뒤로 펴 올렸다 천천히 복귀.
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
❌ 허리를 젖혀 요추로 펴는
깊이보다 골반 고정이 먼저입니다. 허리가 뜨면 범위를 줄이세요.
❌ 허리로 높이 만드는 것
자세가 무너지면 무게를 낮추세요.
❌ 골반이 돌아가며 한쪽만 미는 것
약한 쪽 속도에 강한 쪽을 맞추세요.
❌ 반동으로 올리는 것
템포를 늦추고 같은 궤적만 반복하세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "힙 익스텐션"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 발 → 발판 중앙·방향 정렬
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"골반을 고정하고 다리를 뒤로 펴 둔근·햄스트링 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Hip Extension

🎯 ONE KEY CUE
🔥 "Brace the pelvis and extend the leg back to squeeze glute and hamstring"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Set the seat/back pad first. Your start depth is where the pelvis stays planted and the low back does not peel up.
🦶 Feet
Lock in the support foot before you move. Reduce load if you wobble.
⚙️ Adjustments
Check 패드, 스탠스, 가동 범위, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Hip Extension", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Feet → centered and aligned
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Brace the pelvis and extend the leg back to squeeze glute and hamstring. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Hip Extension 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"패드, 스탠스, 가동 범위, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 복근 / 허리 복합 머신

🎯 ONE KEY CUE
🔥 "크런치와 백 익스텐션을 모드별로 분리 수행"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
시트, 모드 전환, 패드, 중량을 확인하세요.

---

💪 ② 시작 자세
골반을 안정시키고 목으로 당길 생각을 지웁니다.
이 자세에서 이것만 확인하세요.
👉 골반이 고정돼 있는지

---

🔥 ③ 운동 방법
선택한 코어 동작만 수행.
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
❌ 한 궤적으로 복근과 허리를 동시에 과부하하는
자세가 무너지면 무게를 낮추세요.
❌ 목으로 당겨 몸통을 접는 것
갈비뼈를 골반 쪽으로 만다는 느낌으로 바꾸세요.
❌ 골반이 뜨며 반동을 쓰는 것
템포를 늦추고 같은 궤적만 반복하세요.
❌ 너무 큰 범위로 과하게 꺾는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "복근 / 허리 복합 머신"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"목 말고 몸통으로, 끝에서 조이고 천천히."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Abs / Back Combo

🎯 ONE KEY CUE
🔥 "Perform crunch and back extension separately by mode"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 시트, 모드 전환, 패드, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Abs / Back Combo", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Torso curl, squeeze, slow return — not the neck."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Abs / Back Combo 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"시트, 모드 전환, 패드, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 케이블 크로스오버

🎯 ONE KEY CUE
🔥 "갈비뼈를 내린 채 양손을 몸 앞에서 모아 가슴 수축"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
케이블 손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
풀리 높이, 케이블 손잡이, 중량 스택을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
양옆에서 중앙으로 모았다 천천히 벌리기.
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
❌ 상체를 앞으로 쓰러뜨리며 반동하는
템포를 늦추고 같은 궤적만 반복하세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "케이블 크로스오버"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"갈비뼈를 내린 채 양손을 몸 앞에서 모아 가슴 수축. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Cable Crossover

🎯 ONE KEY CUE
🔥 "Keep the ribs down and bring both hands together in front to squeeze the chest"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 풀리 높이, 케이블 손잡이, 중량 스택.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Cable Crossover", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Keep the ribs down and bring both hands together in front to squeeze the chest. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Cable Crossover 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"풀리 높이, 케이블 손잡이, 중량 스택","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 듀얼 어저스터블 풀리

🎯 ONE KEY CUE
🔥 "풀리 높이를 동작에 맞춘 뒤 코어를 고정하고 당기거나 밀기"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🤲 그립 / 손 위치
손잡이를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
좌·우 풀리 높이, 손잡이, 중량을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
설정한 높이에서 밀거나 당겼다 복귀.
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
❌ 케이블이 몸에서 멀어져 궤적이 흔들리는
자세가 무너지면 무게를 낮추세요.
❌ 케이블에 몸이 끌려가는 것
자세가 무너지면 무게를 낮추세요.
❌ 높이 설정을 대충 하고 시작하는 것
자세가 무너지면 무게를 낮추세요.
❌ 스택을 놓듯 되돌리는 것
자세가 무너지면 무게를 낮추세요.

---

💡 MACHINE FIT PRO TIP
🔥 이 항목은 해머 스트렝스 전용 SKU가 없습니다. "듀얼 어저스터블 풀리"로 분류된 실제 기구의 패드·레버·안전장치만 믿고, 가벼운 무게로 5회 리허설 후 본 세트를 시작하세요.

---

🎯 MACHINE FIT CHECK
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"풀리 높이를 동작에 맞춘 뒤 코어를 고정하고 당기거나 밀기. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Dual Adjustable Pulley

🎯 ONE KEY CUE
🔥 "Set pulley height for the move, brace the core, then pull or press"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 좌·우 풀리 높이, 손잡이, 중량.

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
🔥 No dedicated Hammer Strength SKU for this slot. Trust the pads/levers/safeties on the unit labeled like "Dual Adjustable Pulley", rehearse five light reps, then start working sets.

---

🎯 MACHINE FIT CHECK
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Set pulley height for the move, brace the core, then pull or press. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Dual Adjustable Pulley 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"좌·우 풀리 높이, 손잡이, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 멀티 정글짐

🎯 ONE KEY CUE
🔥 "사용 스테이션만 잡고 동선이 겹치지 않게 수행"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 어깨·관절에 자연스럽게 오는지 확인합니다.
⚙️ 조절 포인트
스테이션 선택, 시트/패드, 중량을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
선택한 스테이션 궤적만 수행.
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
❌ 여러 스택 케이블을 동시에 잡아 꼬는
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
🟢 시트/패드 → 몸에 맞춤
🟢 몸통 → 브레스·고정
🟢 어깨 → 으쓱하지 않기
🟢 복귀 → 2~3초 통제

### 🔥 이것만 기억하세요

"사용 스테이션만 잡고 동선이 겹치지 않게 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Multi Jungle Gym

🎯 ONE KEY CUE
🔥 "Use only your station and keep the movement path clear of others"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
⚙️ Adjustments
Check 스테이션 선택, 시트/패드, 중량.

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
🟢 Seat/pad → fitted
🟢 Torso → braced
🟢 Shoulders → not shrugged
🟢 Return → 2–3 sec control

### 🔥 Remember this

"Use only your station and keep the movement path clear of others. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Multi Jungle Gym 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"스테이션 선택, 시트/패드, 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 어시스트 풀업 / 딥

🎯 ONE KEY CUE
🔥 "보조 무게로 풀업 또는 딥을 통제된 깊이로 수행"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
🪑 좌석 / 패드
시트를 몸에 맞추세요. 시작 위치가 목표 관절 높이에 오는지 확인합니다.
🤲 그립 / 손 위치
그립를 편안한 너비로 잡으세요. 손목이 꺾이지 않게 합니다.
⚙️ 조절 포인트
무릎/보조 패드, 그립, 보조 중량을 확인하세요.

---

💪 ② 시작 자세
발 위치를 잡고 몸통을 브레스한 뒤, 케이블 높이부터 확인합니다.
이 자세에서 이것만 확인하세요.
👉 몸이 케이블에 끌려가지 않는지

---

🔥 ③ 운동 방법
선택한 핸들로 오르내리기.
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
❌ 보조를 과하게 줄여 형태가 무너지는
자세가 무너지면 무게를 낮추세요.
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

"보조 무게로 풀업 또는 딥을 통제된 깊이로 수행. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Assisted Pull-up / Dip

🎯 ONE KEY CUE
🔥 "Use assist load to perform pull-ups or dips with controlled depth"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
🪑 Seat / pads
Fit the seat to your body so the start position sits naturally on the working joint.
🤲 Grip / hands
Take a comfortable grip width and keep the wrists stacked, not bent.
⚙️ Adjustments
Check 무릎/보조 패드, 그립, 보조 중량.

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

"Use assist load to perform pull-ups or dips with controlled depth. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Assisted Pull-up / Dip 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"무릎/보조 패드, 그립, 보조 중량","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 스미스 머신

🎯 ONE KEY CUE
🔥 "바가 레일을 따라가게 두고 발 위치만 안정히 조정"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
바 훅, 안전 스토퍼, 바 경로를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
레일을 따라 올렸다 내려 훅 고정.
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
❌ 훅을 완전히 안 풀고 억지로 미는
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

"바가 레일을 따라가게 두고 발 위치만 안정히 조정. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Smith Machine

🎯 ONE KEY CUE
🔥 "Let the bar follow the rails and only adjust a stable foot stance"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
⚙️ Adjustments
Check 바 훅, 안전 스토퍼, 바 경로.

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

"Let the bar follow the rails and only adjust a stable foot stance. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Smith Machine 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"바 훅, 안전 스토퍼, 바 경로","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 파워 랙

🎯 ONE KEY CUE
🔥 "세이프티를 가동범위 바로 아래에 두고 스쿼트·프레스"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
J-훅, 안전 바, 스팟터 암을 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
랙에서 언랙 후 수행하고 다시 훅.
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

"세이프티를 가동범위 바로 아래에 두고 스쿼트·프레스. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Power Rack

🎯 ONE KEY CUE
🔥 "Set safeties just below your range and squat or press"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
⚙️ Adjustments
Check J-훅, 안전 바, 스팟터 암.

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

"Set safeties just below your range and squat or press. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Power Rack 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"J-훅, 안전 바, 스팟터 암","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
    'ko', jsonb_build_array($k$🏋️ FOCUS — 하프 랙

🎯 ONE KEY CUE
🔥 "오픈 랙에서 바 높이를 맞춘 뒤 안정적으로 언랙"

포커스 전용 모델이 없는 카테고리입니다. 헬스장에 있는 실제 기구의 패드·레버·안전장치를 먼저 확인한 뒤, 아래 패턴으로 움직이세요.

---

⚙️ ① 기구 세팅
⚙️ 조절 포인트
J-훅, 안전 바, 스탠스를 확인하세요.

---

💪 ② 시작 자세
바·안전 높이를 맞춘 뒤 랙 중앙에 몸을 정렬합니다.
이 자세에서 이것만 확인하세요.
👉 안전바가 내 가동범위에 맞는지

---

🔥 ③ 운동 방법
언랙 후 동작하고 다시 랙.
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
❌ 바가 한쪽으로 기울게 언랙하는
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

"오픈 랙에서 바 높이를 맞춘 뒤 안정적으로 언랙. 끝에서 1초, 복귀는 통제."$k$),
    'en', jsonb_build_array($e$🏋️ FOCUS — Half Rack

🎯 ONE KEY CUE
🔥 "Set bar height on the open rack and unrack with a stable stance"

There is no dedicated Focus SKU for this category. Confirm pads, levers, and safeties on the unit in your gym, then follow the movement pattern below.

---

⚙️ ① Setup
⚙️ Adjustments
Check J-훅, 안전 바, 스탠스.

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

"Set bar height on the open rack and unrack with a stable stance. One-second peak, controlled return."$e$)
  ),
  pro_tips_meta = $meta${"verificationStatus":"BRAND_MODEL_NOT_FOUND","verifiedModel":null,"manufacturer":"Focus","productSeries":null,"sourceUrl":null,"verifiedStructure":"Focus(포커스) 공개 웹·B2B 카탈로그에서 Half Rack 전용 SKU·모델코드를 확인하지 못했습니다(브랜드 공식 사이트·카탈로그 미공개)","verifiedAdjustments":"J-훅, 안전 바, 스탠스","importedAt":"2026-08-20T04:58:16.937Z"}$meta$::jsonb,
  updated_at = NOW()
FROM brands b
WHERE b.id = m.brand_id
  AND b.code = 'FOCUS'
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
  WHERE b.code = 'FOCUS'
    AND m.is_active = TRUE
    AND m.pro_tips IS NOT NULL
    AND m.pro_tips_meta IS NOT NULL
    AND m.pro_tips_meta->>'verificationStatus' IS NOT NULL
    AND (m.pro_tips->'ko'->>0) LIKE '%ONE KEY CUE%'
    AND (m.pro_tips->'ko'->>0) LIKE '%MACHINE FIT PRO TIP%'
    AND (m.pro_tips->'ko'->>0) NOT LIKE '%📋 검증 상태%';

  IF updated_count < 80 THEN
    RAISE EXCEPTION 'FOCUS trainer PRO tips import incomplete: % / 80', updated_count;
  END IF;
END $$;
