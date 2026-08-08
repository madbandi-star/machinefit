# Test handoff: Default plan-add cards to 3 sets

## Summary
기구 상세 계획 추가와 planDate 추천 결과에서 만드는 `workout_card`가 `setCount: 1`이던 것을, 검색→추천→기록과 같이 **3세트 + 추천중량 3칸**으로 맞췄습니다.

## Git
- Branch: `main`
- Commit: `ec5a4bc8`

## Test focus
1. 기록 → 운동 추가(`planDate`) → 기구 상세 → 계획에 추가 → 기록 카드: 수행 세트 **3**
2. `planDate` 잡고 추천 후 기록 저장 → 계획/기록 카드 세트 **3** (1 아님)
3. 일반 오늘 검색 추천(계획 없이)은 기존처럼 기본 3 유지

## Fast checks
```bash
rg -n "defaultSetCount = 3|setCount: 1" frontend/src/pages/machine-detail/MachineDetailPage.tsx frontend/src/pages/recommendation-result/RecommendationResultPage.tsx
```
(기대: `defaultSetCount = 3` 있음, 해당 create 경로에 `setCount: 1` 없음)

## Notes
- FE Pages only. 이미 만들어진 1세트 계획 카드는 자동 변경되지 않음.

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 계획 추가/planDate 카드 create가 1세트 | 동일 경로가 3세트 기본 |
