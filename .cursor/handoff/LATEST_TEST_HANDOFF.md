# Test handoff — Remove FitZone mock gyms from admin

## Summary
관리자 헬스장 페이지가 DB가 아니라 `MOCK_GYMS`(FitZone Gangnam 등)를 항상 보여주던 문제를 수정했습니다. 이제 `gyms` 테이블을 조회합니다. mock/seed 더미도 비웠습니다.

## Git
- branch: `main`
- commit: (push 후 갱신)

## Changed files
- `backend/server/repositories/admin.repository.ts`
- `backend/server/services/admin.service.ts`
- `backend/server/controllers/admin.controller.ts`
- `backend/server/data/mock.ts`
- `backend/server/repositories/gym-directory.repository.ts`
- `database/seeds/gyms.sql`

## Test focus
1. 관리자 > 헬스장에 FitZone / Iron Temple / PowerHouse 없음
2. 등록된 운영 헬스장이 없으면 빈 목록
3. (있을 때) 인증 토글이 실제 DB에 반영

## Fast checks
```bash
rg -n "FitZone" backend/server/data/mock.ts
rg -n "FROM gyms" backend/server/repositories/admin.repository.ts
```

## Note
**Render backend 재배포 필요.**

## as-is → to-be
- **as-is:** 더미 3개 항상 표시
- **to-be:** 실데이터만 (현재 DB gyms=0이면 빈 화면)
