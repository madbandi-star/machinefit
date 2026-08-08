# Test handoff: Fix missing machine images on Records cards

## Summary
검색을 거치지 않은 계획/로그 카드에서도 기구 이미지가 나오도록, workout-cards·history에 커버 이미지 해석을 맞추고 기록 카드에서 커버 URL 폴백을 추가했습니다.

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. 운동추가로 넣은 오늘/미래 카드: 썸네일 표시
2. 자유중량 부위별 카드: 부위 커버 표시
3. 검색→추천 기록: 기존처럼 이미지 유지
4. 이미지 없는 기구: placeholder로 폴백

## Fast checks
```bash
rg -n "primaryImageUrl|PRIMARY_IMAGE_SQL|resolveRecordMachineImageUrl|machineCoverMediaUrl" shared/src/types/workout-card.types.ts backend/server/repositories/workout-card.repository.ts backend/server/repositories/history.repository.ts frontend/src/utils/catalogAssets.ts frontend/src/utils/workoutPlanCards.ts frontend/src/components/records/HistoryRecordCard/HistoryRecordCard.tsx
```

## Notes
- **Render backend redeploy required** (history/workout-cards SQL).

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 검색 없이 추가된 카드에 이미지 없음 | 커버/폴백으로 이미지 표시 |
