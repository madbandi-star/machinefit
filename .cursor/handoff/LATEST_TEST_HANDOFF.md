# Test handoff: Hide log/voice UI on today planDate machine detail

## Summary
검색에서 `planDate`(오늘 포함)로 기구 상세에 들어오면 음성카운트·수행기록·운동일지를 숨기고, 미래와 동일하게 운동계획 추가 UI만 보이게 했습니다. `logDate` 기록 진입은 기존과 같습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 오늘 운동추가 → 기구 상세: WorkoutLogPanel/음성카운트 없음, 「운동 계획에 추가」만
2. 미래 planDate 상세: 동일하게 계획 추가 UI
3. 기록에서 logDate로 연 상세: 수행기록·음성 유지

## Fast checks
```bash
rg -n "isPlanAddMode|WorkoutLogPanel" frontend/src/pages/machine-detail/MachineDetailPage.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| planDate=오늘이면 음성/수행기록 UI 노출 | planDate면 오늘·미래 모두 계획 추가 셸만 |
