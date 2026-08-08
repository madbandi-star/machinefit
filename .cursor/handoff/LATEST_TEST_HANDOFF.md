# Test handoff: Template save/load preserves performed sets and weights

## Summary
템플릿 저장 시 `workout_logs` 수행 세트/무게를 우선 병합하고, 불러오기 시 카드·로그에 값을 남겨 수행 기록 UI가 그대로 이어지도록 수정했습니다. BE `applyTemplate`은 copy와 같이 `workout_logs`에 미러합니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 수행 세트/무게가 있는 날 템플릿 저장 → payload에 동일 세트/무게
2. 계획 카드만 있고 로그에 수행값이 있는 날도 로그 값으로 저장
3. 템플릿 불러오기(미래/오늘) → 수행 세트 수·수행 무게가 저장된 값으로 표시
4. 기존 추천 무게 시드가 템플릿 수행 무게를 덮어쓰지 않음

## Fast checks
```bash
rg -n "buildTemplateItemsFromDay|planSeed|hasPlanSeed" frontend/src
rg -n "listTemplateSourceItems|workoutLogRepository.upsert" backend/server/services/workout-card.service.ts backend/server/repositories/workout-card.repository.ts
```

## Notes
- Frontend: GitHub Pages deploy after push
- Backend/shared: **Render redeploy required** for applyTemplate log mirror

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 템플릿이 카드 기본값을 쓰거나, 불러와도 수행 UI가 기본 3세트/추천무게 | 저장 시 로그 우선 세트·무게 보존, 불러오기 시 수행 UI에 동일 값 반영 |
