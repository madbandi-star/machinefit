# Test handoff: Polish Records reorder action pad UI

## Summary
기록 카드 순서 변경 메뉴를 이모지 텍스트 목록에서 짧은 라벨의 2×2 아이콘 액션 패드로 개선했습니다.

## Git
- Branch: `main`
- Commit: `0c88fe3b`

## Test focus
1. 기록 카드 순서 버튼 → 2×2 패드(위로/아래로/맨 위/맨 아래)
2. 첫/마지막 카드에서 해당 버튼 비활성
3. 탭 시 순서 변경·메뉴 닫힘

## Fast checks
```bash
rg -n "orderMoveUpShort|workout-card-order__grid" frontend/src/components/records/WorkoutCardOrderControl frontend/src/i18n/locales/ko/machines.json
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 이모지+긴 텍스트 세로 메뉴 | 짧은 라벨 2×2 아이콘 액션 패드 |
