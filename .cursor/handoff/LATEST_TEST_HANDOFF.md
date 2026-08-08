# Test handoff: Sync target reps from adjusted reps even when pickers pinned

## Summary
세부 피커 고정이 켜져 있어도 조정횟수 변경 시 목표횟수가 자동으로 따라가도록 동기화 가드를 제거했습니다. 간격·하나더·버텨 잠금은 그대로입니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 기록 카드: 세부 피커 고정 ON + 조정횟수 변경 → 목표횟수 동일 값으로 갱신
2. 고정 OFF에서도 기존처럼 조정횟수 → 목표횟수 동기화
3. 고정 ON에서 카운트간격·하나더·버텨는 여전히 잠금

## Fast checks
```bash
rg -n "조정횟수 → 목표횟수|volumeReps" frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 세부 피커 고정 ON이면 조정횟수 → 목표횟수 미반영 | 고정 ON/OFF 모두 조정횟수 → 목표횟수 자동 동기화 |
