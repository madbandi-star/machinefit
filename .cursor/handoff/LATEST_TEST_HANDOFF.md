# Test handoff — Fix backup restore `user_gym_id` error

## Summary
데이터관리 복구 시 `column gm.user_gym_id does not exist` 수정. `gym_members.gym_id`로 조인.

## Git
- branch: `main`
- commit: PENDING

## Changed files
- `backend/server/services/backup.service.ts`

## Test focus
1. 핏메이트4885 (member) → 마이페이지 데이터관리 복구 성공
2. 타 사용자 스코프 데이터는 건너뜀 유지

## Fast checks
```bash
rg -n "gm.gym_id|user_gym_id|scopeOwned" backend/server/services/backup.service.ts
```

## as-is → to-be
- **as-is:** 잘못된 컬럼 `gm.user_gym_id`로 복구 실패
- **to-be:** `gm.gym_id` + owner 검증으로 복구 가능

## Note
Render 백엔드 재배포 필요.
