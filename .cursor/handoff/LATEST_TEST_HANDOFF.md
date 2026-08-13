# Test handoff — Future set-complete must not create today card

## Summary
미래 날짜 개별운동기록카드에서 수행기록 **미완료 → 완료** 시, `workout_log` upsert가 `recent_history.viewed_at = NOW()`로 올려 **오늘** 버킷에 카드가 생기던 문제를 수정.  
`recommendationId`가 있어도 **logDate가 오늘일 때만** history mirror.

## Git
- branch: `main`
- commit: pending (push 후 갱신)

## Changed
- `backend/server/services/workout-log.service.ts`

## Test focus
1. 기록 > 미래 날짜 카드에서 세트 **완료** 탭
2. **오늘** 날짜에 동일 기구 카드가 **신규 생성되지 않음**
3. 미래 카드의 완료 상태는 유지
4. **오늘** 카드에서 완료는 기존처럼 기록에 반영

## Fast checks
```
rg -n "logDate === todayDateKey\\(\\)" backend/server/services/workout-log.service.ts
rg -n "historyRepository.record" backend/server/services/workout-log.service.ts
```

## Production
**Render BE 재배포 필요** (FE 변경 없음).

## As-is → To-be
- **As-is:** 미래 카드 완료 → 오늘 개별운동기록카드 생성
- **To-be:** 미래/과거 완료는 history를 오늘로 올리지 않음
