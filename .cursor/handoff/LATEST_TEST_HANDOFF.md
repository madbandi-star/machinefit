# Test handoff — Perf / network / workout UX

## Summary
운동기록 silent 저장의 invalidate 폭주·패널 잠금 제거, IndexedDB draft+sync queue, 네트워크 배너, 로그인 시 캐시 부분 삭제, 공유/근육 이미지 압축, AdminLayout·admin i18n 지연 로드.

## Fast checks
```
npm run typecheck --prefix frontend
rg -n "enqueueSilentSave|flushWorkoutSyncQueue|API_TIMEOUT_MS" frontend/src
```

## Production
- Pages: FE
- Render: workout-log `Idempotency-Key` middleware

## As-is → To-be
- as-is: 세트 완료마다 전체 refetch + 버튼 잠금
- to-be: 즉시 UI + 백그라운드 sync, 오프라인 유지
