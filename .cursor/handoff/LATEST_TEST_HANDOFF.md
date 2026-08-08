# Test handoff: Records green-dot nudge after plan add

## Summary
운동추가(계획 추가) 성공 시에도 하단 기록 탭에 기존과 같은 녹색점(`recordsNavNudge`)이 보이도록 연결했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 기록 → 운동추가 → 기구 「운동 계획에 추가」 → 하단 기록에 녹색점/펄스
2. 기록 탭 진입 시 녹색점 해제
3. 기존 추천 직후 녹색점 동작 유지

## Fast checks
```bash
rg -n "setRecordsNavNudge\\(true\\)" frontend/src/pages/machine-detail/MachineDetailPage.tsx frontend/src/pages/recommendation-result/RecommendationResultPage.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 운동추가 후 하단 기록에 녹색점 없음 | 운동추가 성공 시 추천과 동일하게 녹색점 표시 |
