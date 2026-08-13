# Test handoff — Future complete↔incomplete must not create today card

## Summary
미래 날짜에서 **완료 → 미완료**(및 반대) 시 오늘 개별운동기록카드가 생기거나 남지 않도록 보강.
- BE: 오늘이 아니면 `history.record(NOW)` 호출 안 함 + 잘못 오늘로 올라간 history를 `logDate`로 재배치
- FE: 오늘이 아니면 upsert에 `recommendationId` 미전달 (구버전 BE 방어)

## Git
- branch: `main`
- commit: `a81cad31`

## Changed
- `backend/server/services/workout-log.service.ts`
- `backend/server/repositories/history.repository.ts`
- `frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx`

## Test focus
1. 미래 카드 **완료 → 미완료** → 오늘 카드 없음
2. 미래 카드 **미완료 → 완료** → 오늘 카드 없음
3. 이전에 잘못 생긴 오늘 유령 카드가 있으면, 미래 세트 토글 후(오늘 로그 없을 때) 사라지거나 미래로 이동
4. 오늘 카드 세트 토글은 정상

## Fast checks
```
rg -n "reanchorFromTodayIfNoTodayLog|logDate === todayDateKey" backend/server
rg -n "recommendationId && isTodayLog" frontend/src/components/recommendation/WorkoutLogPanel/WorkoutLogPanel.tsx
```

## Production
**Pages FE + Render BE** 둘 다 필요.

## As-is → To-be
- **As-is:** 미래 완료↔미완료 시 오늘 카드 생성/잔류
- **To-be:** 오늘로 history를 올리지 않음 + 유령 오늘 history 재배치
