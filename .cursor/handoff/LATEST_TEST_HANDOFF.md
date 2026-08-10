# Test handoff ??Fix admin system restore JSON bind

## Summary
관리자 ?�체 복구가 `invalid input syntax for type json`�??�패. `workout_logs.set_weights_kg` ??jsonb 배열??node-pg가 PG 배열�?바인?�해??발생. json/jsonb 컬럼?� `JSON.stringify` ???�입.

## Git
- branch: `main`
- commit: `8d4b92f9`

## Changed files
- `backend/server/services/system-backup.service.ts`

## Test focus
1. 관리자 ?�스??백업 ZIP?�로 ?�체 복구(YES) ?�공
2. ?�패 ???�스??로그???�제 ?�이�??�류 문구 ?�출

## Fast checks
```bash
rg -n "bindRowValues|loadJsonColumns|JSON.stringify" backend/server/services/system-backup.service.ts
```

## as-is ??to-be
- **as-is:** workout_logs upsert �?json 구문 ?�류 ??RESTORE_FAILED
- **to-be:** jsonb 배열 ?�상 복구

## Note
Backend only ??Render redeploy required.
