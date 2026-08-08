# Test handoff: Move voice count below plan-save on Records

## Summary
기록 페이지 개별 기구 카드와 세부 기록 페이지에서 음성카운트 영역을 계획저장 버튼(수행 기록 블록) 아래로 이동했습니다. 둘 다 `WorkoutLogPanel` history 변형을 공유합니다.

## Git
- Branch: `main`
- Commit: `PENDING`

## Test focus
1. 기록 페이지 개별 기구 카드: 세트·무게 → 계획 저장 근처 → **그 아래** 음성카운트 → 다이어리/팁
2. 세부 기록 페이지: 동일 순서
3. 음성카운트 시작/중지, 계획 저장 동작 유지

## Fast checks
```bash
rg -n "Below 「계획 저장」|voiceCoachPanel" frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx
rg -n "recommendation-workout-log--history .voice-coach-panel" frontend/src/styles/recommendation.css
```

## Notes
- FE Pages only (no Render).

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 음성카운트가 계획저장/세트 위 | 음성카운트가 계획저장·수행기록 블록 아래 |
