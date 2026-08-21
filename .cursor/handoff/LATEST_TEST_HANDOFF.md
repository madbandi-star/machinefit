# Test handoff — Pin pickers locks target reps

## Summary
세부 피커 고정 시 기본목표횟수까지 잠금 (간격·하나더·버텨와 동일).

## Test focus
1. 홈/기록 음성카운트 → 세부 피커 고정 ON
2. 목표횟수 스크롤 불가
3. 고정 OFF → 조절 가능

## Fast checks
```
rg -n "lock every picker including" frontend/src/components/recommendation/VoiceCoachPickerGrid/VoiceCoachPickerGrid.tsx
```

## Deploy note
Frontend only (Pages).
