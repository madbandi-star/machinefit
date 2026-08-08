# Test handoff: Target reps editable while detail pickers pinned

## Summary
기구기록카드에서 「세부 피커 고정」이 켜져 있어도 목표횟수만은 스크롤·수정 가능하고, 카운트간격·하나더횟수·버텨 시간은 기존처럼 잠급니다.

## Git
- Branch: `main`
- Commit: `8d272aed`

## Test focus
1. 기록 카드 음성코치: 세부 피커 고정 ON → 목표횟수 스크롤 가능
2. 같은 상태에서 카운트간격·하나더·버텨 시간은 수정 불가
3. 카운트 실행 중에는 목표횟수 포함 전부 잠금
4. 고정 OFF면 4개 모두 수정 가능

## Fast checks
```bash
rg -n "targetRepsLocked|cell--interactive|세부 피커 고정" frontend/src/components/recommendation frontend/src/styles
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 세부 피커 고정 시 4개 모두 잠김 | 고정 시에도 목표횟수만 수정 가능 |
