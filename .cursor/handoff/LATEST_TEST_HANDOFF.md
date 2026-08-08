# Test handoff: Day delete removes completed cards too

## Summary
일자 전체삭제 시 COMPLETED 운동카드가 남아 책갈피(저장)만 꺼지던 문제를 수정했습니다. 해당 일자의 로그·히스토리·모든 상태의 workout card를 삭제합니다. **backend 변경 → Render 재배포 필요.**

## Git
- Branch: `main`
- Commit: pending

## Test focus
1. Records → day ⋯ → 오늘/선택일 전체삭제 → 확인
2. 해당 일자 카드가 목록에서 사라짐 (책갈피만 꺼진 채 남지 않음)
3. 새로고침 후에도 복귀하지 않음

## Fast checks
```bash
rg -n "DELETE FROM workout_cards|dayCards|status === 'PLANNED'" backend/server/repositories/workout-log.repository.ts frontend/src/components/records/HistoryListPanel/HistoryListPanel.tsx
```

## as-is → to-be
| as-is | to-be |
|-------|--------|
| Logs cleared; COMPLETED cards stay with bookmark off | Day cards fully removed |
