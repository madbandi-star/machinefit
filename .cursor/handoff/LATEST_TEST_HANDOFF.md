# Test handoff: Records nav tip copy → 이동해서 운동시작

## Summary
하단 기록 버튼 nudge tip 문구를 「이동해서 운동시작」으로 변경했습니다.

## Git
- Branch: `main`
- Commit: `941db8ea`

## Test focus
1. 오늘 추천 후 하단 기록 tip이 「이동해서 / 운동시작」

## Fast checks
```bash
rg -n "recordsNudgeNavTip" frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 오늘 운동은 기록에서 관리 | 이동해서 운동시작 |
