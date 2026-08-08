# Test handoff: Voice count below plan-save (after tip)

## Summary
기록/세부 기록에서 음성카운트를 일지·팁 블록(하단에 「계획 저장」) **아래**로 옮겼습니다. 이전에는 수행기록 직후(=운동계획 메모 위)에 있어 잘못된 위치였습니다.

## Git
- Branch: `main`
- Commit: `PENDING`

## Test focus
1. 기록 개별 카드 순서: 세트/무게 → 일지 메모 → 팁 + 계획 저장 → **음성카운트**
2. 세부 기록 페이지 동일
3. 음성/계획 저장 동작 유지

## Fast checks
```bash
rg -n "After diary / tip|voiceCoachPanel" frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx
```

## Notes
- FE Pages only.

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 음성카운트가 운동계획 메모 위 | 계획 저장 버튼 아래 |
