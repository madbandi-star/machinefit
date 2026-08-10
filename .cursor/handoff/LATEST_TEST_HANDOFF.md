# Test handoff — Fix admin system restore JSON bind

## Summary
관리자 전체 복구가 `invalid input syntax for type json`로 실패. `workout_logs.set_weights_kg` 등 jsonb 배열을 node-pg가 PG 배열로 바인딩해서 발생. json/jsonb 컬럼은 `JSON.stringify` 후 삽입.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `backend/server/services/system-backup.service.ts`

## Test focus
1. 관리자 시스템 백업 ZIP으로 전체 복구(YES) 성공
2. 실패 시 토스트/로그에 실제 테이블 오류 문구 노출

## Fast checks
```bash
rg -n "bindRowValues|loadJsonColumns|JSON.stringify" backend/server/services/system-backup.service.ts
```

## as-is → to-be
- **as-is:** workout_logs upsert 중 json 구문 오류 → RESTORE_FAILED
- **to-be:** jsonb 배열 정상 복구

## Note
Backend only — Render redeploy required.
