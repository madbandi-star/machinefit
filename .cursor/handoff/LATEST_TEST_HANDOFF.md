# Test handoff: Plan date quick picks D+2…D+6 + 1 week

## Summary
운동 카드 날짜 변경/복사 다이얼로그 빠른 선택에 오늘·내일 외에 D+2~D+6, 일주일뒤를 추가했습니다.

## Git
- Branch: `main`
- Commit: 6495e4f7

## Test focus
1. Records → card ? → 날짜 변경 또는 다른 날짜로 복사
2. 칩: 오늘, 내일, D+2 … D+6, 일주일뒤
3. 칩 선택 시 상단 날짜 라벨이 해당 일자로 바뀌고 확인 가능

## Fast checks
```bash
rg -n "planDateDPlus|planDateInOneWeek|quickPicks" frontend/src/components/records/PlanDatePickerDialog frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 오늘 / 내일만 | 오늘·내일·D+2~D+6·일주일뒤 |
