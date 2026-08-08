# Test handoff: Include COMPLETED cards in workout plan reminders

## Summary
운동 계획 알림 대상에 오늘 날짜의 COMPLETED(및 IN_PROGRESS) 카드도 포함했습니다. 오늘 운동추가로 자동 COMPLETED된 카드도 알림이 갑니다.

## Git
- Branch: `main`
- Commit: `397ad5ae`

## Test focus
1. 오늘 COMPLETED 카드만 있는 계정 → 시간당 잡 후 운동 계획 알림 생성
2. 이미 같은 날 reminder 있으면 중복 없음
3. SKIPPED만 있으면 알림 없음

## Fast checks
```bash
rg -n "COMPLETED|IN_PROGRESS|listUserIdsWithPlannedOnDate" backend/server/repositories/workout-card.repository.ts
```

## Notes
- Backend change → **Render redeploy** required.

## as-is → to-be
| as-is | to-be |
|-------|--------|
| 오늘 PLANNED만 | 오늘 PLANNED / COMPLETED / IN_PROGRESS |
