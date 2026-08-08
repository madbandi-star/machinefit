# Test handoff: Remove add-another-exercise plan CTA

## Summary
미래 운동계획 추가 화면에서 「다른 운동도 추가」 버튼을 제거하고 「운동 계획에 추가」「운동계획보기」만 남겼습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 미래 날짜 `planDate`로 기구 상세: 「다른 운동도 추가」 없음
2. 「운동 계획에 추가」「운동계획보기」는 그대로 동작

## Fast checks
```bash
rg -n "planAddAnother" frontend/src/pages/machine-detail/MachineDetailPage.tsx
# expect: no matches
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 3버튼 (다른 운동도 추가 포함) | 2버튼 (추가 + 계획보기) |
